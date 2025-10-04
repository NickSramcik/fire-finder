import { BaseRepository } from './BaseRepository.js';
import Perimeter from '../models/Perimeter.js';

export class PerimeterRepository extends BaseRepository {
    constructor() {
        super();
        this.model = Perimeter;
    }

    async find(query = {}) {
        const dbQuery = this.mapQuery(query, {
            sourceId: 'properties.sourceId',
            status: 'properties.status',
        });
        return this.model.find(dbQuery);
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
        const dbQuery = this.mapQuery(query, {
            sourceId: 'properties.sourceId',
            status: 'properties.status',
        });

        if (Object.keys(dbQuery).length === 0) {
            throw new Error('Delete query requires filters');
        }

        return this.model.deleteMany(dbQuery);
    }

    async deleteOld(daysThreshold = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });
        console.log(`Cleaned up ${result.deletedCount} old perimeters`);
        return result;
    }

    async removeDuplicates() {
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
}

export const perimeterRepository = new PerimeterRepository();
