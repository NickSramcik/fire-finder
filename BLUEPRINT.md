# 🗺️ PROJECT BLUEPRINT
*Generated Sep 19, 2025, 02:54 PM PDT*

## Overview

Fire Finder designed to make wildfire mapping easy and reliable— Everything you need in one place. 

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas 
- **Simple**: Readable & maintainable code, not over-engineered thus easy for the average joe to use
- **Reliable**: Automated data processing and error handling to stay up to-date on a tight budget without fuss

## PROJECT STRUCTURE
```
📄 .eslintignore
📁 .github
  📁 workflows
    📄 fly-deploy.yml
📄 BLUEPRINT.md
📄 Dockerfile
📄 README.md
📁 app
  📄 app.vue
  📁 assets
    📁 css
      📄 tailwind.css
  📁 components
    📄 FireFeed.vue
    📄 FireMap.vue
    📄 HelpPage.vue
    📄 NavBar.vue
    📄 UserProfile.vue
  📁 pages
    📄 index.vue
📄 buildBlueprint.mjs
📄 eslint.config.mjs
📄 fly.toml
📄 nuxt.config.ts
📄 package.json
📁 public
  📄 favicon.ico
  📄 fire-huge.png
  📄 fire-large.png
  📄 fire-medium.png
  📄 fire-small.png
  📄 fire.svg
  📄 largefire.svg
  📄 robots.txt
📁 server
  📁 api
    📁 data
      📄 index.get.js
      📄 index.post.js
    📄 feed.js
    📄 fire.js
    📄 map-data.js
    📄 perimeter.js
  📁 middleware
  📁 models
    📄 Data.js
    📄 FirePoint.js
    📄 Perimeter.js
  📁 plugins
    📄 database.js
  📄 tsconfig.json
  📁 utils
    📄 cache.js
    📄 db.js
    📄 fireHandler.js
    📄 perimeterHandler.js
📄 tailwind.config.js
📄 tsconfig.json
```

## KEY FILE CODE EXAMPLES
### package.json
```json
{
  "name": "nuxt-app",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "blue": "node buildBlueprint.mjs"
  },
  "dependencies": {
    "@mapbox/mapbox-gl-geocoder": "^4.7.4",
    "@nuxt/eslint": "^1.9.0",
    "@nuxtjs/color-mode": "^3.5.2",
    "eslint": "^9.35.0",
    "mongoose": "^8.18.0",
    "nuxt": "^4.1.0",
    "nuxt-mapbox": "^1.5.0",
    "typescript": "^5.9.2",
    "vue": "^3.5.20",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.14.0",
    "daisyui": "^5.1.7",
    "mapbox-gl": "^2.15.0"
  }
}

```

### nuxt.config.ts
```javascript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mapbox',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
  ],
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  runtimeConfig: {
    public: {
      mapboxToken: process.env.PUBLIC_MAPBOX_TOKEN,
    },
  },
})
```

### ./app/app.vue
```javascript
<template>
  <div class="h-full">
    <NavBar :active-tab="activeTab" @switch-tab="switchTab" />
    <NuxtPage :active-tab="activeTab" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('map')

function switchTab(tab) {
  activeTab.value = tab
}
</script>


```

### ./app/pages/index.vue
```javascript
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <main class="h-full">
    <KeepAlive>
      <component :is="currentComponent" />
    </KeepAlive>
  </main>
</template>

<script setup>
import FireMap from '~/components/FireMap.vue'
import FireFeed from '~/components/FireFeed.vue'
import HelpPage from '~/components/HelpPage.vue'
import UserProfile from '~/components/UserProfile.vue'

// eslint-disable-next-line vue/require-prop-types
const props = defineProps(['activeTab'])

const components = {
  map: FireMap,
  feed: FireFeed,
  help: HelpPage,
  profile: UserProfile
}

const currentComponent = computed(() => components[props.activeTab])
</script>

<style>

html, body, #app, main {
  		height: 100%;
  		margin: 0;
  		padding: 0;
}

</style>
```

