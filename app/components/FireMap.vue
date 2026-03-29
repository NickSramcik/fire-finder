<template>
  <div>
    <div id="map" />

    <!-- Map Error -->
    <div v-if="showMapError" class="error-banner">
      Map Error: {{ mapError }}
      <button class="ml-4 px-2 py-1 bg-white text-red-600 rounded text-sm" @click="dismissMapError">
        Dismiss
      </button>
    </div>

    <!-- Data Error -->
    <div v-if="showDataError" class="error-banner">
      Data Error: {{ dataError.message }}
      <button class="ml-4 px-2 py-1 bg-white text-red-600 rounded text-sm" @click="dismissDataError">
        Dismiss
      </button>
    </div>

    <!-- Hotspot Error -->
    <div v-if="showHotspotError" class="error-banner">
      Hotspot Error: {{ hotspotError.message }}
      <button class="ml-4 px-2 py-1 bg-white text-red-600 rounded text-sm" @click="dismissHotspotError">
        Dismiss
      </button>
    </div>

    <div v-if="loading" class="loading-overlay">
      Loading fire data...
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useFireData } from '~/composables/useFireData';
import { useHotspotData } from '~/composables/useHotspotData';
import { useMap } from '~/composables/useMap';

// Fire data
const {
  fires,
  loading,
  error: dataError,
  fetchFires,
  clearError: clearDataError,
} = useFireData();

// Hotspot data
const {
  hotspots,
  error: hotspotError,
  fetchHotspots,
  clearError: clearHotspotError,
} = useHotspotData();

// Map
const {
  mapLoaded,
  mapError,
  initializeMap,
  loadMapIcons,
  addFireLayer,
  addPerimeterLayer,
  addHotspotLayer,
  addHotspotPopupInteractivity,
  addPopupInteractivity,
} = useMap();

// Error dismiss state
const showMapError = ref(false);
const showDataError = ref(false);
const showHotspotError = ref(false);

watch(mapError, newError => {
  if (newError) showMapError.value = true;
});

watch(dataError, newError => {
  if (newError) showDataError.value = true;
});

watch(hotspotError, newError => {
  if (newError) showHotspotError.value = true;
});

// Initialize on mount
onMounted(async () => {
  try {
    initializeMap('map');

    // Fetch fire and hotspot data in parallel
    await Promise.allSettled([
      fetchFires({ hasArea: 'true' }),
      fetchHotspots(),
    ]);
  } catch (err) {
    console.error('Failed to initialize map or fetch data:', err);
  }
});

// Render fire + perimeter layers once map and fire data are ready
watch([mapLoaded, fires], async () => {
  if (!mapLoaded.value || !fires.value || mapError.value) return;

  try {
    console.log('Setting up fire layers...');

    const iconsLoaded = await loadMapIcons();
    if (!iconsLoaded) console.warn('Icons failed to load, but continuing...');

    const firePoints = Array.isArray(fires.value) ? fires.value : fires.value.fires;
    const perimeterData = Array.isArray(fires.value) ? [] : fires.value.perimeters;

    if (firePoints?.length) {
      addFireLayer(firePoints);
      addPopupInteractivity();
    } else {
      console.log('No fire data to display');
    }

    if (perimeterData?.length) {
      addPerimeterLayer(perimeterData);
    } else {
      console.log('No perimeter data to display');
    }

    console.log('Fire layers setup complete');
  } catch (err) {
    console.error('Error setting up fire layers:', err);
  }
});

// Render hotspot layer once map and hotspot data are ready
watch([mapLoaded, hotspots], () => {
  if (!mapLoaded.value || !hotspots.value || mapError.value) return;

  try {
    console.log('Setting up hotspot layer...');

    if (hotspots.value?.length) {
      addHotspotLayer(hotspots.value);
      addHotspotPopupInteractivity();
      console.log(`Hotspot layer setup complete (${hotspots.value.length} hotspots)`);
    } else {
      console.log('No hotspot data to display');
    }
  } catch (err) {
    console.error('Error setting up hotspot layer:', err);
  }
});

// Auto-retry on data errors (but not map errors)
watch(dataError, newError => {
  if (newError && !mapError.value) {
    console.log('Fire data error — retrying in 10s...');
    setTimeout(() => fetchFires({ hasArea: 'true' }), 10000);
  }
});

watch(hotspotError, newError => {
  if (newError && !mapError.value) {
    console.log('Hotspot data error — retrying in 10s...');
    setTimeout(() => fetchHotspots(), 10000);
  }
});

// Dismiss handlers
function dismissMapError() { showMapError.value = false; }
function dismissDataError() { showDataError.value = false; clearDataError(); }
function dismissHotspotError() { showHotspotError.value = false; clearHotspotError(); }
</script>

<style>
@import 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css';

#map {
  position: fixed;
  width: 100%;
  height: 100%;
}

.mapboxgl-popup {
  max-width: 300px;
}

.mapboxgl-popup-content {
  background-color: var(--color-base-200);
  opacity: 90%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 1rem;
}

.mapboxgl-popup-tip {
  border-bottom-color: var(--color-base-200) !important;
  opacity: 90%;
}

.mapboxgl-popup-close-button {
  height: 16px;
  width: 16px;
  margin-right: 10px;
  margin-top: 10px;
  background-color: var(--color-base-200);
}

.error-banner {
  z-index: 90;
  position: fixed;
  top: 4rem;
  left: 0;
  right: 0;
  background-color: #dc2626;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-overlay {
  z-index: 99;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
}
</style>
