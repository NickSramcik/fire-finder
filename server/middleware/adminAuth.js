// server/middleware/adminAuth.js

// Routes + methods that require admin access
const PROTECTED = [
    { path: '/api/fire', method: 'POST' },
    { path: '/api/perimeter', method: 'POST' },
    { path: '/api/hotspots', method: 'POST' },
    { path: '/api/fire', method: 'DELETE' },
    { path: '/api/perimeter', method: 'DELETE' },
    { path: '/api/hotspots', method: 'DELETE' },
];

export default defineEventHandler(async event => {
    const { method, path } = event;

    const isProtected = PROTECTED.some(
        rule => path.startsWith(rule.path) && method === rule.method
    );

    if (!isProtected) return;

    // Path 1: machine-to-machine (GitHub Actions scheduler)
    const adminKey = getHeader(event, 'x-admin-key');
    const { adminSecret } = useRuntimeConfig(event);

    if (adminKey) {
        if (!adminSecret) {
            throw createError({
                statusCode: 500,
                statusMessage:
                    'Server misconfiguration: ADMIN_SECRET is not set',
            });
        }
        if (adminKey === adminSecret) return; // Authorized
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: invalid admin key',
        });
    }

    // Path 2: browser session (human admin)
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: not signed in',
        });
    }

    if (!session.user.isAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized user',
        });
    }

    // Re-verify isAdmin from DB — don't trust cookie alone for write operations
    const User = (await import('../models/User.js')).default;
    const dbUser = await User.findById(session.user.id).select('isAdmin');

    if (!dbUser) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: user not found',
        });
    }

    if (!dbUser.isAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized user',
        });
    }
});