### ./app/components/FireMap.vue
```javascript
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
const retryCount = ref(0);
const maxRetries = 3;

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

// Fetch data with retry logic
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
    
    if (retryCount.value < maxRetries) {
      retryCount.value++;
      await new Promise(resolve => setTimeout(resolve, 300 * retryCount.value));
      return fetchMapData();
    }
    
    loading.value = false;
    return false;
  }
}

// Initialize map after data is loaded
async function initializeAfterDataLoad() {
  const success = await fetchMapData();
  
  if (success) {
    initializeMap();
  } else {
    // Even if data loading failed, initialize empty map
    initializeMap();
  }
}

onMounted(() => {
  initializeAfterDataLoad();
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
      Loading fire data{{ retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : '' }}...
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
```

### ./app/components/FireFeed.vue
```javascript
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<template>
    <div>
      <h2>Fire Feed</h2>
  
      <div class="overflow-x-auto">
        <table class="table table-zebra table-xs">
          <thead>
            <tr>
              <th/>
              <th>Name</th>
              <th>Size</th>
              <th>Status</th>
              <th>Containment</th>
              <th>Cause</th>
              <th>Discovered</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(point, i) in points" :key="point._id">
              <th>{{ i + 1 }}</th>
              <td>{{ point.properties.name }}</td>
              <td>{{ point.properties.area?.toLocaleString('en') }}</td>
              <td>{{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.status }}</td>
              <td>{{ getContainment(point.properties) }}</td>
              <td>{{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.cause || 'Unknown' }}</td>
              <td>{{ fixDate(point.properties.discoveredAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
</template>
  
<script setup>
  import { ref, onMounted } from 'vue';
  
  // Supress extraneous non-props attributes warning
  defineOptions({
    inheritAttrs: false,
  });
  
  const points = ref([]);
  
  onMounted(async () => {
    console.log('Fetching initial data...');
    await fetchFeed();
  });
  
  function fixDate(date) {
    if (!date) return 'N/A';
    
    const newDate = new Date(date);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
  
    return newDate.toLocaleDateString('en', options);
  }
  
  function getContainment(point) {
    if (point.status == 'Prescribed') return '100%';
    if (point.containment !== null && point.containment !== undefined) return point.containment + '%';
    return 'Unknown';
  }
  
  async function fetchFeed() {
    try {
      const response = await fetch('/api/feed');
      const result = await response.json();
      points.value = result.data || [];
      console.log('Fetched points:', points.value);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  }
</script>

<style scoped>
form {
  margin-bottom: 1rem;
}

label {
  margin-right: 0.5rem;
}

input {
  margin-right: 1rem;
}

button {
  margin-top: 0.5rem;
}
</style>

```

### ./app/components/NavBar.vue
```javascript
<template>

  <nav class="bg-base-200 flex items-center p-4">
    <button :class="{ active: activeTab === 'map'}" @click="switchTab('map')">Fire Finder</button>
    <button :class="{ active: activeTab === 'feed'}" @click="switchTab('feed')">Feed</button>
    <button :class="{ active: activeTab === 'help'}" @click="switchTab('help')">Help</button>
    <button :class="{ active: activeTab === 'profile'}" @click="switchTab('profile')">Profile</button>
  </nav>

</template>


<script setup>

defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['switch-tab']);
function switchTab(tab) {
  emit('switch-tab', tab);
}

</script>


<style>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #1f1f1f;
}

button {
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  background: none;
  color: #ccc;
}

button:hover {
  background-color: #333;
  color: white;
}

button.active {
  background-color: #ff5722;
  color: white;
  font-weight: bold;
}
</style>

```

