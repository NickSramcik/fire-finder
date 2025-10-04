import { fireRepository } from '../repositories/FireRepository.js';

export class FireService {
    constructor(repository) {
        this.repository = repository;
    }

    async find(query = {}) {
        return this.repository.find(query);
    }

    async findOne(sourceId) {
        return this.repository.findOne(sourceId);
    }

    async create(fireData) {
        return this.repository.create(fireData);
    }

    async update(sourceId, updateData) {
        return this.repository.update(sourceId, updateData);
    }

    async delete(query = {}) {
        return this.repository.delete(query);
    }

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

    processFire(rawPoint) {
        let prescribed = false;

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
                status: this.fixFireStatus(rawPoint, prescribed),
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

    fixFireStatus(rawPoint, prescribed) {
        const behaviors = [
            rawPoint.properties.FireBehaviorGeneral,
            rawPoint.properties.FireBehaviorGeneral1,
            rawPoint.properties.FireBehaviorGeneral2,
            rawPoint.properties.FireBehaviorGeneral3,
        ];

        let status = [...new Set(behaviors)]
            .filter(behavior => behavior !== null)
            .join(', ');

        if (!status) {
            return prescribed ? 'Prescribed' : null;
        }

        return status;
    }

    async cleanupOldFires(daysThreshold = 90) {
        return this.repository.deleteOld(daysThreshold);
    }

    async removeDuplicateFires() {
        return this.repository.removeDuplicates();
    }
}

export const fireService = new FireService(fireRepository);
