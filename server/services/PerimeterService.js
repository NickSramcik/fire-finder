import Perimeter from '../models/Perimeter.js';

export class PerimeterService {
    constructor() {
        this.model = Perimeter;
    }

    // Data Access Methods
    async find(query = {}) {
        const dbQuery = this.mapQuery(query);
        let mongooseQuery = this.model.find(dbQuery);

        if (query.limit) {
            mongooseQuery = mongooseQuery.limit(parseInt(query.limit));
        }

        if (query.skip) {
            mongooseQuery = mongooseQuery.skip(parseInt(query.skip));
        }

        // Default: most recent first
        mongooseQuery = mongooseQuery.sort({ 'properties.lastUpdated': -1 });

        return mongooseQuery.exec();
    }

    async findOne(sourceId) {
        return this.model.findOne({ 'properties.sourceId': sourceId });
    }

    async create(perimeterData) {
        const newPerimeter = new this.model(perimeterData);
        return newPerimeter.save();
    }

    async update(sourceId, updateData) {
        return this.model.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            updateData,
            { new: true, runValidators: true }
        );
    }

    async delete(query = {}) {
        const dbQuery = this.mapQuery(query);

        if (Object.keys(dbQuery).length === 0) {
            throw new Error('Delete query requires filters');
        }

        return this.model.deleteMany(dbQuery);
    }

    // External Data Integration
    async renewPerimeters() {
        const perimeterData = await this.fetchPerimeters();
        console.log(
            `List of perimeters: ${perimeterData
                .map(p => p.properties.poly_IncidentName)
                .join(', ')}`
        );
        let added = 0,
            updated = 0,
            failed = [];

        for (const rawPerimeter of perimeterData) {
            const processedPerimeter = this.processPerimeter(rawPerimeter);
            const sourceId = processedPerimeter.properties.sourceId;

            try {
                const existing = await this.findOne(sourceId);
                if (existing) {
                    await this.update(sourceId, processedPerimeter);
                    updated++;
                } else {
                    await this.create(processedPerimeter);
                    added++;
                }
            } catch (error) {
                failed.push(processedPerimeter.properties.name);
                console.error(`Error processing perimeter ${sourceId}:`, error);
            }
        }

        console.log(
            `Added ${added} perimeters and Updated ${updated} perimeters`
        );
        if (failed.length)
            console.log(
                `Failed to process ${failed.length} perimeters: ${failed}`
            );

        await this.cleanupOldPerimeters();
        await this.removeDuplicatePerimeters();
        return { added, updated };
    }

    async fetchPerimeters() {
        const perimeterUrl =
            'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,poly_DateCurrent,attr_UniqueFireIdentifier&f=pgeojson';

        try {
            const response = await fetch(perimeterUrl);
            const data = await response.json();
            console.log(`Fetched ${data.features.length} Fire Perimeters`);
            return data.features;
        } catch (err) {
            console.error('Error fetching perimeter data:', err);
            throw err;
        }
    }

    // Data Processing
    processPerimeter(rawPerimeter) {
        const processedPerimeter = {
            ...rawPerimeter,
            properties: {
                sourceId: rawPerimeter.properties.attr_UniqueFireIdentifier,
                name: this.fixPerimeterName(rawPerimeter),
                lastUpdated: new Date(rawPerimeter.properties.poly_DateCurrent),
            },
        };

        return processedPerimeter;
    }

    fixPerimeterName(rawPerimeter) {
        const oldName = rawPerimeter.properties.poly_IncidentName;
        let newName = !oldName
            ? 'Unknown'
            : oldName
                  .trim()
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase());

        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                    default:
                        return match;
                }
            });
        }

        return newName;
    }

    // Data Maintenance
    async cleanupOldPerimeters(daysThreshold = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });
        console.log(`Cleaned up ${result.deletedCount} old perimeters`);
        return result;
    }

    async removeDuplicatePerimeters() {
        const duplicates = await this.model.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            { $match: { count: { $gt: 1 } } },
        ]);

        let deletedCount = 0;
        for (const group of duplicates) {
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await this.model.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate perimeters`);
        return { deletedCount };
    }

    // Queries
    async findRecentPerimeters(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.find({
            minLastUpdated: cutoffDate.toISOString(),
        });
    }

    async findOrphanedPerimeters(fireSourceIds) {
        return this.model.find({
            'properties.sourceId': { $nin: fireSourceIds },
        });
    }

    // Metadata
    async getPerimeterStats() {
        const [allPerimeters, recentPerimeters] = await Promise.all([
            this.find(),
            this.findRecentPerimeters(7),
        ]);

        const fireSourceIds = []; // Would come from FireService in real implementation
        const orphanedPerimeters = await this.findOrphanedPerimeters(
            fireSourceIds
        );

        return {
            total: allPerimeters.length,
            recent: recentPerimeters.length,
            orphaned: orphanedPerimeters.length,
            orphanedPercentage:
                Math.round(
                    (orphanedPerimeters.length / allPerimeters.length) * 100
                ) || 0,
        };
    }

    // Query Mapping
    mapQuery(apiQuery) {
        const dbQuery = {};

        // Field mappings
        const fieldMap = {
            sourceId: 'properties.sourceId',
            name: 'properties.name',
        };

        for (const [apiField, dbField] of Object.entries(fieldMap)) {
            if (apiQuery[apiField] !== undefined) {
                dbQuery[dbField] = apiQuery[apiField];
            }
        }

        // Time-based filters
        if (apiQuery.minLastUpdated) {
            dbQuery['properties.lastUpdated'] = {
                $gte: new Date(apiQuery.minLastUpdated),
            };
        }

        if (apiQuery.maxLastUpdated) {
            dbQuery['properties.lastUpdated'] = {
                ...dbQuery['properties.lastUpdated'],
                $lte: new Date(apiQuery.maxLastUpdated),
            };
        }

        return dbQuery;
    }
}

export const perimeterService = new PerimeterService();