### ./app/components/UserProfile.vue
```javascript
<template>
  <div>
    <h2>Admin Options</h2>

    <div>
      <button class="btn btn-accent" @click="renewFires">Renew Fire Point Data</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error">Error: {{ error }}</p>
      <p v-if="response">Success! Added {{ response.added }} fires, updated {{ response.updated }} fires.</p>
    </div>

    <div>
      <button class="btn btn-accent" @click="renewPerimeters">Renew Fire Perimeters</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error">Error: {{ error }}</p>
      <p v-if="response">Success! Added {{ response.added }} fire perimeters, updated {{ response.updated }} fire perimeters.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const loading = ref(false);
const error = ref(null);
const response = ref(null);

async function renewFires() {
  loading.value = true;
  error.value = null;
  response.value = null;

  try {
    const res = await fetch('/api/fire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    response.value = data.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function renewPerimeters() {
  loading.value = true;
  error.value = null;
  response.value = null;

  try {
    const res = await fetch('/api/perimeter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    response.value = data.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
form, label, input, button, h2 {
  margin: 1rem;
}
</style>
```

### ./server/models/FirePoint.js
```javascript
import { Schema, model } from 'mongoose';

const fireSchema = new Schema({
  geometry: {
    type: {
      $type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      $type: [Number],
      required: true
    }
  },
  properties: {
      // fireId: Number,
      sourceId: String,
      name: String,
      fireType: String,
      landmark: String,
      state: String,
      county: String,
      agency: String,
      discoveredAt: Date,
      lastUpdated: Date,
      status: String,
      area: Number,
      containment: Number,
      cause: String,
      source: String,
    },
}, { typeKey: '$type' }); // Fixes Mongoose confusing geoJSON "type" property with its own schema definitions
// TODO: Verify changing this typeKey is actually needed

fireSchema.index({ 'properties.area': -1 });
fireSchema.index({ geometry: '2dsphere' });

export default model('FirePoint', fireSchema);

```

### ./server/api/fire.js
```javascript
import { defineEventHandler, readBody, getQuery } from 'h3';
import {
    getFires,
    addFire,
    updateFire,
    deleteFire,
    renewFires,
} from '../utils/fireHandler';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET /api/fires
        if (event.method === 'GET') {
            const fires = await getFires(queryParams);
            return { statusCode: 200, data: fires };
        }

        // POST /api/fires
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await renewFires();
                return { statusCode: 200, data: result };
            }

            const newFire = await addFire(body);
            return { statusCode: 201, data: newFire };
        }

        // PUT /api/fires
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedFire = await updateFire(body.sourceId, body);
            return { statusCode: 200, data: updatedFire };
        }

        // DELETE /api/fires
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'At least one filter parameter is required for deletion',
                });
            }

            const result = await deleteFire(queryParams);
            return {
                statusCode: 200,
                data: { deletedCount: result.deletedCount },
            };
        }

        return createError({
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
        });
    } catch (error) {
        console.error('Error in fires API:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            data: error.message,
        });
    }
});

```

### ./server/api/perimeter.js
```javascript
import { defineEventHandler, readBody, getQuery } from 'h3';
import {
    getPerimeters,
    addPerimeter,
    updatePerimeter,
    deletePerimeter,
    renewPerimeters,
} from '../utils/perimeterHandler';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET /api/perimeter
        if (event.method === 'GET') {
            const perimeters = await getPerimeters(queryParams);
            return { statusCode: 200, data: perimeters };
        }

        // POST /api/perimeter
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await renewPerimeters();
                return { statusCode: 200, data: result };
            }

            const newPerimeter = await addPerimeter(body);
            return { statusCode: 201, data: newPerimeter };
        }

        // PUT /api/perimeter
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedPerimeter = await updatePerimeter(body.sourceId, body);
            return { statusCode: 200, data: updatedPerimeter };
        }

        // DELETE /api/perimeter
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage:
                        'At least one filter parameter is required for deletion',
                });
            }

            const result = await deletePerimeter(queryParams);
            return {
                statusCode: 200,
                data: { deletedCount: result.deletedCount },
            };
        }

        return createError({
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
        });
    } catch (error) {
        console.error('Error in perimeters API:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            data: error.message,
        });
    }
});

```

