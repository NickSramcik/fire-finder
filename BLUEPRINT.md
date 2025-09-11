# 🗺️ PROJECT BLUEPRINT
*Generated Sep 11, 2025, 02:56 PM PDT*

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

onMounted(() => {
  initializeMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
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
         addFireLayer();
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
     { url: '/fire-large.png', name: 'fire-large' }
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
      properties: {
        ...fire.properties,
        iconSize: fire.properties.area < 10000 ? 'small' : 'large'
      }
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
        'fire-large'
      ],
      'icon-size': 0.25,
      'icon-allow-overlap': true
    }
  });

  addMapInteractivity();
}

function addMapInteractivity() {
  // Add click handler
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

  // Change cursor on hover
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
    <button 
      :class="{ 'active-tab': activeTab === 'map', 'inactive-tab': activeTab !== 'map' }" 
      @click="switchTab('map')"
    >
      Fire Finder
    </button>
    <button 
      :class="{ 'active-tab': activeTab === 'feed', 'inactive-tab': activeTab !== 'feed' }" 
      @click="switchTab('feed')"
    >
      Feed
    </button>
    <button 
      :class="{ 'active-tab': activeTab === 'help', 'inactive-tab': activeTab !== 'help' }" 
      @click="switchTab('help')"
    >
      Help
    </button>
    <button 
      :class="{ 'active-tab': activeTab === 'profile', 'inactive-tab': activeTab !== 'profile' }" 
      @click="switchTab('profile')"
    >
      Profile
    </button>
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

<style scoped>
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
}

.active-tab {
  background-color: #ff5722;
  color: white;
  font-weight: bold;
}

.inactive-tab {
  background: none;
  color: #ccc;
}

.inactive-tab:hover {
  background-color: #333;
  color: white;
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
