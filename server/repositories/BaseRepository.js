/* eslint-disable no-unused-vars */
// Abstract base class defining the repository interface
export class BaseRepository {
    constructor() {
    }

    async find(query = {}) {
        throw new Error('find method must be implemented');
    }

    async findOne(identifier) {
        throw new Error('findOne method must be implemented');
    }

    async create(data) {
        throw new Error('create method must be implemented');
    }

    async update(identifier, data) {
        throw new Error('update method must be implemented');
    }

    async delete(query = {}) {
        throw new Error('delete method must be implemented');
    }

    async deleteOld(cutoffDate) {
        throw new Error('deleteOld method must be implemented');
    }

    async removeDuplicates() {
        throw new Error('removeDuplicates method must be implemented');
    }

    // Common query mapping logic
    mapQuery(apiQuery, fieldMap) {
        const dbQuery = {};

        if (fieldMap) {
            for (const [apiField, dbField] of Object.entries(fieldMap)) {
                if (apiQuery[apiField]) {
                    dbQuery[dbField] = apiQuery[apiField];
                }
            }
        }

        // Special handling for dates
        if (apiQuery.minLastUpdated) {
            dbQuery['properties.lastUpdated'] = {
                $gte: new Date(apiQuery.minLastUpdated),
            };
        }

        if (apiQuery.hasArea) {
            dbQuery['properties.area'] = { $exists: true, $ne: null };
        }

        return dbQuery;
    }
}