### ./server/api/feed.js
```javascript
import { defineEventHandler } from 'h3';
import { getFires } from '../utils/fireHandler';

// GET /api/feed - Get fire data for feed with optional sorting and filtering
export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);

        let fires = await getFires(query);

        // Apply sorting (Largest to smallest by default)
        fires = fires.sort((a, b) => {
            return b.properties.area - a.properties.area
        });

        // Apply limit if specified
        if (query.limit) {
            const limit = parseInt(query.limit);
            fires = fires.slice(0, limit);
        }

        return { statusCode: 200, data: fires };
    } catch (error) {
        console.error('Error fetching feed:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});

```

### ./server/api/map-data.js
```javascript
import { defineEventHandler, getQuery } from 'h3';
import { getFires } from '../utils/fireHandler';
import { getPerimeters } from '../utils/perimeterHandler';
import { cache } from '../utils/cache';
import mongoose from 'mongoose';

export default defineEventHandler(async event => {
    try {
        console.log('Map data request received - DB readyState:', mongoose.connection.readyState);
        console.log('Registered models:', mongoose.modelNames());
        console.log(
            'Map data request received - DB readyState:',
            mongoose.connection.readyState
        );
        const query = getQuery(event);
        const cacheKey = `map-data:${JSON.stringify(query)}`;

        // Check cache first
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('Using cache...');
            return cached;
        }

        const filters = {};

        if (query.minLastUpdated) {
            filters.minLastUpdated = new Date(query.minLastUpdated);
        }

        if (query.hasArea === 'true') {
            filters.hasArea = true;
        }

        const [fires, perimeters] = await Promise.all([
            getFires(filters),
            getPerimeters(),
        ]);

        const result = { fires, perimeters };

        // Cache the result
        cache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error fetching map data:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        });
    }
});

```

