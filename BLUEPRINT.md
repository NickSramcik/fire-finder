# 🗺️ PROJECT BLUEPRINT
*Generated Sep 1, 2025, 01:24 PM PDT*

## Overview

Fire Finder designed to make wildfire mapping easy and reliable— Everything you need in one place. 

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas 
- **Simple**: Readable & maintainable code, not over-engineered thus easy for the average joe to use
- **Reliable**: Automated data processing and error handling to stay up to-date on a tight budget without fuss

## PROJECT STRUCTURE
```
📄 BLUEPRINT.md
📄 README.md
📄 app.vue
📁 assets
  📁 css
    📄 tailwind.css
📄 buildBlueprint.mjs
📁 components
  📄 Feed.vue
  📄 Help.vue
  📄 Map.vue
  📄 Navbar.vue
  📄 Profile.vue
📁 layouts
📄 nuxt.config.ts
📄 package.json
📁 pages
  📄 index.vue
📁 public
  📄 favicon.ico
  📄 robots.txt
📁 server
  📁 api
    📁 data
      📄 index.get.js
      📄 index.post.js
    📁 feed
      📄 index.get.js
    📁 fire
      📄 index.get.js
      📄 index.post.js
    📁 perimeter
      📄 index.get.js
    📁 renewFires
      📄 index.post.js
    📁 renewPerimeters
      📄 index.post.js
  📁 middleware
  📁 models
    📄 Data.js
    📄 FirePoint.js
    📄 Perimeter.js
  📄 tsconfig.json
  📁 utils
    📄 db.js
    📄 firePoints.js
    📄 perimeters.js
📄 tailwind.config.js
📄 tsconfig.json
```

## KEY FILE CODE EXAMPLES
### package.json
```json
{
  "name": "nuxt-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxtjs/color-mode": "^3.5.2",
    "@nuxtjs/tailwindcss": "^6.13.1",
    "nuxt": "^3.6.0",
    "nuxt-mapbox": "^1.6.2",
    "nuxt-mongoose": "^1.0.6",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "daisyui": "^5.0.0",
    "mapbox-gl": "^3.10.0"
  }
}

```

### nuxt.config.ts
```javascript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mapbox',
    'nuxt-mongoose',
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

### ./pages/index.vue
```javascript
<template>
  <main class="h-full">
    <KeepAlive>
      <component :is="currentComponent" />
    </KeepAlive>
  </main>
</template>

<script setup>
import Map from '~/components/Map.vue'
import Feed from '~/components/Feed.vue'
import Help from '~/components/Help.vue'
import Profile from '~/components/Profile.vue'

const props = defineProps(['activeTab'])

const components = {
  map: Map,
  feed: Feed,
  help: Help,
  profile: Profile
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

### ./components/Map.vue
```javascript
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import mapboxgl from "mapbox-gl";

const config = useRuntimeConfig();
mapboxgl.accessToken = config.public.mapboxToken;

const map = ref(null);
const { data: fires, error: fireError } = await useFetch('/api/fire');
const { data: perimeters, error: perimeterError } = await useFetch('/api/perimeter');

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
    addPerimeterLayer();
  });
}

function addFireLayer() {
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
        <p><span class="font-semibold">Area:</span> ${e.features[0].properties.area?.toLocaleString() || 'N/A'} acres</p>
      </div>
    `)
    .addTo(map.value);
});
}

