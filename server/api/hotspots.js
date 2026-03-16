import { defineEventHandler, getQuery, readBody } from 'h3';
import { hotspotService } from '../services/HotspotService.js';
import { cache } from '../utils/cache.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET - Fetch hotspots with caching
        if (event.method === 'GET') {
            const cacheKey = `hotspots:${JSON.stringify(queryParams)}`;
            const cached = cache.get(cacheKey);

            if (cached) {
                console.log('Using cached hotspots data');
                return cached;
            }

            const hotspots = await hotspotService.find(queryParams);
            const result = { statusCode: 200, data: hotspots };

            // Cache for 5 minutes (hotspots update every 3-6 hours)
            cache.set(cacheKey, result, 300000);
            return result;
        }

        // POST - Handle renew action
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                console.log('Renewing hotspot data from NASA FIRMS...');

                // Optional area parameter for targeted updates
                const area = body.area || null;
                const days = body.days || 1;

                const result = await hotspotService.renewHotspots(area, days);

                // Clear relevant cache entries
                cache.delete(/^hotspots:/);
                console.log('Hotspot data renewed successfully');

                return { statusCode: 200, data: result };
            }

            // Handle creating individual hotspots if needed
            if (body.geometry && body.properties) {
                const newHotspot = await hotspotService.create(body);
                return { statusCode: 201, data: newHotspot };
            }

            return createError({
                statusCode: 400,
                statusMessage: 'Invalid action or missing required fields',
            });
        }

        // PUT - Update existing hotspot
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.properties?.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedHotspot = await hotspotService.update(
                body.properties.sourceId,
                body
            );

            // Clear cache for this hotspot
            cache.delete(/^hotspots:/);
            return { statusCode: 200, data: updatedHotspot };
        }

        // DELETE - Remove hotspots
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'Filter parameters required for deletion',
                });
            }

            const result = await hotspotService.delete(queryParams);

            // Clear all hotspots cache
            cache.delete(/^hotspots:/);
            return {
                statusCode: 200,
                data: { deletedCount: result.deletedCount },
            };
        }

        return createError({
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
        });
    } catch (error) {
        console.error('Error in hotspots API:', error);
        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
