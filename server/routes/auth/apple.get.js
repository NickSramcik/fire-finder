// TODO: Apple OAuth requires extra setup vs Google:
//   - A Services ID (not App ID) as the clientId
//   - A private key (.p8 file) — the clientSecret is a JWT you generate from it
//   - apple-signin-auth or similar to generate that JWT
// See: https://developer.apple.com/documentation/sign_in_with_apple/configuring_your_environment_for_sign_in_with_apple
// nuxt-auth-utils handles the callback flow; you supply the credentials above.
import User from '../../models/User.js';

export default defineOAuthAppleEventHandler({
    async onSuccess(event, { user: appleUser }) {
        // IMPORTANT: Apple only sends the user's name on the VERY FIRST sign-in.
        // On subsequent logins, appleUser.name will be undefined.
        // Always fall back to whatever is stored in the DB.
        let user = await User.findOne({ email: appleUser.email });

        if (!user) {
            user = await User.create({
                email: appleUser.email,
                name: appleUser.name || appleUser.email.split('@')[0],
                provider: 'apple',
            });
        } else {
            user.lastLoginAt = new Date();
            // Only update name if Apple actually provided one (first sign-in)
            if (appleUser.name) user.name = appleUser.name;
            await user.save();
        }

        await setUserSession(event, {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar || null,
                isAdmin: user.isAdmin,
            },
        });

        return sendRedirect(event, '/');
    },

    onError(event, error) {
        console.error('Apple OAuth error:', error);
        return sendRedirect(event, '/?authError=apple');
    },
});
