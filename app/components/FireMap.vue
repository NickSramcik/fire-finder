<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;
if (!mapboxgl.accessToken) console.error('Mapbox Token missing!');

const map = ref(null);
const mapInitialized = ref(false);

// Calculate date for filtering (last 3 months)
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

// Build query parameters for server-side filtering
const queryParams = new URLSearchParams({
  minLastUpdated: threeMonthsAgo.toISOString(),
  hasArea: 'true'
});

// Fetch fires
const { data: mapData, error } = await useFetch(`/api/map-data?${queryParams}`);
const fires = computed(() => mapData.value?.fires || []);
const perimeters = computed(() => mapData.value?.perimeters || []);

// Create colored SVG icons for each containment level
const createColoredSvgDataUrl = (size, color) => {
  const svgContent = size === 'large' 
    ? `<svg fill-rule="evenodd" overflow="visible" stroke-linejoin="bevel" stroke-width=".501" version="1.1" viewBox="0 0 70.375 79.325" xmlns="http://www.w3.org/2000/svg">
 <g transform="matrix(1 0 0 -1 -12.602 -5.7115)" fill="none" font-family="'Times New Roman'" font-size="16px" stroke="#000">
  <g transform="translate(0,-96)">
   <path d="m33.75 11.937c-0.36 0.507-0.704 1.032-1.033 1.575h4.165c-0.916 0.876-1.768 1.849-2.555 2.925h10.765c-0.217-1.981-0.451-3.802-0.701-5.473-3.966 0.059-7.51 0.386-10.641 0.973zm16.267 4.5h9.973c-1.229-1.373-2.591-2.59-4.076-3.662h5.691c-0.283-0.361-0.573-0.714-0.873-1.059-1.351-0.142-2.783-0.219-4.297-0.228l-5.75-0.31c-0.238 1.612-0.461 3.363-0.668 5.259zm-37.415 19.647c1.095-2.157 6.0983-5.7159 8.2203-3.7344-3.427 10.765-7.665 16.849-2.0856 27.753 0.357-2.71 3.6319-9.05 7.3426-7.9523-0.581 9.186-1.4396 22.549 4.8944 28.671-0.775-3.866 2.1375-11.946 6.9336-15.223-0.527 10.272 9.8063 11.607 10.183 24.69 3.965-3.701 6.9529-12.816 6.3739-21.3 1.967 2.911 9.0533 8.3209 12.408 10.676-5.1338-9.3203-6.0473-20.384-3.2103-25.502 0.882 3.175 6.3901 10.841 10.094 12.599-2.7138-6.3283-0.4368-19.654 2.2502-26.218l5.0392 11.344c5.0107-14.459-0.56455-29.308-7.1875-35.103-0.924 1.07-1.769 2.232-2.532 3.49h4.165c-2.071 1.983-3.822 4.462-5.211 7.5h2.805c-3.091 4.147-5.185 10.459-6.007 19.523-0.822-9.064-2.916-15.376-6.007-19.523h2.804c-1.389-3.038-3.14-5.517-5.21-7.5h4.164c-0.667-1.098-1.396-2.123-2.185-3.078-2.982 1.845-5.537 4.078-7.618 6.74h5.693c-2.748 1.983-5.072 4.462-6.916 7.5h4.165c-2.071 1.983-3.822 4.462-5.211 7.5h2.805c-3.091 4.147-5.185 10.459-6.007 19.523-0.822-9.064-2.916-15.376-6.007-19.523h2.804c-1.389-3.038-3.14-5.517-5.21-7.5h4.164c-1.844-3.038-4.168-5.517-6.915-7.5h5.691c-2.191-2.802-4.907-5.129-8.091-7.029-0.859 1.236-1.634 2.602-2.32 4.104h2.805c-3.091 4.147-5.185 10.459-6.007 19.523-0.822-9.064-2.916-15.376-6.007-19.523h2.804c-0.807-1.765-1.736-3.341-2.778-4.74-6.158 4.323-9.4535 10.517-9.8863 19.812z" fill="${color}" stroke="none" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="79.84" stroke-width=".75"/>
  </g>
 </g>
      </svg>`
    : `<svg clip-rule="evenodd" fill-rule="evenodd" image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" version="1.1" viewBox="0 0 220.8 307.99" xmlns="http://www.w3.org/2000/svg">
 <g transform="translate(-53.707 -12.67)">
  <path class="fil0" d="m203.15 12.67s-17.622 49.79 11.028 94.29c28.64 44.5 126.45 132.19-11.9 213.7 0 0 29.3-41.64 14.54-70.06s-42.886-47.516-37.606-92.016c0 0-45.444 15.356-26.944 94.216 0 0-23.57-8.59-33.49-31.83 0 0-14.65 45.6 12.23 98.92 0 0-150.82-85.218-31.134-201.95 0 0 6.0143 45.527 22.984 57.427 0 0-21.818-116.32 80.292-162.7z" fill="${color}"/>
 </g>
</svg>

`;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Pre-generate colored icons for each containment level
const fireIcons = {
  small: {
    red: createColoredSvgDataUrl('small', '#b22222'),
    orange: createColoredSvgDataUrl('small', '#f28500'),
    yellow: createColoredSvgDataUrl('small', '#ffd700'),
    green: createColoredSvgDataUrl('small', '#2a8000')
  },
  large: {
    red: createColoredSvgDataUrl('large', '#b22222'),
    orange: createColoredSvgDataUrl('large', '#f28500'),
    yellow: createColoredSvgDataUrl('large', '#ffd700'),
    green: createColoredSvgDataUrl('large', '#2a8000')
  }
};

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
      
      // Load all colored icons
      Promise.all([
        // Small icons
        loadImageFromDataURL(fireIcons.small.red, 'fire-small-red'),
        loadImageFromDataURL(fireIcons.small.orange, 'fire-small-orange'),
        loadImageFromDataURL(fireIcons.small.yellow, 'fire-small-yellow'),
        loadImageFromDataURL(fireIcons.small.green, 'fire-small-green'),
        
        // Large icons
        loadImageFromDataURL(fireIcons.large.red, 'fire-large-red'),
        loadImageFromDataURL(fireIcons.large.orange, 'fire-large-orange'),
        loadImageFromDataURL(fireIcons.large.yellow, 'fire-large-yellow'),
        loadImageFromDataURL(fireIcons.large.green, 'fire-large-green')
      ]).then(() => {
        addFireLayer();
        addPerimeterLayer();
      }).catch(err => {
        console.error("Failed to load images:", err);
      });
    });
  } catch (err) {
    console.error("Failed to initialize map:", err);
  }
}

