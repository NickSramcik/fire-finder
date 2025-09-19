<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;
if (!mapboxgl.accessToken) console.error('Mapbox Token missing!');

const map = ref(null);
const loading = ref(true);
const error = ref(null);

// Data storage
const fires = ref([]);
const perimeters = ref([]);

// Calculate date for filtering (last 3 months)
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

// Build query parameters
const queryParams = new URLSearchParams({
  // minLastUpdated: threeMonthsAgo.toISOString(),
  hasArea: 'true'
});

async function fetchMapData() {
  try {
    loading.value = true;
    error.value = null;
    
    // Use $fetch instead of useFetch for more control
    const mapData = await $fetch(`/api/map-data?${queryParams}`, {
      timeout: 5000,
      retry: 1,
      retryDelay: 100
    });
    
    // Check if we actually got data
    if (!mapData || 
        (!mapData.fires && !mapData.perimeters) ||
        (Array.isArray(mapData.fires) && mapData.fires.length === 0 && 
         Array.isArray(mapData.perimeters) && mapData.perimeters.length === 0)) {
      throw new Error('No data received from server');
    }
    
    fires.value = mapData.fires || [];
    perimeters.value = mapData.perimeters || [];
    loading.value = false;
    return true;
  } catch (err) {
    error.value = err;
    console.error("Error fetching map data:", err);
    loading.value = false;
    return false;
  }
}

// Initialize map after data is loaded
async function launchMap() {
  await fetchMapData();
  initializeMap();
}

onMounted(() => {
  launchMap();
});

onUnmounted(() => {
  map.value.remove();
});

function initializeMap() {
  try {
    map.value = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.243683, 34.052235],
      zoom: 6
    });
    
    map.value.on('load', async () => {
       try {
         await loadIcons();
         await addFireLayer();
         await addPerimeterLayer();
       } catch (err) {
         console.error("Failed in map load event:", err);
       }
     });
  } catch (err) {
    console.error("Failed to initialize map:", err);
  }
}

async function loadIcons() {
  const icons = [
     { url: '/fire-small.png', name: 'fire-small' },
     { url: '/fire-medium.png', name: 'fire-medium' },
     { url: '/fire-large.png', name: 'fire-large' },
     { url: '/fire-huge.png', name: 'fire-huge' }
  ];

  const loadPromises = icons.map(icon => {
     return new Promise((resolve, reject) => {
       map.value.loadImage(icon.url, (error, image) => {
         if (error) {
           reject(error);
         } else {
           map.value.addImage(icon.name, image);
           resolve();
         }
       });
     });
  });

  return Promise.all(loadPromises);
}

function addFireLayer() {
  if (!map.value || !fires.value.length) {
    console.log('No fire data available.');
    return;
  }

  const fireData = {
    type: 'FeatureCollection',
    features: fires.value.map(fire => ({
      type: 'Feature',
      geometry: fire.geometry,
      properties: fire.properties,
    }))
  };

  // Add source
  map.value.addSource('fires', {
    type: 'geojson',
    data: fireData
  });
  
  // Add a single layer for all fires
  map.value.addLayer({
    id: 'fire-points',
    type: 'symbol',
    source: 'fires',
    layout: {
      'icon-image': [
        'case',
        ['<', ['get', 'area'], 1000], 'fire-small',
        ['<', ['get', 'area'], 10000], 'fire-medium',
        ['<', ['get', 'area'], 100000], 'fire-large',
        'fire-huge'
      ],
      'icon-size': 0.1,
      'icon-allow-overlap': true
    }
  });

  addMapInteractivity();
}

function addPerimeterLayer() {
  if (!map.value || !perimeters.value.length) {
    console.log('No perimeter data available.');
    return;
  }

  const perimeterData = {
    type: 'FeatureCollection',
    features: perimeters.value.map(perimeter => ({
      type: 'Feature',
      geometry: perimeter.geometry,
      properties: perimeter.properties,
    }))
  };

  // Add perimeter source
  map.value.addSource('perimeters', {
    type: 'geojson',
    data: perimeterData
  });
  
  // Add perimeter fill layer
  map.value.addLayer({
    id: 'perimeters-fill',
    type: 'fill',
    source: 'perimeters',
    paint: {
      'fill-color': '#ff5722',
      'fill-opacity': 0.3
    }
  }, 'fire-points');
  
  // Add perimeter outline layer
  map.value.addLayer({
    id: 'perimeters-outline',
    type: 'line',
    source: 'perimeters',
    paint: {
      'line-color': '#ff5722',
      'line-width': 2
    }
  }, 'fire-points');
}

function addMapInteractivity() {
  map.value.on('click', 'fire-points', (e) => {
    // Remove any existing popups
    document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());

    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      anchor: 'top-left'
    })
      .setLngLat(e.lngLat)
      .setHTML(createPopupContent(e.features[0]))
      .addTo(map.value);
  });

  map.value.on('mouseenter', 'fire-points', () => {
    map.value.getCanvas().style.cursor = 'pointer';
  });

  map.value.on('mouseleave', 'fire-points', () => {
    map.value.getCanvas().style.cursor = '';
  });
}

function createPopupContent(feature) {
  const props = feature.properties;
  return `
    <div class="popup-content">
      <h3 class="font-bold text-lg">${props.name}</h3>
      <p class="mt-2"><span class="font-semibold">Status:</span> ${props.status || 'Unknown'}</p>
      <p><span class="font-semibold">Containment:</span> ${props.containment ? props.containment + '%' : 'Unknown'}</p>
      <p><span class="font-semibold">Area:</span> ${props.area?.toLocaleString() || 'N/A'} acres</p>
      <p><span class="font-semibold">Last Updated:</span> ${new Date(props.lastUpdated).toLocaleDateString()}</p>
    </div>
  `;
}
</script>

<template>
  <div>
    <div id="map"/>
    <div v-if="error" class="error-banner">
      Error loading fire data: {{ error.message }}
    </div>
    <div v-if="loading" class="loading-overlay">
      Loading fire data...
    </div>
  </div>
</template>

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
  z-index: 100;
  position: fixed;
  background-color: firebrick;
  /* margin-top: 50px; */
}
</style>