### ./server/utils/fireHandler.js
```javascript
import FirePoint from '../models/FirePoint';

const mapQuery = apiQuery => {
    const dbQuery = {};

    if (apiQuery.sourceId) {
        dbQuery['properties.sourceId'] = apiQuery.sourceId;
    }

    if (apiQuery.status) {
        dbQuery['properties.status'] = apiQuery.status;
    }

    if (apiQuery.cause) {
        dbQuery['properties.cause'] = apiQuery.cause;
    }

    if (apiQuery.minLastUpdated) {
        dbQuery['properties.lastUpdated'] = {
            $gte: apiQuery.minLastUpdated,
        };
    }

    if (apiQuery.hasArea) {
        dbQuery['properties.area'] = { $exists: true, $ne: null };
    }

    return dbQuery;
};

export const getFires = async (apiQuery = {}) => {
    try {
        const dbQuery = mapQuery(apiQuery);
        const fires = await FirePoint.find(dbQuery);
        return fires;
    } catch (error) {
        console.error('Error getting fires:', error);
        throw error;
    }
};

// Add a new fire
export const addFire = async fireData => {
    try {
        const newFire = new FirePoint(fireData);
        const savedFire = await newFire.save();
        console.log(`Added fire: ${newFire.properties.name}`);
        return savedFire;
    } catch (error) {
        console.error(`Error adding fire: ${fireData.properties.name}`, error);
        throw error;
    }
};

// Update a fire by ID or query
export const updateFire = async (sourceId, updateData) => {
    try {
        const query = { 'properties.sourceId': sourceId };
        const options = { new: true, runValidators: true };
        const updatedPoint = await FirePoint.findOneAndUpdate(
            query,
            updateData,
            options
        );

        if (!updatedPoint) {
            throw new Error(
                `Fire point: ${updateData.properties.name} not found`
            );
        }

        console.log(`Updated fire: ${updatedPoint.properties.name}`);
        return updatedPoint;
    } catch (error) {
        console.error('Error updating fire:', error);
        throw error;
    }
};

// Delete fires
export const deleteFire = async (apiQuery = {}) => {
    try {
        const dbQuery = mapQuery(apiQuery);

        // Safety check - don't allow empty queries that would delete all documents
        if (Object.keys(dbQuery).length === 0) {
            throw new Error(
                'Delete query must include at least one filter parameter'
            );
        }

        const result = await FirePoint.deleteMany(dbQuery);
        console.log(`Deleted ${result.deletedCount} fire(s)`);
        return result;
    } catch (error) {
        console.error('Error deleting fire(s):', error);
        throw error;
    }
};

// Renew fire data
export const renewFires = async () => {
    try {
        const fireData = await fetchFirePoints();
        let added = 0,
            updated = 0;

        for (const rawFire of fireData) {
            const processedFire = processFire(rawFire);
            const sourceId = processedFire.properties.sourceId;
            try {
                const fireExists = (await getFires({ sourceId })).length;

                if (fireExists) {
                    console.log(
                    );
                    await updateFire(sourceId, processedFire);
                    updated++;
                } else {
                    await addFire(processedFire);
                    added++;
                }
            } catch (error) {
                console.error(`Error processing fire ${sourceId}:`, error);
            }
        }

        console.log(`Added ${added} fires and Updated ${updated} fires`)
        await cleanupOldFires();
        await removeDuplicateFires();
        return { added, updated };
    } catch (error) {
        console.error('Error renewing fires:', error);
        throw error;
    }
};

// Fetch fire points from NIFC API
export const fetchFirePoints = async () => {
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres,IncidentName,PercentContained,IncidentSize,FireBehaviorGeneral,FireCause,FireDiscoveryDateTime,FireBehaviorGeneral3,FireBehaviorGeneral2,FireBehaviorGeneral1,UniqueFireIdentifier,IncidentTypeCategory,IncidentShortDescription,POOState,POOCounty,POOJurisdictionalAgency,ModifiedOnDateTime_dt&f=pgeojson&token=';

    try {
        const firePoints = await (await fetch(firePointUrl)).json();
        console.log(`Fetched ${firePoints.features.length} Fire Points`);
        return firePoints.features;
    } catch (err) {
        console.error('Error fetching fire points:', err);
        throw err;
    }
};

// Process raw fire data
export const processFire = rawPoint => {
    let prescribed = false;
    const processedPoint = {
        geometry: { type: 'Point', coordinates: rawPoint.geometry.coordinates },
        properties: {
            sourceId: rawPoint.properties.UniqueFireIdentifier,
            name: fixName(),
            fireType: rawPoint.properties.IncidentTypeCategory,
            landmark: rawPoint.properties.IncidentShortDescription,
            state: rawPoint.properties.POOState,
            county: rawPoint.properties.POOCounty,
            agency: rawPoint.properties.POOJurisdictionalAgency,
            discoveredAt: new Date(rawPoint.properties.FireDiscoveryDateTime),
            lastUpdated: new Date(rawPoint.properties.ModifiedOnDateTime_dt),
            status: fixStatus(),
            area: rawPoint.properties.IncidentSize,
            containment: rawPoint.properties.PercentContained,
            cause: rawPoint.properties.FireCause,
            source: 'NIFC',
        },
    };

    return processedPoint;

    function fixName() {
        let newName = rawPoint.properties.IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        // Add Fire to name if there is no good incident descriptor
        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        // Check for and clarify prescribed burn jargon
        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            prescribed = true;
            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                    default:
                        return match;
                }
            });
        }

        return newName;
    }

    function fixStatus() {
        const behaviors = [
            rawPoint.properties.FireBehaviorGeneral,
            rawPoint.properties.FireBehaviorGeneral1,
            rawPoint.properties.FireBehaviorGeneral2,
            rawPoint.properties.FireBehaviorGeneral3,
        ];

        let newStatus = [...new Set(behaviors)]
            .filter(behavior => behavior !== null)
            .join(', ');

        if (!newStatus) {
            if (prescribed) return 'Prescribed';
            return null;
        }

        return newStatus;
    }
};

// Clean up old fires that haven't been updated
export const cleanupOldFires = async (daysThreshold = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await FirePoint.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });

        console.log(
            `Cleaned up ${result.deletedCount} old fires (older than ${daysThreshold} months)`
        );
        return result;
    } catch (error) {
        console.error('Error cleaning up old fires:', error);
        throw error;
    }
};

// Remove duplicate fires with the same sourceId (keeping the most recent)
export const removeDuplicateFires = async () => {
    try {
        // Find duplicates by grouping by sourceId
        const duplicates = await FirePoint.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ]);

        let deletedCount = 0;

        // For each group of duplicates, keep the most recent and delete others
        for (const group of duplicates) {
            // Sort by newest first
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );

            // Keep the first (most recent) and delete the rest
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await FirePoint.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate fires`);
        return { deletedCount };
    } catch (error) {
        console.error('Error removing duplicate fires:', error);
        throw error;
    }
};

