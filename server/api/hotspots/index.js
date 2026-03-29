import { defineEventHandler, getQuery, readBody } from 'h3';
import { hotspotService } from '../../services/HotspotService.js';
import { cache } from '../../utils/cache.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET — fetch hotspots with caching
        if (event.method === 'GET') {
            const cacheKey = `hotspots:${JSON.stringify(queryParams)}`;
            const cached = cache.get(cacheKey);

            if (cached) {
                console.log('Using cached hotspots data');
                return cached;
            }

            const hotspots = await hotspotService.find(queryParams);
            const result = { statusCode: 200, data: hotspots };

            cache.set(cacheKey, result, 300000); // 5 minutes
            return result;
        }

        // POST — renew or reset
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                console.log('Renewing hotspot data from NASA...');
                const area = body.area || null;
                const days = body.days || 1;
                const result = await hotspotService.renewHotspots(area, days, 'manual');
                cache.delete(/^hotspots:/);
                return { statusCode: 200, data: result };
            }

            if (body.action === 'reset') {
                console.log('Resetting hotspot data...');
                const days = body.days || 7;
                const result = await hotspotService.resetHotspots(days);
                cache.delete(/^hotspots:/);
                return { statusCode: 200, data: result };
            }

            // Create individual hotspot
            if (body.geometry && body.properties) {
                const newHotspot = await hotspotService.create(body);
                return { statusCode: 201, data: newHotspot };
            }

            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid action or missing required fields',
            });
        }

        // PUT — update existing hotspot
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.properties?.sourceId) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedHotspot = await hotspotService.update(
                body.properties.sourceId,
                body
            );
            cache.delete(/^hotspots:/);
            return { statusCode: 200, data: updatedHotspot };
        }

        // DELETE
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Filter parameters required for deletion',
                });
            }

            const result = await hotspotService.delete(queryParams);
            cache.delete(/^hotspots:/);
            return { statusCode: 200, data: { deletedCount: result.deletedCount } };
        }

        throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });

    } catch (error) {
        if (error.statusCode) throw error;
        console.error('Error in hotspots API:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
