<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;
if (!mapboxgl.accessToken) console.error('Mapbox Token missing!');

const map = ref(null);
const mapInitialized = ref(false);

// Use the new API endpoints
const { data: mapData, error } = await useFetch('/api/map-data');

// Create computed properties for fires and perimeters
const fires = computed(() => mapData.value?.fires || []);
const perimeters = computed(() => mapData.value?.perimeters || []);

onMounted(() => {
  initializeMap();
});

function initializeMap() {
  try {
    map.value = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.243683, 34.052235],
      zoom: 6
    });
    
    // Wait for map to load before adding layers
    map.value.on('load', () => {
      mapInitialized.value = true;
      addFireLayer();
      addPerimeterLayer();
    });
  } catch (err) {
    console.error("Failed to initialize map:", err);
  }
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
      properties: fire.properties
    }))
  };

  map.value.addSource('fires', {
    type: 'geojson',
    data: fireData
  });

  map.value.addLayer({
    id: 'fire-points',
    type: 'circle',
    source: 'fires',
    paint: {
    'circle-radius': 8,
    'circle-color': [
      'step',
      ['get', 'containment'],
      '#ff0000',   // Default red (0-49)
      50, '#ffa500', // Orange (50-84)
      85, '#ffff00', // Yellow (85-99)
      100, '#00ff00' // Green (100)
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#000'
    }
  });

  map.value.on('click', 'fire-points', (e) => {
    const popups = document.getElementsByClassName('mapboxgl-popup');
    if (popups.length) popups[0].remove();

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      anchor: 'top-left'
    })
      .setLngLat(e.lngLat)
      .setHTML(createPopupContent(e.features[0]))
      .addTo(map.value);
  });
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
      properties: perimeter.properties
    }))
  };

  map.value.addSource('perimeters', {
    type: 'geojson',
    data: perimeterData
  });

  map.value.addLayer({
    id: 'perimeter-fill',
    type: 'fill',
    source: 'perimeters',
    paint: {
      'fill-color': '#FF0000',
      'fill-opacity': 0.2,
      'fill-outline-color': '#FF0000'
    }
  });

  map.value.addLayer({
    id: 'perimeter-line',
    type: 'line',
    source: 'perimeters',
    paint: {
      'line-color': '#FF0000',
      'line-width': 2
    }
  });
}

function createPopupContent(feature) {
  const props = feature.properties;
  return `
    <div class="popup-content">
      <h3 class="font-bold text-lg">${props.name}</h3>
      <p class="mt-2"><span class="font-semibold">Status:</span> ${props.status}</p>
      <p><span class="font-semibold">Containment:</span> ${props.containment}%</p>
      <p><span class="font-semibold">Area:</span> ${props.area?.toLocaleString() || 'N/A'} acres</p>
    </div>
  `;
}

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<template>
  <div>
    <div id="map"/>
    <div v-if="error" class="error-banner">
      Error loading fire data: {{ error.message }}
    </div>
    <div v-if="!mapInitialized" class="loading-overlay">
      Loading map...
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
</style>