```

### ./server/utils/perimeterHandler.js
```javascript
import Perimeter from '../models/Perimeter';

// Map API query parameters to database field names
const mapApiQueryToDbQuery = apiQuery => {
    const dbQuery = {};

    if (apiQuery.sourceId) {
        dbQuery['properties.sourceId'] = apiQuery.sourceId;
    }

    if (apiQuery.status) {
        dbQuery['properties.status'] = apiQuery.status;
    }

    return dbQuery;
};

// Get perimeters based on API query parameters
export const getPerimeters = async (apiQuery = {}) => {
    try {
        const dbQuery = mapApiQueryToDbQuery(apiQuery);
        const perimeters = await Perimeter.find(dbQuery);
        return perimeters;
    } catch (error) {
        console.error('Error getting perimeters:', error);
        throw error;
    }
};

// Add a new perimeter
export const addPerimeter = async perimeterData => {
    try {
        const newPerimeter = new Perimeter(perimeterData);
        const savedPerimeter = await newPerimeter.save();
        console.log(`Added perimeter: ${savedPerimeter.properties.name}`);
        return savedPerimeter;
    } catch (error) {
        console.error('Error adding perimeter:', error);
        throw error;
    }
};

// Update a perimeter by sourceId
export const updatePerimeter = async (sourceId, updateData) => {
    try {
        const updatedPerimeter = await Perimeter.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPerimeter) {
            throw new Error('Perimeter not found');
        }

        console.log(`Updated perimeter: ${updatedPerimeter.properties.name}`);
        return updatedPerimeter;
    } catch (error) {
        console.error('Error updating perimeter:', error);
        throw error;
    }
};

// Delete perimeters based on API query parameters
export const deletePerimeter = async (apiQuery = {}) => {
    try {
        const dbQuery = mapApiQueryToDbQuery(apiQuery);

        // Safety check - don't allow empty queries
        if (Object.keys(dbQuery).length === 0) {
            throw new Error(
                'Delete query must include at least one filter parameter'
            );
        }

        const result = await Perimeter.deleteMany(dbQuery);
        console.log(`Deleted ${result.deletedCount} perimeter(s)`);
        return result;
    } catch (error) {
        console.error('Error deleting perimeter(s):', error);
        throw error;
    }
};

// Renew perimeter data from external source
export const renewPerimeters = async () => {
    try {
        const perimeterData = await fetchPerimeters();
        let added = 0,
            updated = 0,
            failed = [];

        for (const rawPerimeter of perimeterData) {
            const processedPerimeter = processPerimeter(rawPerimeter);
            const sourceId = processedPerimeter.properties.sourceId;
            try {
                const perimeterExists = (await getPerimeters({ sourceId })).length;

                if (perimeterExists) {
                    console.log(
                    );
                    await updatePerimeter(sourceId, processedPerimeter);
                    updated++;
                } else {
                    await addPerimeter(processedPerimeter);
                    added++;
                }
            } catch (error) {
                failed.push(processedPerimeter.properties.name)
                console.error(`Error processing perimeter ${sourceId}:`, error);
            }
        }

        console.log(`Added ${added} perimeters and Updated ${updated} perimeters`)
        if (failed.length) console.log(`Failed to proccess ${failed.length} perimeters: ${failed}`)
        await cleanupOldPerimeters();
        await removeDuplicatePerimeters();
        return { added, updated };
    } catch (error) {
        console.error('Error renewing perimeters:', error);
        throw error;
    }
};

