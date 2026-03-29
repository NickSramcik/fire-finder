import Perimeter from '../models/Perimeter.js';
import { logActivity } from '../utils/logger.js';

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
    async renewPerimeters(trigger = 'auto') {
        let perimeterData;
        try {
            perimeterData = await this.fetchPerimeters();
        } catch (err) {
            await logActivity({
                type: 'error',
                source: 'perimeter',
                trigger,
                message: `Perimeter fetch failed: ${err.message}`,
                details: { error: err.message },
            });
            throw err;
        }

        console.log(
            `List of perimeters: ${perimeterData
                .map(p => p.properties.poly_IncidentName)
                .join(', ')}`
        );

        const operations = perimeterData.map(rawPerimeter => {
            const processedPerimeter = this.processPerimeter(rawPerimeter);
            return {
                updateOne: {
                    filter: {
                        'properties.sourceId':
                            processedPerimeter.properties.sourceId,
                    },
                    update: { $set: processedPerimeter },
                    upsert: true,
                },
            };
        });

        let added = 0,
            updated = 0,
            failed = [];

        try {
            const result = await this.model.bulkWrite(operations, {
                ordered: false,
            });
            added = result.upsertedCount;
            updated = result.modifiedCount;
        } catch (error) {
            if (error.writeErrors?.length) {
                failed = error.writeErrors.map(
                    e =>
                        operations[e.index]?.updateOne?.update?.$set?.properties
                            ?.name ?? 'unknown'
                );
                added = error.result?.upsertedCount ?? 0;
                updated = error.result?.modifiedCount ?? 0;
                error.writeErrors.forEach(e =>
                    console.error(
                        `Error processing perimeter ${
                            operations[e.index]?.updateOne?.filter?.[
                                'properties.sourceId'
                            ]
                        }:`,
                        e.errmsg
                    )
                );
            } else {
                await logActivity({
                    type: 'error',
                    source: 'perimeter',
                    trigger,
                    message: `Perimeter DB write failed: ${error.message}`,
                    details: { error: error.message, total: perimeterData.length },
                });
                console.error('Error during bulkWrite for perimeters:', error);
            }
        }

        console.log(`Added ${added} perimeters and Updated ${updated} perimeters`);
        if (failed.length) {
            console.log(`Failed to process ${failed.length} perimeters: ${failed}`);
        }

        await this.cleanupOldPerimeters();
        await this.removeDuplicatePerimeters();

        await logActivity({
            type: 'success',
            source: 'perimeter',
            trigger,
            message: `Perimeter renewal complete — ${added} added, ${updated} updated${failed.length ? `, ${failed.length} failed` : ''}`,
            details: { added, updated, total: perimeterData.length, failed: failed.length },
        });

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
            geometry: this.normalizeGeometry(rawPerimeter.geometry),
            properties: {
                sourceId: rawPerimeter.properties.attr_UniqueFireIdentifier,
                name: this.fixPerimeterName(rawPerimeter),
                lastUpdated: new Date(rawPerimeter.properties.poly_DateCurrent),
            },
        };

        return processedPerimeter;
    }

    // Normalize incoming GeoJSON geometry to MultiPolygon with correctly-wound
    // rings. MongoDB's 2dsphere index requires the GeoJSON right-hand rule:
    // exterior rings must be counterclockwise (positive signed area) and
    // interior rings must be clockwise (negative signed area). The NIFC API
    // doesn't guarantee this, so we re-wind any rings that violate it.
    // Interior rings (unburned islands inside a perimeter) are preserved.
    normalizeGeometry(geometry) {
        const signedArea = ring => {
            let area = 0;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
            }
            return area / 2;
        };

        const fixPolygon = rings =>
            rings.map((ring, i) => {
                const shouldBeCCW = i === 0; // exterior ring
                const isCCW = signedArea(ring) > 0;
                return shouldBeCCW === isCCW ? ring : [...ring].reverse();
            });

        if (geometry.type === 'Polygon') {
            return {
                type: 'MultiPolygon',
                coordinates: [fixPolygon(geometry.coordinates)],
            };
        }
        if (geometry.type === 'MultiPolygon') {
            return {
                type: 'MultiPolygon',
                coordinates: geometry.coordinates.map(fixPolygon),
            };
        }
        return geometry;
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

        const fireSourceIds = [];
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

        const fieldMap = {
            sourceId: 'properties.sourceId',
            name: 'properties.name',
        };

        for (const [apiField, dbField] of Object.entries(fieldMap)) {
            if (apiQuery[apiField] !== undefined) {
                dbQuery[dbField] = apiQuery[apiField];
            }
        }

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
