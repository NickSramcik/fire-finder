<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;

const mapContainer = ref(null);
let map = null;

// Preloaded lat/longs
const Locales = {
  boston: { latitude: 42.213995, longitude: -71.224518 },
  phoenix: { latitude: 33.4484, longitude: -112.0740 },
  vegas: { latitude: 36.169941, longitude: -115.139832 },
};

onMounted(async () => {
  try {
    // Initialize map
    map = new mapboxgl.Map({
      container: mapContainer.value, // Get the element reference
      style: "mapbox://styles/mapbox/streets-v12",
      center: [Locales.vegas.longitude, Locales.vegas.latitude],
      zoom: 6,
    });
  } catch (error) {
    console.error("Failed to initialize map:", error);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
    <div ref="mapContainer" class="map-container"></div>
</template>

<style>
.map-container {
  width: 100%;
  height: 100%;
  position: fixed;
}
</style>