export const validatePolygon = function (coordinates) {
    const ring = coordinates[0];

    if (ring.length < 4) {
        throw new Error('Polygon must have at least 4 points');
    }

    const [x1, y1] = ring[0];
    const [x2, y2] = ring[ring.length - 1];
    if (x1 !== x2 || y1 !== y2) {
        throw new Error('Polygon is not closed');
    }

    const seen = new Set();
    for (const [x, y] of ring) {
        const key = `${x},${y}`;
        const first = `${x1},${y1}`;
        const last = `${x2},${y2}`;
        if (seen.has(key) && key !== first && key !== last) {
            throw new Error(`Duplicate vertex found: ${x},${y}`);
        }
        seen.add(key);
    }
};

export const processPerimeter = rawPerimeter => {
    const processedPerimeter = rawPerimeter;
    rawPerimeter.properties = {
        sourceId: rawPerimeter.properties.attr_UniqueFireIdentifier,
        name: fixName(),
        lastUpdated: new Date(rawPerimeter.properties.poly_DateCurrent)
    }

    return processedPerimeter;

    function fixName() {
        let newName = rawPerimeter.properties.poly_IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        // Add Fire to name if there is no good incident descriptor
        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        // Check for and clarify prescribed burn jargon
        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                    default:
                        return match;
                }
            });
        }

        return newName;
    }
};

export const fetchPerimeters = async () => {
    // Fire Perimeter Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=d1c32af3212341869b3c810f1a215824
    const perimeterUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,poly_DateCurrent,attr_UniqueFireIdentifier&f=pgeojson';

    try {
        const perimeters = await (await fetch(perimeterUrl)).json();
        let perimeterCount = perimeters.features.length;
        console.log(`Fetched ${perimeterCount} Fire Perimeters`);
        return perimeters.features;
    } catch (err) {
        console.error('Error fetching perimeter data:', err);
        throw err;
    }
};

// Clean up old perimeters that haven't been updated
export const cleanupOldPerimeters = async (daysThreshold = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await Perimeter.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });

        console.log(
            `Cleaned up ${result.deletedCount} old perimeters (older than ${daysThreshold} months)`
        );
        return result;
    } catch (error) {
        console.error('Error cleaning up old perimeters:', error);
        throw error;
    }
};

// Remove duplicate perimeters with the same sourceId (keeping the most recent)
export const removeDuplicatePerimeters = async () => {
    try {
        // Find duplicates by grouping by sourceId
        const duplicates = await Perimeter.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ]);

        let deletedCount = 0;

        // For each group of duplicates, keep the most recent and delete others
        for (const group of duplicates) {
            // Sort by newest first
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );

            // Keep the first (most recent) and delete the rest
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await Perimeter.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate perimeters`);
        return { deletedCount };
    } catch (error) {
        console.error('Error removing duplicate perimeters:', error);
        throw error;
    }
};

```

### ./server/utils/db.js
```javascript
import mongoose from 'mongoose';

// Remove the isConnected check as it can cause issues with connection pooling
// and doesn't work well in serverless environments

export const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Use more robust connection options
    const db = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
    });

    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB - readyState:', mongoose.connection.readyState);
});

mongoose.connection.on('open', () => {
  console.log('Mongoose connection is open and ready to use');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});
```

### ./server/utils/cache.js
```javascript
class FireCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttl = 300000) {
        // 5 minutes default
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl,
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        this.cache.delete(key);
    }
}

export const cache = new FireCache();

```

### ./server/plugins/database.js
```javascript
import { connectDB } from '../utils/db';

export default defineNitroPlugin(async () => {
  try {
    await connectDB();
    console.log('Database connected successfully on startup');
  } catch (error) {
    console.error('Failed to connect to database on startup:', error);
  }
});

```

### ./.github/workflows/fly-deploy.yml
```javascript
# See https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/

name: Fly Deploy
on:
  push:
    branches:
      - main
jobs:
  deploy:
    name: Deploy app
    runs-on: ubuntu-latest
    concurrency: deploy-group    # optional: ensure only one action runs at a time
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --build-secret PUBLIC_MAPBOX_TOKEN=${{ secrets.PUBLIC_MAPBOX_TOKEN }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

```
