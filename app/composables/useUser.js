import { computed } from 'vue';

export function useUser() {
    const {
        loggedIn,
        user,
        session,
        fetch: refreshSession,
        clear,
    } = useUserSession();

    async function signInWithGoogle() {
        await navigateTo('/api/auth/google', { external: true });
    }

    // async function signInWithApple() {
    //     await navigateTo('/api/auth/apple', { external: true });
    // }

    async function signOut() {
        await navigateTo('/api/auth/logout', { external: true });
    }

    const isAdmin = computed(() => user.value?.isAdmin === true);

    return {
        loggedIn,
        user,
        session,
        isAdmin,
        refreshSession,
        signInWithGoogle,
        // signInWithApple,
        signOut,
    };
}
