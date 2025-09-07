import { defineEventHandler } from 'h3';
import { getFires } from '../utils/fireHandler';
import { getPerimeters } from '../utils/perimeterHandler';

export default defineEventHandler(async () => {
    try {
        const [fires, perimeters] = await Promise.all([
            getFires(),
            getPerimeters(),
        ]);

        return { fires, perimeters };
    } catch (error) {
        console.error('Error fetching map data:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});
