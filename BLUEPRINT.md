# 🗺️ PROJECT BLUEPRINT
*Generated Sep 6, 2025, 07:18 PM PDT*

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
    📄 perimeters.js
  📁 middleware
    📄 database.js
  📁 models
    📄 Data.js
    📄 FirePoint.js
    📄 Perimeter.js
  📄 tsconfig.json
  📁 utils
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
              <td>{{ point.properties.area?.toLocaleString('en') || 'N/A' }}</td>
              <td>{{ point.properties.status }}</td>
              <td>{{ getContainment(point.properties) }}</td>
              <td>{{ point.properties.cause }}</td>
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
    if (point.status == 'Prescribed') return 'N/A';
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
  background: none;
  cursor: pointer;
  font-size: 1rem;
}

button.active {
  font-weight: bold;
  color: #ff5722;
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
    const res = await fetch('/api/fires', {
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
    const res = await fetch('/api/perimeters', {
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

export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);
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

        return { fires, perimeters };
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
            $gte: apiQuery.minLastUpdated
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
      const dbQuery = mapQuery(apiQuery)
      
      // Safety check - don't allow empty queries that would delete all documents
      if (Object.keys(dbQuery).length === 0) {
        throw new Error('Delete query must include at least one filter parameter')
      }
      
      const result = await FirePoint.deleteMany(dbQuery)
      console.log(`Deleted ${result.deletedCount} fire(s)`)
      return result
    } catch (error) {
      console.error('Error deleting fire(s):', error)
      throw error
    }
  }

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
                const existingFire = await getFires({ sourceId })

                if (existingFire) {
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

        console.log(`Added ${added} fires and Updated ${updated} fires`);
        return { added, updated };
    } catch (error) {
        console.error('Error renewing fires:', error);
        throw error;
    }
};

// Fetch fire points from NIFC API
export const fetchFirePoints = async () => {
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentSize%2CSourceOID%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

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
            sourceId: rawPoint.properties.SourceOID,
            name: fixName(),
            discoveredAt: new Date(rawPoint.properties.FireDiscoveryDateTime),
            lastUpdated: Date.now(),
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
  console.log('Mongoose connected to DB');
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

### ./server/middleware/database.js
```javascript
import { connectDB } from '../utils/db';
import mongoose from 'mongoose';


// Global connection variable
let isConnecting = false;
let connectionPromise = null;

export default defineEventHandler(async event => {
    // Only handle API routes
    if (!event.path.startsWith('/api/')) {
        return;
    }

    try {
        // Check if mongoose is already connected
        if (mongoose.connection.readyState === 1) {
            return; // Already connected
        }

        // Prevent multiple simultaneous connection attempts
        if (!isConnecting) {
            isConnecting = true;
            connectionPromise = connectDB();
        }

        // Wait for connection to establish
        await connectionPromise;
        isConnecting = false;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Database connection failed',
        });
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