function addPerimeterLayer() {
  const perimeterData = {
    type: 'FeatureCollection',
    features: perimeters.value.data.map(perimeter => ({
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
  border-radius: 2px;
}

/* .mapboxgl-popup-close-button span {
  margin: auto;
} */

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
  background: var(--color-error);
  color: var(--color-error-content);
  z-index: 1;
}
```

### ./components/Feed.vue
```javascript
<template>
    <h2>Fire Feed</h2>

    <div class="overflow-x-auto">
        <table class="table table-zebra table-xs">
            <thead>
                <tr>
                    <th></th>
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
                    <td>{{ point.properties.area.toLocaleString('en') }}</td>
                    <td>{{ point.properties.status }}</td>
                    <td>{{ getContainment(point.properties) }}</td>
                    <td>{{ point.properties.cause }}</td>
                    <td>{{ fixDate(point.properties.discoveredAt) }}</td>
                </tr>

            </tbody>
        </table>
    </div>


    <!-- <ul>
        <li v-for="point in points" :key="point._id">
            {{ point.properties.name }} - {{ point.properties.status }} - {{ point.properties.area }}
        </li>
    </ul> -->
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Supress extraneous non-props attributes warning
defineOptions({
  inheritAttrs: false,
});

const points = ref([]);
const name = ref('');
const location = ref('');

onMounted(async () => {
    console.log('Fetching initial data...');
    await fetchFeed();
});

function fixDate(date) {
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
    if (point.containment !== null) return point.containment + '%';
    return ('Unknown');
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

async function submitData() {
    console.log('Submitting point...');
    console.log('Name:', name.value);
    console.log('Location:', location.value);

    const newPoint = { name: name.value, location: location.value };

    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPoint)
        });

        if (response.ok) {
            await fetchData();
            name.value = '';
            location.value = '';
        } else {
            console.error('Failed to submit data');
        }
    } catch (error) {
        console.error('Error submitting data: ', error);
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

### ./server/api/renewFires/index.post.js
```javascript
import { renewFires } from '../../utils/firePoints';

export default defineEventHandler(async (event) => {
  try {
    const result = await renewFires();
    return {
      statusCode: 200,
      data: result
    }
  } catch (error) {
    console.error("API error renewing fires:", error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: error.message
    });
  }
});

```

### ./server/utils/firePoints.js
```javascript
import FirePoint from '../models/FirePoint';

// Renew Fire Data

export const renewFires = async () => {
    try {
      const fireData = await fetchFirePoints();
      let added = 0, updated = 0;
  
      for (const rawFire of fireData) {
        const processedFire = processFire(rawFire);
        const id = processedFire.properties.sourceId;
        const fireExists = await FirePoint.findOne({ 'properties.sourceId': id});

        if (fireExists) {
            // console.log(`${processedFire.properties.name} already exists, attempting to update it...`);
            await updateFire(id, processedFire);
            updated++;
        } else {
            await addFire(processedFire);
            added++;
        }
      }
      
      console.log(`Added ${added} fires and Updated ${updated} fires`)
      return { added, updated };
    } catch (err) {
      console.error("Error renewing fires: ", err);
      throw err;
    }
};

export const addFire = async (firePoint) => {
    try {
        const newPoint = new FirePoint(firePoint);
        const savedPoint = await newPoint.save()
            
        console.log(`Added point ${newPoint.properties.name}`)
        return { status: 201, data: savedPoint }

    } catch (err) {
        console.error("Error adding fire: ", err);
        throw err;
    }
};

export const updateFire = async (id, newPoint) => {
    try {
        const query = { 'properties.sourceId': id };
        const update = newPoint;
        const options = { new: true, runValidators: true };
        // console.log(`Searching for ${newPoint.properties.name} with sourceId: ${id}`)
        const updatedPoint = await FirePoint.findOneAndUpdate(query, update, options);

        if (!updatedPoint) {
            throw new Error('Fire point not found');
        }

        // console.log(`Updated fire point: ${updatedPoint._id}`);
        return updatedPoint;
    } catch (err) {
        console.error("Error updating fire: ", err);
        throw err;
    }
} 

export const deleteFire = async (query) => {
    try {
        const deletedCount = await FirePoint.deleteMany(query);

        return { status: 201, data: deletedCount };
    } catch (err) {
        console.error("Error deleting fire: ", err);
        throw err;
    }
}

export const fetchFirePoints = async () => {
    // Fire Point Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=4181a117dc9e43db8598533e29972015
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentSize%2CSourceOID%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const firePoints = await (await fetch(firePointUrl)).json();
        let fireCount = firePoints.features.length;
        console.log(`Fetched ${fireCount} Fire Points`);
        return firePoints.features;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export const processFire = (rawPoint) => {
    let prescribed = false;
    const processedPoint = {
        geometry: { type: 'Point', coordinates: rawPoint.geometry.coordinates},
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
        }
    }

    return processedPoint;

    function fixName() {
        let newName = rawPoint.properties.IncidentName
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
        
        // Add Fire to name if there is no good incident descriptor already exists
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
                }
            });
        }

        return newName;
    }

    function fixStatus() {
        const behaviors = [rawPoint.properties.FireBehaviorGeneral, 
                           rawPoint.properties.FireBehaviorGeneral1, 
                           rawPoint.properties.FireBehaviorGeneral2, 
                           rawPoint.properties.FireBehaviorGeneral3]
        
        let newStatus = [...new Set(behaviors)].filter(behavior => behavior !== null).join(', ');
        
        if (!newStatus) {
            if (prescribed) return 'Prescribed'
            return null;
        }

        return newStatus;
    }
}
```
