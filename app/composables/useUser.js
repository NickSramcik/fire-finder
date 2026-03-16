export function useUser() {
    const {
        loggedIn,
        user,
        session,
        fetch: refreshSession,
        clear,
    } = useUserSession();

    async function signInWithGoogle() {
        await navigateTo('/auth/google', { external: true });
    }

    async function signInWithApple() {
        await navigateTo('/auth/apple', { external: true });
    }

    async function signOut() {
        await navigateTo('/auth/logout', { external: true });
    }

    const isAdmin = computed(() => user.value?.isAdmin === true);

    return {
        loggedIn,
        user,
        session,
        isAdmin,
        refreshSession,
        signInWithGoogle,
        signInWithApple,
        signOut,
    };
}
