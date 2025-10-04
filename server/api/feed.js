import { defineEventHandler, getQuery } from 'h3';
import { fireService } from '../services/FireService.js'; // FIXED: Direct import

export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);

        let fires = await fireService.find(query);

        // Apply sorting (Largest to smallest by default)
        fires = fires.sort((a, b) => {
            return b.properties.area - a.properties.area;
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