// Helper to load images from data URLs
function loadImageFromDataURL(dataURL, imageName) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        map.value.addImage(imageName, img);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`Could not load image: ${imageName}`));
    img.src = dataURL;
  });
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
      properties: {
        ...fire.properties,
        // Add properties to determine which icon to use
        iconSize: fire.properties.area < 10000 ? 'small' : 'large',
        iconColor: getColorForContainment(fire.properties.containment)
      }
    }))
  };

  map.value.addSource('fires', {
    type: 'geojson',
    data: fireData
  });

  // Add layer for small fires
  map.value.addLayer({
    id: 'small-fire-points',
    type: 'symbol',
    source: 'fires',
    filter: ['==', ['get', 'iconSize'], 'small'],
    layout: {
      'icon-image': [
        'match',
        ['get', 'iconColor'],
        'red', 'fire-small-red',
        'orange', 'fire-small-orange',
        'yellow', 'fire-small-yellow',
        'green', 'fire-small-green',
        'fire-small-red' // default
      ],
      'icon-size': 0.25,
      'icon-allow-overlap': true
    }
  });

  // Add layer for large fires
  map.value.addLayer({
    id: 'large-fire-points',
    type: 'symbol',
    source: 'fires',
    filter: ['==', ['get', 'iconSize'], 'large'],
    layout: {
      'icon-image': [
        'match',
        ['get', 'iconColor'],
        'red', 'fire-large-red',
        'orange', 'fire-large-orange',
        'yellow', 'fire-large-yellow',
        'green', 'fire-large-green',
        'fire-large-red' // default
      ],
      'icon-size': 0.5,
      'icon-allow-overlap': true
    }
  });

  // Add click handler for both fire types
  map.value.on('click', ['small-fire-points', 'large-fire-points'], (e) => {
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

// Helper function to determine color based on containment
function getColorForContainment(containment) {
  if (containment >= 100) return 'green';
  if (containment >= 85) return 'yellow';
  if (containment >= 50) return 'orange';
  return 'red';
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
      <p><span class="font-semibold">Last Updated:</span> ${new Date(props.lastUpdated).toLocaleDateString()}</p>
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

.error-banner {
  margin-top: 50px;
}
</style>
