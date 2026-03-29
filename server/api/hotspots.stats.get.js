import { defineEventHandler } from 'h3';
import { hotspotService } from '../../services/HotspotService.js';

export default defineEventHandler(async () => {
    try {
        const stats = await hotspotService.getHotspotStatistics();
        return { statusCode: 200, data: stats };
    } catch (error) {
        console.error('Error fetching hotspot statistics:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
