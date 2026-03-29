import { defineEventHandler } from 'h3';
import ActivityLog from '../models/ActivityLog.js';

export default defineEventHandler(async event => {
    // Admin-only — check session directly since adminAuth only guards POST/DELETE
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    if (!session.user.isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    try {
        // $natural: -1 returns capped collection in reverse insertion order (newest first)
        const logs = await ActivityLog.find()
            .sort({ $natural: -1 })
            .limit(50)
            .lean();

        return { statusCode: 200, data: logs };
    } catch (error) {
        console.error('Error fetching activity log:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});
