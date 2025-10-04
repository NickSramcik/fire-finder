import { ref } from 'vue';

// Generic API data fetcher with error handling and caching
export function useApiData() {
    const data = ref(null);
    const loading = ref(false);
    const error = ref(null);

    async function fetchData(url, options = {}) {
        loading.value = true;
        error.value = null;

        try {
            const response = await $fetch(url, {
                timeout: 10000, // 10 seconds for slow connections
                retry: 1,
                retryDelay: 500,
                ...options,
            });

            if (!response || response.statusCode >= 400) {
                throw new Error(
                    response?.statusMessage || 'Failed to fetch data'
                );
            }

            data.value = response.data || response;
            return data.value;
        } catch (err) {
            error.value = {
                message: err.message,
                timestamp: new Date().toISOString(),
                url,
            };
            console.error('API fetch error:', err);
            return null;
        } finally {
            loading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    function clearData() {
        data.value = null;
    }

    return {
        data,
        loading,
        error,
        fetchData,
        clearError,
        clearData,
    };
}
