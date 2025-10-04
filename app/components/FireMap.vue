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
    
    <div v-if="loading" class="loading-overlay">
      Loading fire data...
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useFireData } from '~/composables/useFireData';
import { useMap } from '~/composables/useMap';

// Use composables
const { 
  fires, 
  loading, 
  error: dataError, 
  fetchFires,
  clearError: clearDataError
} = useFireData();

const { 
  mapLoaded, 
  mapError,
  initializeMap, 
  loadMapIcons, 
  addFireLayer, 
  addPerimeterLayer,
  addPopupInteractivity
} = useMap();

// Track dismissed errors
const dismissedMapError = ref(false);
const dismissedDataError = ref(false);

// Computed properties for showing errors
const showMapError = ref(false);
const showDataError = ref(false);

// Watch for new errors to reset dismiss state
watch(mapError, (newError) => {
  if (newError) {
    dismissedMapError.value = false;
    showMapError.value = true;
  }
});

watch(dataError, (newError) => {
  if (newError) {
    dismissedDataError.value = false;
    showDataError.value = true;
  }
});

// Initialize on mount
onMounted(async () => {
  try {
    // Initialize map first
    initializeMap('map');
    
    // Then fetch data
    await fetchFires({ hasArea: 'true' });
  } catch (err) {
    console.error('Failed to initialize map or fetch data:', err);
  }
});

// Watch for map readiness and data
watch([mapLoaded, fires], async () => {
  if (mapLoaded.value && fires.value && !mapError.value) {
    try {
      console.log('Setting up map layers...');
      
      const iconsLoaded = await loadMapIcons();
      if (!iconsLoaded) {
        console.warn('Icons failed to load, but continuing...');
      }
      
      const firePoints = Array.isArray(fires.value) ? fires.value : fires.value.fires;
      const perimeterData = Array.isArray(fires.value) ? [] : fires.value.perimeters;
      
      // Add data layers to map
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
      
      console.log('Map layers setup complete');
    } catch (err) {
      console.error('Error setting up map layers:', err);
    }
  }
});

// Auto-retry on data error (but not map error)
watch(dataError, (newError) => {
  if (newError && !mapError.value) {
    console.log('Data error detected, will retry in 10 seconds...');
    setTimeout(() => {
      fetchFires({ hasArea: 'true' });
    }, 10000);
  }
});

// Dismiss errors
function dismissMapError() {
  dismissedMapError.value = true;
  showMapError.value = false;
}

function dismissDataError() {
  dismissedDataError.value = true;
  showDataError.value = false;
  clearDataError();
}
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

/* FIXED: Error banner positioned below navbar */
.error-banner {
  z-index: 90; /* Below navbar but above map */
  position: fixed;
  top: 4rem; /* Position below navbar (navbar is ~4rem tall) */
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
