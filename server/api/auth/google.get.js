import User from '../../models/User.js';

export default defineOAuthGoogleEventHandler({
    async onSuccess(event, { user: googleUser }) {
        // Find or create user in MongoDB
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            user = await User.create({
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                provider: 'google',
            });
        } else {
            // Refresh name/avatar and record login time
            user.name = googleUser.name;
            user.avatar = googleUser.picture;
            user.lastLoginAt = new Date();
            await user.save();
        }

        // Store minimal session data — don't store isAdmin in the cookie,
        // always re-check from DB on sensitive operations
        await setUserSession(event, {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
            },
        });

        return sendRedirect(event, '/');
    },

    onError(event, error) {
        console.error('Google OAuth error:', error);
        return sendRedirect(event, '/?authError=google');
    },
});
