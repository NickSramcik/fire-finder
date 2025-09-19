import { defineEventHandler, getQuery } from 'h3';
import { getFires } from '../utils/fireHandler';
import { getPerimeters } from '../utils/perimeterHandler';
import { cache } from '../utils/cache';
import mongoose from 'mongoose';

export default defineEventHandler(async event => {
    try {
        console.log('Map data request received - DB readyState:', mongoose.connection.readyState);
        console.log('Registered models:', mongoose.modelNames());
        console.log(
            'Map data request received - DB readyState:',
            mongoose.connection.readyState
        );
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
            getFires(filters),
            getPerimeters(),
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
