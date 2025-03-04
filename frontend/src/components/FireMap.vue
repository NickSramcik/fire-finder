<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import mapboxgl from "mapbox-gl";

// Mapbox Access Token
mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;

// Create reactive references
const mapContainer = ref(null);
let map = null;

// Initialize preloaded lat/longs
const Locales = {
    boston: {latitude: 42.213995, longitude: -71.224518},
    phoenix: {latitude: 33.4484, longitude: -112.0740},
    vegas: {latitude: 36.169941, longitude: -115.139832},
}

onMounted(() => {
  // Initialize the map
  map = new mapboxgl.Map({
    container: mapContainer.value, // Get the element reference
    style: "mapbox://styles/mapbox/streets-v12",
    center: [Locales.vegas.longitude, Locales.vegas.latitude],
    zoom: 6,
  });
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
  flex: 1;
  height: 100%;
}
</style>
