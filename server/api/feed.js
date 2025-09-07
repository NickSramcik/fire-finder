import { defineEventHandler } from 'h3';
import { getFires } from '../utils/fireHandler';

// GET /api/feed - Get fire data for feed with optional sorting and filtering
export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);

        let fires = await getFires(query);

        // Apply sorting (most recent first by default)
        fires = fires.sort((a, b) => {
            const dateA = new Date(a.properties.discoveredAt || 0);
            const dateB = new Date(b.properties.discoveredAt || 0);
            return dateB - dateA; 
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
