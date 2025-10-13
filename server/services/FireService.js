import FirePoint from '../models/FirePoint.js';

export class FireService {
    constructor() {
        this.model = FirePoint;
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

        // Default: largest fires first
        mongooseQuery = mongooseQuery.sort({ 'properties.area': -1 });

        return mongooseQuery.exec();
    }

    async findOne(sourceId) {
        return this.model.findOne({ 'properties.sourceId': sourceId });
    }

    async create(fireData) {
        const newFire = new this.model(fireData);
        return newFire.save();
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
    async renewFires() {
        const fireData = await this.fetchFirePoints();
        let added = 0,
            updated = 0;

        for (const rawFire of fireData) {
            const processedFire = this.processFire(rawFire);
            const sourceId = processedFire.properties.sourceId;

            try {
                const existing = await this.findOne(sourceId);
                if (existing) {
                    await this.update(sourceId, processedFire);
                    updated++;
                } else {
                    await this.create(processedFire);
                    added++;
                }
            } catch (error) {
                console.error(`Error processing fire ${sourceId}:`, error);
            }
        }

        await this.cleanupOldFires();
        await this.removeDuplicateFires();
        return { added, updated };
    }

    async fetchFirePoints() {
        const firePointUrl =
            'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres,IncidentName,PercentContained,IncidentSize,FireBehaviorGeneral,FireCause,FireDiscoveryDateTime,FireBehaviorGeneral3,FireBehaviorGeneral2,FireBehaviorGeneral1,UniqueFireIdentifier,IncidentTypeCategory,IncidentShortDescription,POOState,POOCounty,POOJurisdictionalAgency,ModifiedOnDateTime_dt&f=pgeojson&token=';

        try {
            const response = await fetch(firePointUrl);
            const data = await response.json();
            console.log(`Fetched ${data.features.length} Fire Points`);
            return data.features;
        } catch (err) {
            console.error('Error fetching fire points:', err);
            throw err;
        }
    }

    // Data Processing
    processFire(rawPoint) {
        const processedPoint = {
            geometry: {
                type: 'Point',
                coordinates: rawPoint.geometry.coordinates,
            },
            properties: {
                sourceId: rawPoint.properties.UniqueFireIdentifier,
                name: this.fixFireName(rawPoint),
                fireType: rawPoint.properties.IncidentTypeCategory,
                landmark: rawPoint.properties.IncidentShortDescription,
                state: rawPoint.properties.POOState,
                county: rawPoint.properties.POOCounty,
                agency: rawPoint.properties.POOJurisdictionalAgency,
                discoveredAt: new Date(
                    rawPoint.properties.FireDiscoveryDateTime
                ),
                lastUpdated: new Date(
                    rawPoint.properties.ModifiedOnDateTime_dt
                ),
                status: this.fixFireStatus(rawPoint),
                area: rawPoint.properties.IncidentSize,
                containment: rawPoint.properties.PercentContained,
                cause: rawPoint.properties.FireCause,
                source: 'NIFC',
            },
        };

        return processedPoint;
    }

    fixFireName(rawPoint) {
        let newName = rawPoint.properties.IncidentName.trim()
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

    fixFireStatus(rawPoint) {
        const behaviors = [
            rawPoint.properties.FireBehaviorGeneral,
            rawPoint.properties.FireBehaviorGeneral1,
            rawPoint.properties.FireBehaviorGeneral2,
            rawPoint.properties.FireBehaviorGeneral3,
        ];

        let status = [...new Set(behaviors)]
            .filter(behavior => behavior !== null)
            .join(', ');

        return status || null;
    }

    // Data Maintenance
    async cleanupOldFires(daysThreshold = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });
        console.log(`Cleaned up ${result.deletedCount} old fires`);
        return result;
    }

    async removeDuplicateFires() {
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

        console.log(`Removed ${deletedCount} duplicate fires`);
        return { deletedCount };
    }

    // Queries
    async findActiveFires() {
        return this.find({
            status: 'Active',
            hasContainment: 'true',
            minArea: 100,
        });
    }

    async findLargeFires(minArea = 10000) {
        return this.find({
            minArea: minArea,
            hasArea: 'true',
        });
    }

    async findByState(state) {
        return this.find({ state });
    }

    // Metadata
    async getFireStatistics() {
        const [allFires, activeFires, largeFires] = await Promise.all([
            this.find(),
            this.findActiveFires(),
            this.findLargeFires(10000),
        ]);

        return {
            total: allFires.length,
            active: activeFires.length,
            large: largeFires.length,
            totalArea: allFires.reduce(
                (sum, fire) => sum + (fire.properties.area || 0),
                0
            ),
        };
    }

    // Query Mapping
    mapQuery(apiQuery) {
        const dbQuery = {};

        // Field mappings
        const fieldMap = {
            sourceId: 'properties.sourceId',
            status: 'properties.status',
            cause: 'properties.cause',
            fireType: 'properties.fireType',
            state: 'properties.state',
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

        // Existence filters
        if (apiQuery.hasArea === 'true') {
            dbQuery['properties.area'] = { $exists: true, $ne: null, $gt: 0 };
        }

        if (apiQuery.hasContainment === 'true') {
            dbQuery['properties.containment'] = { $exists: true, $ne: null };
        }

        // Comparison filters
        if (apiQuery.minArea) {
            dbQuery['properties.area'] = {
                ...dbQuery['properties.area'],
                $gte: parseInt(apiQuery.minArea),
            };
        }

        if (apiQuery.maxArea) {
            dbQuery['properties.area'] = {
                ...dbQuery['properties.area'],
                $lte: parseInt(apiQuery.maxArea),
            };
        }

        return dbQuery;
    }
}

export const fireService = new FireService();
