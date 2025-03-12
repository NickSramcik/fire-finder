<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;

const map = ref(null);
const { data: fires, error } = await useFetch('/api/fire');

onMounted(() => {
  initializeMap();
});

function initializeMap() {
  try {
    map.value = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-118.243683, 34.052235], // Default center (LA)
    zoom: 6
  });
  } catch (err) {
    console.error("Failed to initialize map:", err);
  }

  map.value.on('load', () => {
    addFireLayer();
  });
}

function addFireLayer() {
  // Convert MongoDB data to GeoJSON
  const fireData = {
    type: 'FeatureCollection',
    features: fires.value.data.map(fire => ({
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
  // Remove any existing popups
  const popups = document.getElementsByClassName('mapboxgl-popup');
  if (popups.length) popups[0].remove();

  const popupOffsets = {
    'top': [-1000, -1000],
  }

  const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    anchor: 'top-left',
    offset: popupOffsets
  })
    .setLngLat(e.lngLat)
    .setHTML(`
      <div class="popup-content">
        <h3 class="font-bold text-lg">${e.features[0].properties.name}</h3>
        <p class="mt-2"><span class="font-semibold">Status:</span> ${e.features[0].properties.status}</p>
        <p><span class="font-semibold">Containment:</span> ${e.features[0].properties.containment}%</p>
        <p><span>${e.lngLat}</span></p>
        <p><span class="font-semibold">Area:</span> ${e.features[0].properties.area?.toLocaleString() || 'N/A'} acres</p>
      </div>
    `)
    .addTo(map.value);
});
}

onBeforeUnmount(() => {
  if (map.value) map.value.remove();
});
</script>

<template>
  
  <div>
    <div id="map"></div>
    <div v-if="error" class="error-banner">
      Error loading fire data: {{ error.message }}
    </div>
  </div>
</template>

<style>
#map { 
  position: fixed;
  width: 100%;
  height: 100%;
}

.mapboxgl-popup {
  max-width: 300px;
  z-index: 100; /* Ensure above map */
}

.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip{
  align-self: flex-start;
}

.mapboxgl-popup-content {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 1rem;
}

@media (max-width: 640px) {
  .mapboxgl-popup {
    max-width: 200px;
  }
}

.error-banner {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px;
  background: red;
  color: white;
  z-index: 1;
}
</style>
