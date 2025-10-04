import { perimeterRepository } from '../repositories/PerimeterRepository.js';

export class PerimeterService {
    constructor(repository) {
        this.repository = repository;
    }

    async find(query = {}) {
        return this.repository.find(query);
    }

    async findOne(sourceId) {
        return this.repository.findOne(sourceId);
    }

    async create(perimeterData) {
        return this.repository.create(perimeterData);
    }

    async update(sourceId, updateData) {
        return this.repository.update(sourceId, updateData);
    }

    async delete(query = {}) {
        return this.repository.delete(query);
    }

    async renewPerimeters() {
        const perimeterData = await this.fetchPerimeters();
        console.log(`List of perimeters: ${perimeterData.map(p => p.properties.poly_IncidentName).join(', ')}`)
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
        let newName = !oldName ? 'Unknown' : rawPerimeter.properties.poly_IncidentName
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

    async cleanupOldPerimeters(daysThreshold = 90) {
        return this.repository.deleteOld(daysThreshold);
    }

    async removeDuplicatePerimeters() {
        return this.repository.removeDuplicates();
    }
}

export const perimeterService = new PerimeterService(perimeterRepository);
