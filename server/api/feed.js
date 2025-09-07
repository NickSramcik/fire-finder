import { defineEventHandler } from 'h3';
import { getFires } from '../utils/fireHandler';

// GET /api/feed - Get fire data for feed with optional sorting and filtering
export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);

        let fires = await getFires(query);

        // Apply sorting (Largest to smallest by default)
        fires = fires.sort((a, b) => {
            return b.properties.area - a.properties.area
        });

        // Apply limit if specified
        if (query.limit) {
            const limit = parseInt(query.limit);
            fires = fires.slice(0, limit);
        }

        return { statusCode: 200, data: fires };
    } catch (error) {
        console.error('Error fetching feed:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});
