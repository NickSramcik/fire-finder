// server/middleware/adminAuth.js

// Routes + methods that require admin access
const PROTECTED = [
    { path: '/api/fire', method: 'POST' },
    { path: '/api/perimeter', method: 'POST' },
    { path: '/api/fire', method: 'DELETE' },
    { path: '/api/perimeter', method: 'DELETE' },
];

export default defineEventHandler(async event => {
    const { method, path } = event;

    const isProtected = PROTECTED.some(
        rule => path.startsWith(rule.path) && method === rule.method
    );

    if (!isProtected) return; // Not a protected route — carry on

    // Path 1: machine-to-machine (GitHub Actions scheduler)
    const adminKey = getHeader(event, 'x-admin-key');
    const { adminSecret } = useRuntimeConfig(event);

    if (adminSecret && adminKey === adminSecret) return; // Authorized

    // Path 2: browser session (human admin)
    const session = await getUserSession(event);

    if (session?.user?.isAdmin === true) {
        // Re-verify isAdmin from DB — don't trust cookie alone for write operations
        const User = (await import('../models/User.js')).default;
        const dbUser = await User.findById(session.user.id).select('isAdmin');

        if (dbUser?.isAdmin === true) return; // Authorized
    }

    // Neither path passed
    throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
    });
});
