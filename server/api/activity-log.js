import { defineEventHandler } from 'h3';
import ActivityLog from '../models/ActivityLog.js';

// Admin-only guard — reused for both methods
async function requireAdmin(event) {
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    if (!session.user.isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }
}

export default defineEventHandler(async event => {
    try {
        await requireAdmin(event);

        // GET — return log entries newest first
        if (event.method === 'GET') {
            // $natural: -1 returns capped collection in reverse insertion order
            const logs = await ActivityLog.find()
                .sort({ $natural: -1 })
                .limit(50)
                .lean();

            return { statusCode: 200, data: logs };
        }

        // DELETE — clear all log entries
        if (event.method === 'DELETE') {
            await ActivityLog.deleteMany({});
            return { statusCode: 200, data: { cleared: true } };
        }

        throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });

    } catch (error) {
        if (error.statusCode) throw error;
        console.error('Error in activity-log API:', error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});
