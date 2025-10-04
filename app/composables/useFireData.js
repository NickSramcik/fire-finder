import { ref, computed } from 'vue';
import { useApiData } from './useApiData.js';

// Specialized composable for fire-related data
export function useFireData() {
    const { data, loading, error, fetchData, clearError } = useApiData();

    // Local state for fire-specific features
    const lastUpdated = ref(null);
    const filters = ref({
        minArea: 0,
        status: null,
        hasContainment: false,
    });

    // Computed properties for derived state
    const activeFires = computed(() => {
        if (!data.value) return [];

        return data.value.filter(
            fire =>
                fire.properties?.status !== 'Prescribed' &&
                fire.properties?.status !== 'Out'
        );
    });

    const largeFires = computed(() => {
        if (!data.value) return [];

        return data.value.filter(fire => fire.properties?.area > 10000); // Changed to 10k acres for "large"
    });

    const totalArea = computed(() => {
        if (!data.value) return 0;

        return data.value.reduce((sum, fire) => {
            return sum + (fire.properties?.area || 0);
        }, 0);
    });

    // Fire-specific methods
    async function fetchFires(params = {}) {
        const queryParams = new URLSearchParams();

        // Apply filters
        if (filters.value.minArea > 0) {
            queryParams.append('minArea', filters.value.minArea);
        }
        if (filters.value.status) {
            queryParams.append('status', filters.value.status);
        }
        if (filters.value.hasContainment) {
            queryParams.append('hasContainment', 'true');
        }

        // Merge with custom params
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });

        const result = await fetchData(`/api/map-data?${queryParams}`);

        if (result) {
            lastUpdated.value = new Date();
        }

        return result;
    }

    async function fetchFireFeed(limit = 50) {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('hasArea', 'true');

        return await fetchData(`/api/feed?${queryParams}`);
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters };
    }

    function clearFilters() {
        filters.value = {
            minArea: 0,
            status: null,
            hasContainment: false,
        };
    }

    // Find fire by sourceId
    function findFire(sourceId) {
        if (!data.value) return null;
        return data.value.find(fire => fire.properties?.sourceId === sourceId);
    }

    return {
        // State
        fires: data,
        loading,
        error,
        lastUpdated,
        filters,

        // Computed
        activeFires,
        largeFires,
        totalArea,

        // Methods
        fetchFires,
        fetchFireFeed,
        setFilters,
        clearFilters,
        clearError,
        findFire,
    };
}
