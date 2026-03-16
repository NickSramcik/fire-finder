import { ref, computed } from 'vue';
import { useApiData } from './useApiData.js';

export function useHotspotData() {
    const { data, loading, error, fetchData, clearError } = useApiData();

    const filters = ref({
        minConfidence: 30,
        minBrightness: 320,
        hours: 24,
    });

    // Computed properties
    const highConfidenceHotspots = computed(() => {
        if (!data.value) return [];
        return data.value.filter(
            hotspot => hotspot.properties.confidence >= 80
        );
    });

    const recentHotspots = computed(() => {
        if (!data.value) return [];
        const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours
        return data.value.filter(
            hotspot => new Date(hotspot.properties.acquisitionDate) > cutoff
        );
    });

    // Methods
    async function fetchHotspots(params = {}) {
        const queryParams = new URLSearchParams();

        // Apply filters
        if (filters.value.minConfidence > 0) {
            queryParams.append('minConfidence', filters.value.minConfidence);
        }
        if (filters.value.minBrightness > 0) {
            queryParams.append('minBrightness', filters.value.minBrightness);
        }

        // Merge custom params
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });

        return await fetchData(`/api/hotspots?${queryParams}`);
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters };
    }

    return {
        // State
        hotspots: data,
        loading,
        error,
        filters,

        // Computed
        highConfidenceHotspots,
        recentHotspots,

        // Methods
        fetchHotspots,
        setFilters,
        clearError,
    };
}
