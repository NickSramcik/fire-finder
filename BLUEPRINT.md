# 🗺️ PROJECT BLUEPRINT
*Generated Sep 5, 2025, 06:42 PM PDT*

## Overview

Fire Finder designed to make wildfire mapping easy and reliable— Everything you need in one place. 

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas 
- **Simple**: Readable & maintainable code, not over-engineered thus easy for the average joe to use
- **Reliable**: Automated data processing and error handling to stay up to-date on a tight budget without fuss

## PROJECT STRUCTURE
```
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
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
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

### ./app/components/Navbar.vue
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

// { type: 'Feature',
//     geometry: { type: 'Point', coordinates: [ -150.866437532387, 60.4878035289611 ] },
//     properties:
//      { FinalAcres: null,
//        IncidentName: 'CY25 Wharf Ave RX',
//        PercentContained: null,
//        IncidentSize: null,
//        FireBehaviorGeneral: null,
//        FireCause: 'Undetermined',
//        FireDiscoveryDateTime: 1735750800000,
//        FireBehaviorGeneral3: null,
//        FireBehaviorGeneral2: null,
//        FireBehaviorGeneral1: null } }

// for (const rawFire of externalData) {
//       const processed = processFire(rawFire);
//       const existing = await Fire.findOne({ name: processed.name });
      
//       existing ? await updateFire(existing._id, processed) && updated++
//               : await addFire(processed) && added++;
//     }
  
//     return { added, updated, total: await Fire.countDocuments() };

// Log that fires are renewing at this time
// Selectively request fire data from NIFC API
// Loop through each fire point ---------------------- Time complexity really matters here! 
//      Search database for this fire
//      If it exists:
//          Update this fire
//      If it doesn't exist:
//          Process this fire data
//          Add this fire
// Check database for dead fires that haven't updated in several months, delete any that are found


// Update Fire Data

// Get old data for this fire
// Check status, area, containent, cause, source, and geometry for changes
```

### ./server/utils/db.js
```javascript
import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const db = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

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
      - run: flyctl deploy --remote-only --build-secret MAPBOX_TOKEN=${{ secrets.MAPBOX_TOKEN }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
          PUBLIC_MAPBOX_TOKEN: ${{ secrets.PUBLIC_MAPBOX_TOKEN }}

```
