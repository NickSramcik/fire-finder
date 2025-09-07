import { defineEventHandler, getQuery } from 'h3';
import { getFires } from '../utils/fireHandler';
import { getPerimeters } from '../utils/perimeterHandler';

export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);
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

        return { fires, perimeters };
    } catch (error) {
        console.error('Error fetching map data:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});
