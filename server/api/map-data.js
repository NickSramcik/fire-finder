import { defineEventHandler, getQuery } from 'h3';
import { fireService } from '../services/FireService.js';
import { perimeterService } from '../services/PerimeterService.js';
import { cache } from '../utils/cache.js';

export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);
        const cacheKey = `map-data:${JSON.stringify(query)}`;

        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('Using cache...');
            return cached;
        }

        const filters = {};

        if (query.minLastUpdated) {
            filters.minLastUpdated = new Date(query.minLastUpdated);
        }

        if (query.hasArea === 'true') {
            filters.hasArea = true;
        }

        const [fires, perimeters] = await Promise.all([
            fireService.find(filters),
            perimeterService.find(),
        ]);

        const result = { fires, perimeters };

        // Cache the result
        cache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error fetching map data:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});
