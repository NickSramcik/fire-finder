# 🗺️ PROJECT BLUEPRINT
*Generated Mar 16, 2026, 03:24 PM PDT*

## Overview

Fire Finder — a wildfire mapping app designed to be fast, simple, and reliable. Everything you need in one place.

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas
- **Simple**: Readable & maintainable code, not over-engineered, easy for anyone to use
- **Reliable**: Automated data processing and error handling to stay up-to-date on a tight budget without fuss

## Project Summary

- **7** `.vue` files
- **1** `.ts` file
- **28** `.js` files
- **2** `.mjs` files
- **4** `.json` files
- **1** `.yml` file
- **1** `.css` file
- **2** `.md` files
- **28** files in showcase list (1 disabled)

## Project Structure
```
📄 .blueprint.config.json
📄 .eslintignore
📁 .github
  📁 workflows
    📄 refresh-fire-data.yml
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
  📁 composables
    📄 useApiData.js
    📄 useFireData.js
    📄 useHotspotData.js
    📄 useMap.js
    📄 useUser.js
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
    📄 hotspots.js
    📄 map-data.js
    📄 perimeter.js
  📁 middleware
    📄 adminAuth.js
  📁 models
    📄 Data.js
    📄 FirePoint.js
    📄 Hotspot.js
    📄 Perimeter.js
    📄 User.js
  📁 plugins
    📄 database.js
  📁 routes
    📁 auth
      📄 apple.get.js
      📄 google.get.js
      📄 logout.get.js
  📁 services
    📄 FireService.js
    📄 HotspotService.js
    📄 PerimeterService.js
  📄 tsconfig.json
  📁 utils
    📄 cache.js
    📄 db.js
📄 tailwind.config.js
📄 tsconfig.json
```

## Key Files

### package.json
*modified today*
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
    "csv-parse": "^6.1.0",
    "eslint": "^9.35.0",
    "mongoose": "^8.18.0",
    "nuxt": "^4.1.0",
    "nuxt-auth-utils": "^0.5.29",
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
*modified today*
```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mapbox',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils',
  ],
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  runtimeConfig: {
    adminSecret: process.env.ADMIN_SECRET,
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
      },
      // apple: {
      //   clientId: process.env.NUXT_OAUTH_APPLE_CLIENT_ID,
      //   clientSecret: process.env.NUXT_OAUTH_APPLE_CLIENT_SECRET,
      // },
    },
    public: {
      mapboxToken: process.env.PUBLIC_MAPBOX_TOKEN,
    },
  },
})
```

### ./app/app.vue
*modified 6 months ago*
```vue
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
*modified 6 months ago*
```vue
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
*modified 5 months ago*
```vue
<template>
  <div>
    <div id="map" />
    
    <!-- Map Error -->
    <div v-if="showMapError" class="error-banner">
      Map Error: {{ mapError }}
      <button class="ml-4 px-2 py-1 bg-white text-red-600 rounded text-sm" @click="dismissMapError">
        Dismiss
      </button>
    </div>
    
    <!-- Data Error -->
    <div v-if="showDataError" class="error-banner">
      Data Error: {{ dataError.message }}
      <button class="ml-4 px-2 py-1 bg-white text-red-600 rounded text-sm" @click="dismissDataError">
        Dismiss
      </button>
    </div>
    
    <div v-if="loading" class="loading-overlay">
      Loading fire data...
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useFireData } from '~/composables/useFireData';
import { useMap } from '~/composables/useMap';

// Use composables
const { 
  fires, 
  loading, 
  error: dataError, 
  fetchFires,
  clearError: clearDataError
} = useFireData();

const { 
  mapLoaded, 
  mapError,
  initializeMap, 
  loadMapIcons, 
  addFireLayer, 
  addPerimeterLayer,
  addPopupInteractivity
} = useMap();

// Track dismissed errors
const dismissedMapError = ref(false);
const dismissedDataError = ref(false);

// Computed properties for showing errors
const showMapError = ref(false);
const showDataError = ref(false);

// Watch for new errors to reset dismiss state
watch(mapError, (newError) => {
  if (newError) {
    dismissedMapError.value = false;
    showMapError.value = true;
  }
});

watch(dataError, (newError) => {
  if (newError) {
    dismissedDataError.value = false;
    showDataError.value = true;
  }
});

// Initialize on mount
onMounted(async () => {
  try {
    // Initialize map first
    initializeMap('map');
    
    // Then fetch data
    await fetchFires({ hasArea: 'true' });
  } catch (err) {
    console.error('Failed to initialize map or fetch data:', err);
  }
});

// Watch for map readiness and data
watch([mapLoaded, fires], async () => {
  if (mapLoaded.value && fires.value && !mapError.value) {
    try {
      console.log('Setting up map layers...');
      
      const iconsLoaded = await loadMapIcons();
      if (!iconsLoaded) {
        console.warn('Icons failed to load, but continuing...');
      }
      
      const firePoints = Array.isArray(fires.value) ? fires.value : fires.value.fires;
      const perimeterData = Array.isArray(fires.value) ? [] : fires.value.perimeters;
      
      // Add data layers to map
      if (firePoints?.length) {
        addFireLayer(firePoints);
        addPopupInteractivity();
      } else {
        console.log('No fire data to display');
      }
      
      if (perimeterData?.length) {
        addPerimeterLayer(perimeterData);
      } else {
        console.log('No perimeter data to display');
      }
      
      console.log('Map layers setup complete');
    } catch (err) {
      console.error('Error setting up map layers:', err);
    }
  }
});

// Auto-retry on data error (but not map error)
watch(dataError, (newError) => {
  if (newError && !mapError.value) {
    console.log('Data error detected, will retry in 10 seconds...');
    setTimeout(() => {
      fetchFires({ hasArea: 'true' });
    }, 10000);
  }
});

// Dismiss errors
function dismissMapError() {
  dismissedMapError.value = true;
  showMapError.value = false;
}

function dismissDataError() {
  dismissedDataError.value = true;
  showDataError.value = false;
  clearDataError();
}
</script>

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

/* FIXED: Error banner positioned below navbar */
.error-banner {
  z-index: 90; /* Below navbar but above map */
  position: fixed;
  top: 4rem; /* Position below navbar (navbar is ~4rem tall) */
  left: 0;
  right: 0;
  background-color: #dc2626;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-overlay {
  z-index: 99;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
}
</style>

```

### ./app/components/FireFeed.vue
*modified 5 months ago*
```vue
<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Fire Feed</h2>
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-600">
          {{ activeFires.length }} active fires
        </div>
        <button class="btn btn-sm btn-outline" :disabled="loading" @click="refreshData">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="alert alert-error mb-4">
      <span>Error loading data: {{ error.message }}</span>
      <button class="btn btn-sm btn-ghost" @click="clearError">Dismiss</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !points.length" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"/>
      <p class="mt-2">Loading fire data...</p>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-lg shadow">
      <table class="table table-zebra table-auto">
        <thead class="bg-base-300">
          <tr>
            <th class="w-12">#</th>
            <th>Name</th>
            <th class="text-right">Size (acres)</th>
            <th>Status</th>
            <th class="text-center">Containment</th>
            <th>Cause</th>
            <th>Discovered</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(point, i) in points" 
            :key="point._id"
            class="hover:bg-base-200 transition-colors"
          >
            <td class="font-mono text-sm">{{ i + 1 }}</td>
            <td class="font-semibold">{{ point.properties.name }}</td>
            <td class="text-right font-mono">
              {{ formatNumber(point.properties.area) }}
            </td>
            <td>
              <span :class="statusClass(point.properties)">
                {{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.status }}
              </span>
            </td>
            <td class="text-center">
              <span :class="containmentClass(point.properties)">
                {{ getContainment(point.properties) }}
              </span>
            </td>
            <td>{{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.cause || 'Unknown' }}</td>
            <td class="whitespace-nowrap">{{ formatDate(point.properties.discoveredAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !points.length" class="text-center py-12">
      <div class="text-4xl mb-4">🔥</div>
      <h3 class="text-xl font-semibold mb-2">No Active Fires</h3>
      <p class="text-gray-600">There are currently no active fires to display.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useFireData } from '~/composables/useFireData'; // FIXED: Use useFireData instead of useCachedFireData

const { 
  fires, 
  loading, 
  error, 
  activeFires,
  fetchFireFeed, 
  clearError 
} = useFireData();

// Computed property for table data
const points = computed(() => fires.value || []);

// Refresh data
async function refreshData() {
  await fetchFireFeed(100); // Load top 100 fires
}

// Formatting helpers
function formatNumber(num) {
  if (!num) return 'N/A';
  return num.toLocaleString('en');
}

function formatDate(date) {
  if (!date) return 'N/A';
  
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return new Date(date).toLocaleDateString('en', options);
}

function getContainment(point) {
  if (point.status == 'Prescribed') return '100%';
  if (point.containment !== null && point.containment !== undefined) return point.containment + '%';
  return 'Unknown';
}

// Styling helpers
function statusClass(_properties) {
  // if (properties.fireType === 'RX') return 'badge badge-success';
  // if (properties.status?.includes('Contained')) return 'badge badge-info';
  // if (properties.status?.includes('Active')) return 'badge badge-warning';
  return 'badge badge-ghost';
}

function containmentClass(properties) {
  const containment = properties.containment;
  const status = properties.status;
  if (status == 'Prescribed') return 'badge badge-success';
  if (containment == null) return 'badge badge-ghost';
  if (containment >= 90) return 'badge badge-success';
  if (containment >= 50) return 'badge badge-warning';
  if (containment < 50) return 'badge badge-error';
  return 'badge badge-ghost';
}

// Load initial data
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
}
</style>

```

### ./app/components/NavBar.vue
*modified today*
```vue
<template>
  <nav class="navbar">
    <button :class="{ active: activeTab === 'map' }" @click="switchTab('map')">Fire Finder</button>
    <button :class="{ active: activeTab === 'feed' }" @click="switchTab('feed')">Feed</button>
    <button :class="{ active: activeTab === 'help' }" @click="switchTab('help')">Help</button>
    <button :class="{ active: activeTab === 'profile' }" @click="switchTab('profile')">Profile</button>

    <div class="spacer" />

    <!-- Guest: sign in button -->
    <button v-if="!loggedIn" @click="showSignIn = true">Sign in</button>

    <!-- Signed in: avatar button opens logout modal -->
    <button v-else class="avatar-btn" @click="showAccount = true">
      <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="avatar" />
      <span v-else>{{ user?.name?.charAt(0) ?? '?' }}</span>
    </button>

    <!-- Sign-in modal -->
    <dialog :open="showSignIn" class="modal">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg mb-2">Sign in</h3>
        <p class="text-sm text-base-content/70 mb-6">
          Save your home location and settings across devices.
        </p>
        <div class="flex flex-col gap-3">
          <button class="btn btn-outline w-full gap-2" @click="signInWithGoogle">
            <img src="https://www.google.com/favicon.ico" class="w-4 h-4" alt="" />
            Continue with Google
          </button>
          <!-- <button class="btn btn-outline w-full gap-2" @click="signInWithApple">
            Continue with Apple
          </button> -->
        </div>
        <p class="text-xs text-center text-base-content/50 mt-4">
          Or continue as guest — no sign-in needed to view maps.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showSignIn = false">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showSignIn = false" />
    </dialog>

    <!-- Account modal -->
    <dialog :open="showAccount" class="modal">
      <div class="modal-box max-w-sm">
        <div class="flex items-center gap-3 mb-6">
          <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="w-10 h-10 rounded-full" />
          <div v-else class="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center font-bold">
            {{ user?.name?.charAt(0) ?? '?' }}
          </div>
          <div>
            <p class="font-semibold">{{ user?.name }}</p>
            <p class="text-sm text-base-content/60">{{ user?.email }}</p>
          </div>
        </div>
        <div class="modal-action justify-between">
          <button class="btn btn-ghost btn-sm" @click="showAccount = false">Close</button>
          <button class="btn btn-error btn-sm" @click="signOut">Sign out</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showAccount = false" />
    </dialog>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useUser } from '~/composables/useUser';

defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['switch-tab']);
function switchTab(tab) {
  emit('switch-tab', tab);
}

const { loggedIn, user, signInWithGoogle, signInWithApple, signOut } = useUser();
const showSignIn = ref(false);
const showAccount = ref(false);
</script>

<style scoped>
nav.navbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #2a2a2a;
  height: 4rem;
  box-sizing: border-box;
}

.spacer {
  flex: 1;
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
  background-color: #3a3a3a;
  color: white;
}

button.active {
  background-color: #ff5722;
  color: white;
  font-weight: bold;
}

.avatar-btn {
  padding: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #ccc;
  background: none;
  border: 2px solid #ccc;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-btn:hover {
  border-color: white;
  color: white;
  background-color: #3a3a3a;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>

```

### ./app/components/UserProfile.vue
*modified today*
```vue
<template>
  <div class="p-6 max-w-4xl mx-auto">

    <!-- Guest state -->
    <div v-if="!loggedIn" class="text-center py-16">
      <div class="text-5xl mb-4">🔥</div>
      <h2 class="text-2xl font-bold mb-2">Sign in to Fire Finder</h2>
      <p class="text-base-content/70 mb-6 max-w-sm mx-auto">
        Save your home location and preferences. The map always works without an account.
      </p>
      <div class="flex flex-col gap-3 max-w-xs mx-auto">
        <button class="btn btn-outline w-full gap-2" @click="signInWithGoogle">
          <img src="https://www.google.com/favicon.ico" class="w-4 h-4" alt="" />
          Continue with Google
        </button>
        <!-- <button class="btn btn-outline w-full gap-2" @click="signInWithApple">
          Continue with Apple
        </button> -->
      </div>
    </div>

    <!-- Signed-in state -->
    <template v-else>

      <!-- User header -->
      <div class="flex items-center gap-4 mb-8">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.name"
          class="w-14 h-14 rounded-full"
        />
        <div v-else class="w-14 h-14 rounded-full bg-base-300 flex items-center justify-center text-2xl">
          {{ user.name?.charAt(0) ?? '?' }}
        </div>
        <div>
          <h2 class="text-2xl font-bold">{{ user.name }}</h2>
          <p class="text-sm text-base-content/60">{{ user.email }}</p>
        </div>
      </div>

      <!-- Settings panel — all signed-in users -->
      <div class="card bg-base-200 mb-6">
        <div class="card-body">
          <h3 class="card-title mb-4">⚙️ Settings</h3>
          <p class="text-sm text-base-content/60">
            Settings such as home location will appear here in a future update.
          </p>
          <div class="card-actions mt-4">
            <button class="btn btn-ghost btn-sm" @click="signOut">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <!-- Admin dashboard — isAdmin only -->
      <template v-if="isAdmin">

        <!-- Stats Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Total Fires</div>
            <div class="stat-value text-primary text-2xl">{{ totalFires }}</div>
            <div class="stat-desc">In database</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Active Fires</div>
            <div class="stat-value text-secondary text-2xl">{{ activeFiresCount }}</div>
            <div class="stat-desc">Containment &lt; 100%</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Total Perimeters</div>
            <div class="stat-value text-accent text-2xl">{{ totalPerimeters }}</div>
            <div class="stat-desc">In database</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Orphaned Perimeters</div>
            <div class="stat-value text-warning text-2xl">{{ orphanedPerimetersCount }}</div>
            <div class="stat-desc">No matching fire</div>
          </div>
        </div>

        <!-- Detailed Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title mb-4">🔥 Fire Statistics</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="font-medium">Prescribed Burns:</span>
                  <span class="badge badge-success">{{ prescribedFiresCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Contained Fires (100%):</span>
                  <span class="badge badge-info">{{ containedFiresCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Large Fires (&gt; 10k acres):</span>
                  <span class="badge badge-warning">{{ largeFiresCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Average Containment:</span>
                  <span class="font-mono">{{ averageContainment }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title mb-4">📍 Perimeter Statistics</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="font-medium">Matched Perimeters:</span>
                  <span class="badge badge-success">{{ matchedPerimetersCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Orphan Rate:</span>
                  <span class="font-mono">{{ orphanedPercentage }}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Last Updated:</span>
                  <span class="text-sm">{{ statsLastUpdated }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management Actions -->
        <div class="space-y-4">
          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title">Fire Point Data</h3>
              <p class="text-sm mb-4">Update fire point data from NIFC API</p>
              <button
                :disabled="fireLoading"
                class="btn btn-accent w-full md:w-auto"
                @click="renewFires"
              >
                {{ fireLoading ? 'Updating...' : 'Renew Fire Data' }}
              </button>
              <div v-if="fireResponse" class="mt-3 p-3 bg-success/20 rounded">
                <p class="text-success font-semibold">Success!</p>
                <p>Added {{ fireResponse.added }} fires, updated {{ fireResponse.updated }} fires.</p>
              </div>
              <div v-if="fireError" class="mt-3 p-3 bg-error/20 rounded">
                <p class="text-error font-semibold">Error:</p>
                <p>{{ fireError }}</p>
              </div>
            </div>
          </div>

          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title">Fire Perimeters</h3>
              <p class="text-sm mb-4">Update fire perimeter data from NIFC API</p>
              <button
                :disabled="perimeterLoading"
                class="btn btn-accent w-full md:w-auto"
                @click="renewPerimeters"
              >
                {{ perimeterLoading ? 'Updating...' : 'Renew Perimeter Data' }}
              </button>
              <div v-if="perimeterResponse" class="mt-3 p-3 bg-success/20 rounded">
                <p class="text-success font-semibold">Success!</p>
                <p>Added {{ perimeterResponse.added }} perimeters, updated {{ perimeterResponse.updated }} perimeters.</p>
              </div>
              <div v-if="perimeterError" class="mt-3 p-3 bg-error/20 rounded">
                <p class="text-error font-semibold">Error:</p>
                <p>{{ perimeterError }}</p>
              </div>
            </div>
          </div>
        </div>

      </template>
      <!-- end admin -->

    </template>
    <!-- end signed-in -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUser } from '~/composables/useUser';

const { loggedIn, user, isAdmin, signInWithGoogle, signOut } = useUser();

// ---- Data (admin only — only fetched when isAdmin) ----
const fireData = ref(null);
const perimeterData = ref(null);
const statsLastUpdated = ref(null);

// ---- Admin action states ----
const fireLoading = ref(false);
const fireError = ref(null);
const fireResponse = ref(null);

const perimeterLoading = ref(false);
const perimeterError = ref(null);
const perimeterResponse = ref(null);

// ---- Helpers ----
function getFiresArray() {
  if (!fireData.value) return [];
  return Array.isArray(fireData.value) ? fireData.value : fireData.value.fires || [];
}

function getPerimetersArray() {
  if (!perimeterData.value) return [];
  return Array.isArray(perimeterData.value) ? perimeterData.value : perimeterData.value.perimeters || [];
}

// ---- Computed stats ----
const totalFires = computed(() => getFiresArray().length);

const activeFiresCount = computed(() =>
  getFiresArray().filter(f => {
    const c = f.properties?.containment;
    return c !== null && c !== undefined && c < 100;
  }).length
);

const totalPerimeters = computed(() => getPerimetersArray().length);

const prescribedFiresCount = computed(() =>
  getFiresArray().filter(f =>
    f.properties?.fireType === 'RX' || f.properties?.status === 'Prescribed'
  ).length
);

const containedFiresCount = computed(() =>
  getFiresArray().filter(f => f.properties?.containment === 100).length
);

const largeFiresCount = computed(() =>
  getFiresArray().filter(f => (f.properties?.area || 0) > 10000).length
);

const averageContainment = computed(() => {
  const valid = getFiresArray().filter(f =>
    f.properties?.containment !== null && f.properties?.containment !== undefined
  );
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, f) => sum + f.properties.containment, 0) / valid.length);
});

const matchedPerimetersCount = computed(() => {
  const fireIds = new Set(getFiresArray().map(f => f.properties?.sourceId).filter(Boolean));
  return getPerimetersArray().filter(p => fireIds.has(p.properties?.sourceId)).length;
});

const orphanedPerimetersCount = computed(() => {
  const fireIds = new Set(getFiresArray().map(f => f.properties?.sourceId).filter(Boolean));
  return getPerimetersArray().filter(p => !fireIds.has(p.properties?.sourceId)).length;
});

const orphanedPercentage = computed(() => {
  const total = totalPerimeters.value;
  return total === 0 ? 0 : Math.round((orphanedPerimetersCount.value / total) * 100);
});

// ---- Data fetching (admin only) ----
async function fetchAdminData() {
  const [firesRes, perimetersRes] = await Promise.all([
    $fetch('/api/map-data'),
    $fetch('/api/perimeter'),
  ]);
  fireData.value = firesRes;
  perimeterData.value = perimetersRes;
  statsLastUpdated.value = new Date().toLocaleString();
}

async function renewFires() {
  fireLoading.value = true;
  fireError.value = null;
  fireResponse.value = null;
  try {
    const res = await $fetch('/api/fire', {
      method: 'POST',
      body: { action: 'renew' },
    });
    fireResponse.value = res.data;
    await fetchAdminData();
  } catch (err) {
    fireError.value = err?.data?.statusMessage || err.message || 'Unknown error';
  } finally {
    fireLoading.value = false;
  }
}

async function renewPerimeters() {
  perimeterLoading.value = true;
  perimeterError.value = null;
  perimeterResponse.value = null;
  try {
// ... (truncated — 19 more lines not shown)
```

### ./app/composables/useApiData.js
*modified 5 months ago*
```javascript
import { ref } from 'vue';

// Generic API data fetcher with error handling and caching
export function useApiData() {
    const data = ref(null);
    const loading = ref(false);
    const error = ref(null);

    async function fetchData(url, options = {}) {
        loading.value = true;
        error.value = null;

        try {
            const response = await $fetch(url, {
                timeout: 10000, // 10 seconds for slow connections
                retry: 1,
                retryDelay: 500,
                ...options,
            });

            if (!response || response.statusCode >= 400) {
                throw new Error(
                    response?.statusMessage || 'Failed to fetch data'
                );
            }

            data.value = response.data || response;
            return data.value;
        } catch (err) {
            error.value = {
                message: err.message,
                timestamp: new Date().toISOString(),
                url,
            };
            console.error('API fetch error:', err);
            return null;
        } finally {
            loading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    function clearData() {
        data.value = null;
    }

    return {
        data,
        loading,
        error,
        fetchData,
        clearError,
        clearData,
    };
}

```

### ./app/composables/useFireData.js
*modified 5 months ago*
```javascript
import { ref, computed } from 'vue';
import { useApiData } from './useApiData.js';

// Specialized composable for fire-related data
export function useFireData() {
    const { data, loading, error, fetchData, clearError } = useApiData();

    // Local state for fire-specific features
    const lastUpdated = ref(null);
    const filters = ref({
        minArea: 0,
        status: null,
        hasContainment: false,
    });

    // Computed properties for derived state
    const activeFires = computed(() => {
        if (!data.value) return [];

        return data.value.filter(
            fire =>
                fire.properties?.status !== 'Prescribed' &&
                fire.properties?.status !== 'Out'
        );
    });

    const largeFires = computed(() => {
        if (!data.value) return [];

        return data.value.filter(fire => fire.properties?.area > 10000); // Changed to 10k acres for "large"
    });

    const totalArea = computed(() => {
        if (!data.value) return 0;

        return data.value.reduce((sum, fire) => {
            return sum + (fire.properties?.area || 0);
        }, 0);
    });

    // Fire-specific methods
    async function fetchFires(params = {}) {
        const queryParams = new URLSearchParams();

        // Apply filters
        if (filters.value.minArea > 0) {
            queryParams.append('minArea', filters.value.minArea);
        }
        if (filters.value.status) {
            queryParams.append('status', filters.value.status);
        }
        if (filters.value.hasContainment) {
            queryParams.append('hasContainment', 'true');
        }

        // Merge with custom params
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });

        const result = await fetchData(`/api/map-data?${queryParams}`);

        if (result) {
            lastUpdated.value = new Date();
        }

        return result;
    }

    async function fetchFireFeed(limit = 50) {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('hasArea', 'true');

        return await fetchData(`/api/feed?${queryParams}`);
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters };
    }

    function clearFilters() {
        filters.value = {
            minArea: 0,
            status: null,
            hasContainment: false,
        };
    }

    // Find fire by sourceId
    function findFire(sourceId) {
        if (!data.value) return null;
        return data.value.find(fire => fire.properties?.sourceId === sourceId);
    }

    return {
        // State
        fires: data,
        loading,
        error,
        lastUpdated,
        filters,

        // Computed
        activeFires,
        largeFires,
        totalArea,

        // Methods
        fetchFires,
        fetchFireFeed,
        setFilters,
        clearFilters,
        clearError,
        findFire,
    };
}

```

### ./app/composables/useUser.js
*modified today*
```javascript
import { computed } from 'vue';

export function useUser() {
    const {
        loggedIn,
        user,
        session,
        fetch: refreshSession,
        clear,
    } = useUserSession();

    async function signInWithGoogle() {
        await navigateTo('/auth/google', { external: true });
    }

    // async function signInWithApple() {
    //     await navigateTo('/auth/apple', { external: true });
    // }

    async function signOut() {
        await navigateTo('/auth/logout', { external: true });
    }

    const isAdmin = computed(() => user.value?.isAdmin === true);

    return {
        loggedIn,
        user,
        session,
        isAdmin,
        refreshSession,
        signInWithGoogle,
        // signInWithApple,
        signOut,
    };
}

```

### ./app/composables/useMap.js
*modified today*
```javascript
import { ref, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

// Map-specific logic extracted from FireMap.vue
export function useMap() {
    const map = ref(null);
    const mapLoaded = ref(false);
    const mapError = ref(null);

    // Map configuration - externalized for easy changes
    const mapConfig = ref({
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-118.243683, 34.052235], // Los Angeles
        zoom: 6,
        minZoom: 3,
        maxZoom: 15,
    });

    // Map icons configuration
    const mapIcons = ref([
        { url: '/fire-small.png', name: 'fire-small', size: [24, 24] },
        { url: '/fire-medium.png', name: 'fire-medium', size: [32, 32] },
        { url: '/fire-large.png', name: 'fire-large', size: [40, 40] },
        { url: '/fire-huge.png', name: 'fire-huge', size: [48, 48] },
    ]);

    // Track which layers we've added
    const addedLayers = ref(new Set());

    // Initialize map
    function initializeMap(containerId) {
        const config = useRuntimeConfig();

        if (!config.public.mapboxToken) {
            mapError.value =
                'Mapbox token not configured. Please check your environment variables.';
            console.error('Mapbox Token missing!');
            return;
        }

        if (!mapboxgl.supported()) {
            mapError.value =
                'WebGL is not enabled on your device or browser. To view the map, try enabling hardware acceleration in your browser settings, or open this page in Chrome.';
            console.error('WebGL not supported');
            return;
        }

        mapboxgl.accessToken = config.public.mapboxToken;

        try {
            map.value = new mapboxgl.Map({
                container: containerId,
                style: mapConfig.value.style,
                center: mapConfig.value.center,
                zoom: mapConfig.value.zoom,
                minZoom: mapConfig.value.minZoom,
                maxZoom: mapConfig.value.maxZoom,
            });

            map.value.on('load', () => {
                mapLoaded.value = true;
                console.log('Map loaded successfully');
            });

            map.value.on('error', e => {
                // FIXED: Ignore layer ordering errors, they're not critical
                if (e.error?.message?.includes('does not exist on this map')) {
                    console.warn(
                        'Layer ordering issue (non-critical):',
                        e.error.message
                    );
                    return;
                }
                mapError.value = e.error?.message || 'Unknown map error';
                console.error('Map error:', e);
            });
        } catch (err) {
            mapError.value = err.message;
            console.error('Failed to initialize map:', err);
        }
    }

    // Load map icons
    async function loadMapIcons() {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for loading icons');
            return false;
        }

        const loadPromises = mapIcons.value.map(icon => {
            return new Promise((resolve, reject) => {
                map.value.loadImage(icon.url, (error, image) => {
                    if (error) {
                        console.error(
                            `Failed to load icon ${icon.url}:`,
                            error
                        );
                        reject(error);
                    } else {
                        map.value.addImage(icon.name, image);
                        resolve();
                    }
                });
            });
        });

        try {
            await Promise.all(loadPromises);
            console.log('All map icons loaded successfully');
            return true;
        } catch (err) {
            console.error('Failed to load map icons:', err);
            return false;
        }
    }

    // Add fire data to map
    function addFireLayer(fireData, sourceId = 'fires') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding fire layer');
            return;
        }

        if (!fireData || !fireData.length) {
            console.log('No fire data available for layer');
            return;
        }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: fireData.map(fire => ({
                    type: 'Feature',
                    geometry: fire.geometry,
                    properties: fire.properties,
                })),
            };

            // Remove existing source/layer if present
            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-points`)) {
                    map.value.removeLayer(`${sourceId}-points`);
                }
                map.value.removeSource(sourceId);
            }

            // Add source
            map.value.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
            });

            // Add layer
            map.value.addLayer({
                id: `${sourceId}-points`,
                type: 'symbol',
                source: sourceId,
                layout: {
                    'icon-image': [
                        'case',
                        ['<', ['get', 'area'], 1000],
                        'fire-small',
                        ['<', ['get', 'area'], 10000],
                        'fire-medium',
                        ['<', ['get', 'area'], 100000],
                        'fire-large',
                        'fire-huge',
                    ],
                    'icon-size': 0.1,
                    'icon-allow-overlap': true,
                },
            });

            addedLayers.value.add(`${sourceId}-points`);
            console.log(`Fire layer added with ${fireData.length} features`);
        } catch (err) {
            console.error('Error adding fire layer:', err);
        }
    }

    // Add perimeter data to map
    function addPerimeterLayer(perimeterData, sourceId = 'perimeters') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding perimeter layer');
            return;
        }

        if (!perimeterData || !perimeterData.length) {
            console.log('No perimeter data available for layer');
            return;
        }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: perimeterData.map(perimeter => ({
                    type: 'Feature',
                    geometry: perimeter.geometry,
                    properties: perimeter.properties,
                })),
            };

            // Remove existing source/layer if present
            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-fill`)) {
                    map.value.removeLayer(`${sourceId}-fill`);
                }
                if (map.value.getLayer(`${sourceId}-outline`)) {
                    map.value.removeLayer(`${sourceId}-outline`);
                }
                map.value.removeSource(sourceId);
            }

            // Add source
            map.value.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
            });

            // FIXED: Add perimeter layers without beforeId to avoid ordering issues
            // Add fill layer first (will be at bottom)
            map.value.addLayer({
                id: `${sourceId}-fill`,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#ff5722',
                    'fill-opacity': 0.4, // Increased opacity for better visibility
                },
            });

            // Add outline layer
            map.value.addLayer({
                id: `${sourceId}-outline`,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#ff5722',
                    'line-width': 3, // Increased width for better visibility
                    'line-opacity': 0.8,
                },
            });

            addedLayers.value.add(`${sourceId}-fill`);
            addedLayers.value.add(`${sourceId}-outline`);
            console.log(
                `Perimeter layer added with ${perimeterData.length} features`
            );
        } catch (err) {
            console.error('Error adding perimeter layer:', err);
        }
    }

    function addHotspotLayer(hotspotData, sourceId = 'hotspots') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding hotspot layer');
            return;
        }

        if (!hotspotData || !hotspotData.length) {
            console.log('No hotspot data available for layer');
            return;
        }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: hotspotData.map(hotspot => ({
                    type: 'Feature',
                    geometry: hotspot.geometry,
                    properties: hotspot.properties,
                })),
            };

            // Remove existing source/layer if present
            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-points`)) {
                    map.value.removeLayer(`${sourceId}-points`);
                }
                if (map.value.getLayer(`${sourceId}-heatmap`)) {
                    map.value.removeLayer(`${sourceId}-heatmap`);
                }
                map.value.removeSource(sourceId);
            }

            // Add source
            map.value.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
            });

            // Option 1: Point layer with size based on brightness
            map.value.addLayer({
                id: `${sourceId}-points`,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
// ... (truncated — 277 more lines not shown)
```

### ./server/models/FirePoint.js
*modified 6 months ago*
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

### ./server/models/Perimeter.js
*modified today*
```javascript
import { Schema, model } from 'mongoose';

const perimeterSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Feature'],
    },
    geometry: {
        type: {
            type: String,
            required: true,
            enum: ['MultiPolygon'],
        },
        coordinates: {
            type: Array,
            required: true,
        },
    },
    properties: {
        name: {
            type: String,
            required: true,
        },
        sourceId: {
            type: String,
            required: true,
        },
        lastUpdated: {
            type: Date,
            required: true,
        },
    },
});

perimeterSchema.index({ geometry: '2dsphere' });

export default model('Perimeter', perimeterSchema);

```

### ./server/models/User.js
*modified today*
```javascript
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: String,
    avatar: String,
    provider: {
        type: String,
        enum: ['google', 'apple'],
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    homeLocation: {
        lat: Number,
        lng: Number,
        label: String,
    },
    settings: {
        // Reserved for future user preferences
    },
    lastLoginAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.index({ email: 1 });

export default model('User', userSchema);

```

### ./server/api/fire.js
*modified 5 months ago*
```javascript
import { defineEventHandler, readBody, getQuery } from 'h3';
import { fireService } from '../services/FireService.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        if (event.method === 'GET') {
            const fires = await fireService.find(queryParams);
            return { statusCode: 200, data: fires };
        }

        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await fireService.renewFires();
                return { statusCode: 200, data: result };
            }

            const newFire = await fireService.create(body);
            return { statusCode: 201, data: newFire };
        }

        if (event.method === 'PUT') {
            const body = await readBody(event);
            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }
            const updatedFire = await fireService.update(body.sourceId, body);
            return { statusCode: 200, data: updatedFire };
        }

        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'Filter parameter required',
                });
            }
            const result = await fireService.delete(queryParams);
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
        });
    }
});

```

### ./server/api/perimeter.js
*modified 5 months ago*
```javascript
import { defineEventHandler, readBody, getQuery } from 'h3';
import { perimeterService } from '../services/PerimeterService.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        if (event.method === 'GET') {
            const perimeters = await perimeterService.find(queryParams);
            return { statusCode: 200, data: perimeters };
        }

        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await perimeterService.renewPerimeters();
                return { statusCode: 200, data: result };
            }

            const newPerimeter = await perimeterService.create(body);
            return { statusCode: 201, data: newPerimeter };
        }

        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedPerimeter = await perimeterService.update(
                body.sourceId,
                body
            );
            return { statusCode: 200, data: updatedPerimeter };
        }

        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage:
                        'At least one filter parameter is required for deletion',
                });
            }

            const result = await perimeterService.delete(queryParams);
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
*modified 5 months ago*
```javascript
import { defineEventHandler, getQuery } from 'h3';
import { fireService } from '../services/FireService.js'; // FIXED: Direct import

export default defineEventHandler(async event => {
    try {
        const query = getQuery(event);

        let fires = await fireService.find(query);

        // Apply sorting (Largest to smallest by default)
        fires = fires.sort((a, b) => {
            return b.properties.area - a.properties.area;
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
*modified 5 months ago*
```javascript
import { defineEventHandler, getQuery } from 'h3';
import { fireService } from '../services/FireService.js';
import { perimeterService } from '../services/PerimeterService.js';
import { cache } from '../utils/cache.js';

export default defineEventHandler(async event => {
    try {
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
            fireService.find(filters),
            perimeterService.find(),
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

### ./server/utils/db.js
*modified 5 months ago*
```javascript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const db = await mongoose.connect(dbUri);

    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

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
*modified 5 months ago*
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

### ./server/services/FireService.js
*modified today*
```javascript
import FirePoint from '../models/FirePoint.js';

export class FireService {
    constructor() {
        this.model = FirePoint;
    }

    // Data Access Methods
    async find(query = {}) {
        const dbQuery = this.mapQuery(query);
        let mongooseQuery = this.model.find(dbQuery);

        if (query.limit) {
            mongooseQuery = mongooseQuery.limit(parseInt(query.limit));
        }

        if (query.skip) {
            mongooseQuery = mongooseQuery.skip(parseInt(query.skip));
        }

        // Default: largest fires first
        mongooseQuery = mongooseQuery.sort({ 'properties.area': -1 });

        return mongooseQuery.exec();
    }

    async findOne(sourceId) {
        return this.model.findOne({ 'properties.sourceId': sourceId });
    }

    async create(fireData) {
        const newFire = new this.model(fireData);
        return newFire.save();
    }

    async update(sourceId, updateData) {
        return this.model.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            updateData,
            { new: true, runValidators: true }
        );
    }

    async delete(query = {}) {
        const dbQuery = this.mapQuery(query);

        if (Object.keys(dbQuery).length === 0) {
            throw new Error('Delete query requires filters');
        }

        return this.model.deleteMany(dbQuery);
    }

    // External Data Integration
    async renewFires() {
        const fireData = await this.fetchFirePoints();

        const operations = fireData.map(rawFire => {
            const processedFire = this.processFire(rawFire);
            return {
                updateOne: {
                    filter: {
                        'properties.sourceId':
                            processedFire.properties.sourceId,
                    },
                    update: { $set: processedFire },
                    upsert: true,
                },
            };
        });

        let added = 0,
            updated = 0;

        try {
            const result = await this.model.bulkWrite(operations, {
                ordered: false,
            });
            added = result.upsertedCount;
            updated = result.modifiedCount;
        } catch (error) {
            if (error.writeErrors?.length) {
                error.writeErrors.forEach(e =>
                    console.error(
                        `Error processing fire ${
                            operations[e.index]?.updateOne?.filter?.[
                                'properties.sourceId'
                            ]
                        }:`,
                        e.errmsg
                    )
                );
                added = error.result?.upsertedCount ?? 0;
                updated = error.result?.modifiedCount ?? 0;
            } else {
                console.error('Error during bulkWrite for fires:', error);
            }
        }

        await this.cleanupOldFires();
        await this.removeDuplicateFires();
        return { added, updated };
    }

    async fetchFirePoints() {
        const firePointUrl =
            'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres,IncidentName,PercentContained,IncidentSize,FireBehaviorGeneral,FireCause,FireDiscoveryDateTime,FireBehaviorGeneral3,FireBehaviorGeneral2,FireBehaviorGeneral1,UniqueFireIdentifier,IncidentTypeCategory,IncidentShortDescription,POOState,POOCounty,POOJurisdictionalAgency,ModifiedOnDateTime_dt&f=pgeojson&token=';

        try {
            const response = await fetch(firePointUrl);
            const data = await response.json();
            console.log(`Fetched ${data.features.length} Fire Points`);
            return data.features;
        } catch (err) {
            console.error('Error fetching fire points:', err);
            throw err;
        }
    }

    // Data Processing
    processFire(rawPoint) {
        const processedPoint = {
            geometry: {
                type: 'Point',
                coordinates: rawPoint.geometry.coordinates,
            },
            properties: {
                sourceId: rawPoint.properties.UniqueFireIdentifier,
                name: this.fixFireName(rawPoint),
                fireType: rawPoint.properties.IncidentTypeCategory,
                landmark: rawPoint.properties.IncidentShortDescription,
                state: rawPoint.properties.POOState,
                county: rawPoint.properties.POOCounty,
                agency: rawPoint.properties.POOJurisdictionalAgency,
                discoveredAt: new Date(
                    rawPoint.properties.FireDiscoveryDateTime
                ),
                lastUpdated: new Date(
                    rawPoint.properties.ModifiedOnDateTime_dt
                ),
                status: this.fixFireStatus(rawPoint),
                area: rawPoint.properties.IncidentSize,
                containment: rawPoint.properties.PercentContained,
                cause: rawPoint.properties.FireCause,
                source: 'NIFC',
            },
        };

        return processedPoint;
    }

    fixFireName(rawPoint) {
        let newName = rawPoint.properties.IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

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

    fixFireStatus(rawPoint) {
        const behaviors = [
            rawPoint.properties.FireBehaviorGeneral,
            rawPoint.properties.FireBehaviorGeneral1,
            rawPoint.properties.FireBehaviorGeneral2,
            rawPoint.properties.FireBehaviorGeneral3,
        ];

        let status = [...new Set(behaviors)]
            .filter(behavior => behavior !== null)
            .join(', ');

        return status || null;
    }

    // Data Maintenance
    async cleanupOldFires(daysThreshold = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });
        console.log(`Cleaned up ${result.deletedCount} old fires`);
        return result;
    }

    async removeDuplicateFires() {
        const duplicates = await this.model.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            { $match: { count: { $gt: 1 } } },
        ]);

        let deletedCount = 0;
        for (const group of duplicates) {
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await this.model.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate fires`);
        return { deletedCount };
    }

    // Queries
    async findActiveFires() {
        return this.find({
            status: 'Active',
            hasContainment: 'true',
            minArea: 100,
        });
    }

    async findLargeFires(minArea = 10000) {
        return this.find({
            minArea: minArea,
            hasArea: 'true',
        });
    }

    async findByState(state) {
        return this.find({ state });
    }

    // Metadata
    async getFireStatistics() {
        const [allFires, activeFires, largeFires] = await Promise.all([
            this.find(),
            this.findActiveFires(),
            this.findLargeFires(10000),
        ]);

        return {
            total: allFires.length,
            active: activeFires.length,
            large: largeFires.length,
            totalArea: allFires.reduce(
                (sum, fire) => sum + (fire.properties.area || 0),
                0
            ),
        };
    }

    // Query Mapping
    mapQuery(apiQuery) {
        const dbQuery = {};

        // Field mappings
        const fieldMap = {
            sourceId: 'properties.sourceId',
            status: 'properties.status',
            cause: 'properties.cause',
            fireType: 'properties.fireType',
            state: 'properties.state',
        };

        for (const [apiField, dbField] of Object.entries(fieldMap)) {
            if (apiQuery[apiField] !== undefined) {
                dbQuery[dbField] = apiQuery[apiField];
            }
        }

        // Time-based filters
        if (apiQuery.minLastUpdated) {
            dbQuery['properties.lastUpdated'] = {
                $gte: new Date(apiQuery.minLastUpdated),
// ... (truncated — 33 more lines not shown)
```

### ./server/services/PerimeterService.js
*modified today*
```javascript
import Perimeter from '../models/Perimeter.js';

export class PerimeterService {
    constructor() {
        this.model = Perimeter;
    }

    // Data Access Methods
    async find(query = {}) {
        const dbQuery = this.mapQuery(query);
        let mongooseQuery = this.model.find(dbQuery);

        if (query.limit) {
            mongooseQuery = mongooseQuery.limit(parseInt(query.limit));
        }

        if (query.skip) {
            mongooseQuery = mongooseQuery.skip(parseInt(query.skip));
        }

        // Default: most recent first
        mongooseQuery = mongooseQuery.sort({ 'properties.lastUpdated': -1 });

        return mongooseQuery.exec();
    }

    async findOne(sourceId) {
        return this.model.findOne({ 'properties.sourceId': sourceId });
    }

    async create(perimeterData) {
        const newPerimeter = new this.model(perimeterData);
        return newPerimeter.save();
    }

    async update(sourceId, updateData) {
        return this.model.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            updateData,
            { new: true, runValidators: true }
        );
    }

    async delete(query = {}) {
        const dbQuery = this.mapQuery(query);

        if (Object.keys(dbQuery).length === 0) {
            throw new Error('Delete query requires filters');
        }

        return this.model.deleteMany(dbQuery);
    }

    // External Data Integration
    async renewPerimeters() {
        const perimeterData = await this.fetchPerimeters();
        console.log(
            `List of perimeters: ${perimeterData
                .map(p => p.properties.poly_IncidentName)
                .join(', ')}`
        );

        const operations = perimeterData.map(rawPerimeter => {
            const processedPerimeter = this.processPerimeter(rawPerimeter);
            return {
                updateOne: {
                    filter: {
                        'properties.sourceId':
                            processedPerimeter.properties.sourceId,
                    },
                    update: { $set: processedPerimeter },
                    upsert: true,
                },
            };
        });

        let added = 0,
            updated = 0,
            failed = [];

        try {
            const result = await this.model.bulkWrite(operations, {
                ordered: false,
            });
            added = result.upsertedCount;
            updated = result.modifiedCount;
        } catch (error) {
            if (error.writeErrors?.length) {
                failed = error.writeErrors.map(
                    e =>
                        operations[e.index]?.updateOne?.update?.$set?.properties
                            ?.name ?? 'unknown'
                );
                added = error.result?.upsertedCount ?? 0;
                updated = error.result?.modifiedCount ?? 0;
                error.writeErrors.forEach(e =>
                    console.error(
                        `Error processing perimeter ${
                            operations[e.index]?.updateOne?.filter?.[
                                'properties.sourceId'
                            ]
                        }:`,
                        e.errmsg
                    )
                );
            } else {
                console.error('Error during bulkWrite for perimeters:', error);
            }
        }

        console.log(
            `Added ${added} perimeters and Updated ${updated} perimeters`
        );
        if (failed.length)
            console.log(
                `Failed to process ${failed.length} perimeters: ${failed}`
            );

        await this.cleanupOldPerimeters();
        await this.removeDuplicatePerimeters();
        return { added, updated };
    }

    async fetchPerimeters() {
        const perimeterUrl =
            'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,poly_DateCurrent,attr_UniqueFireIdentifier&f=pgeojson';

        try {
            const response = await fetch(perimeterUrl);
            const data = await response.json();
            console.log(`Fetched ${data.features.length} Fire Perimeters`);
            return data.features;
        } catch (err) {
            console.error('Error fetching perimeter data:', err);
            throw err;
        }
    }

    // Data Processing
    processPerimeter(rawPerimeter) {
        const processedPerimeter = {
            ...rawPerimeter,
            geometry: this.normalizeGeometry(rawPerimeter.geometry),
            properties: {
                sourceId: rawPerimeter.properties.attr_UniqueFireIdentifier,
                name: this.fixPerimeterName(rawPerimeter),
                lastUpdated: new Date(rawPerimeter.properties.poly_DateCurrent),
            },
        };

        return processedPerimeter;
    }

    // Normalize incoming GeoJSON geometry to MultiPolygon with correctly-wound
    // rings. MongoDB's 2dsphere index requires the GeoJSON right-hand rule:
    // exterior rings must be counterclockwise (positive signed area) and
    // interior rings must be clockwise (negative signed area). The NIFC API
    // doesn't guarantee this, so we re-wind any rings that violate it.
    // Interior rings (unburned islands inside a perimeter) are preserved.
    normalizeGeometry(geometry) {
        const signedArea = ring => {
            let area = 0;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
            }
            return area / 2;
        };

        const fixPolygon = rings =>
            rings.map((ring, i) => {
                const shouldBeCCW = i === 0; // exterior ring
                const isCCW = signedArea(ring) > 0;
                return shouldBeCCW === isCCW ? ring : [...ring].reverse();
            });

        if (geometry.type === 'Polygon') {
            return {
                type: 'MultiPolygon',
                coordinates: [fixPolygon(geometry.coordinates)],
            };
        }
        if (geometry.type === 'MultiPolygon') {
            return {
                type: 'MultiPolygon',
                coordinates: geometry.coordinates.map(fixPolygon),
            };
        }
        // Unknown type — pass through unchanged rather than silently dropping it.
        return geometry;
    }

    fixPerimeterName(rawPerimeter) {
        const oldName = rawPerimeter.properties.poly_IncidentName;
        let newName = !oldName
            ? 'Unknown'
            : oldName
                  .trim()
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase());

        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

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

    // Data Maintenance
    async cleanupOldPerimeters(daysThreshold = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });
        console.log(`Cleaned up ${result.deletedCount} old perimeters`);
        return result;
    }

    async removeDuplicatePerimeters() {
        const duplicates = await this.model.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            { $match: { count: { $gt: 1 } } },
        ]);

        let deletedCount = 0;
        for (const group of duplicates) {
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await this.model.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate perimeters`);
        return { deletedCount };
    }

    // Queries
    async findRecentPerimeters(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.find({
            minLastUpdated: cutoffDate.toISOString(),
        });
    }

    async findOrphanedPerimeters(fireSourceIds) {
        return this.model.find({
            'properties.sourceId': { $nin: fireSourceIds },
        });
    }

    // Metadata
    async getPerimeterStats() {
        const [allPerimeters, recentPerimeters] = await Promise.all([
            this.find(),
            this.findRecentPerimeters(7),
        ]);

        const fireSourceIds = []; // Would come from FireService in real implementation
        const orphanedPerimeters = await this.findOrphanedPerimeters(
            fireSourceIds
        );

        return {
            total: allPerimeters.length,
            recent: recentPerimeters.length,
            orphaned: orphanedPerimeters.length,
            orphanedPercentage:
// ... (truncated — 42 more lines not shown)
```

### ./server/plugins/database.js
*modified 5 months ago*
```javascript
import { connectDB } from '../utils/db';

export default defineNitroPlugin(async () => {
  try {
    await connectDB();
    // console.log('Database connected successfully on startup');
  } catch (error) {
    console.error('Failed to connect to database on startup:', error);
  }
});

```

### ./server/middleware/adminAuth.js
*modified today*
```javascript
// server/middleware/adminAuth.js

// Routes + methods that require admin access
const PROTECTED = [
    { path: '/api/fire', method: 'POST' },
    { path: '/api/perimeter', method: 'POST' },
    { path: '/api/hotspots', method: 'POST' },
    { path: '/api/fire', method: 'DELETE' },
    { path: '/api/perimeter', method: 'DELETE' },
    { path: '/api/hotspots', method: 'DELETE' },
];

export default defineEventHandler(async event => {
    const { method, path } = event;

    const isProtected = PROTECTED.some(
        rule => path.startsWith(rule.path) && method === rule.method
    );

    if (!isProtected) return;

    // Path 1: machine-to-machine (GitHub Actions scheduler)
    const adminKey = getHeader(event, 'x-admin-key');
    const { adminSecret } = useRuntimeConfig(event);

    if (adminKey) {
        if (!adminSecret) {
            throw createError({
                statusCode: 500,
                statusMessage:
                    'Server misconfiguration: ADMIN_SECRET is not set',
            });
        }
        if (adminKey === adminSecret) return; // Authorized
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: invalid admin key',
        });
    }

    // Path 2: browser session (human admin)
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: not signed in',
        });
    }

    if (!session.user.isAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized user',
        });
    }

    // Re-verify isAdmin from DB — don't trust cookie alone for write operations
    const User = (await import('../models/User.js')).default;
    const dbUser = await User.findById(session.user.id).select('isAdmin');

    if (!dbUser) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: user not found',
        });
    }

    if (!dbUser.isAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Unauthorized user',
        });
    }
});

```

### ./server/routes/auth/google.get.js
*modified today*
```javascript
import User from '../../models/User.js';

export default defineOAuthGoogleEventHandler({
    async onSuccess(event, { user: googleUser }) {
        // Find or create user in MongoDB
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            user = await User.create({
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
                provider: 'google',
            });
        } else {
            // Refresh name/avatar and record login time
            user.name = googleUser.name;
            user.avatar = googleUser.picture;
            user.lastLoginAt = new Date();
            await user.save();
        }

        // Store minimal session data — don't store isAdmin in the cookie,
        // always re-check from DB on sensitive operations
        await setUserSession(event, {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
            },
        });

        return sendRedirect(event, '/');
    },

    onError(event, error) {
        console.error('Google OAuth error:', error);
        return sendRedirect(event, '/?authError=google');
    },
});

```

### ./server/routes/auth/logout.get.js
*modified today*
```javascript
export default defineEventHandler(async event => {
    await clearUserSession(event);
    return sendRedirect(event, '/');
});

```

### ./.github/workflows/refresh-fire-data.yml
*modified today*
```yaml
# .github/workflows/refresh-fire-data.yml

name: Refresh Fire Data

on:
    schedule:
        - cron: '0 */6 * * *' # Every 6 hours
    workflow_dispatch: # Alllow manual trigger from GitHub Actions UI

jobs:
    refresh:
        name: Renew fire and perimeter data
        runs-on: ubuntu-latest
        timeout-minutes: 10

        steps:
            - name: Wake app
              run: |
                  echo "Sending wake request to ${{ vars.APP_URL }}"
                  HTTP_STATUS=$(curl --silent --show-error \
                                    --max-time 30 \
                                    --retry 3 \
                                    --retry-delay 5 \
                                    --retry-connrefused \
                                    --write-out "%{http_code}" \
                                    --output /tmp/wake_response.json \
                                    "${{ vars.APP_URL }}/")
                  echo "Status: $HTTP_STATUS"
                  if [ "$HTTP_STATUS" -ne 200 ]; then
                    echo "Error: app unreachable, got $HTTP_STATUS"
                    cat /tmp/wake_response.json
                    exit 1
                  fi
                  echo "App is reachable."

            - name: Renew fire point data
              run: |
                  echo "Requesting fire data renewal..."
                  HTTP_STATUS=$(curl --silent --show-error \
                                    --max-time 60 \
                                    --retry 2 \
                                    --write-out "%{http_code}" \
                                    --output /tmp/fire_response.json \
                                    -X POST \
                                    -H "Content-Type: application/json" \
                                    -H "X-Admin-Key: ${{ secrets.ADMIN_SECRET }}" \
                                    -d '{"action":"renew"}' \
                                    "${{ vars.APP_URL }}/api/fire")

                  RESPONSE=$(cat /tmp/fire_response.json)
                  echo "Status: $HTTP_STATUS"
                  echo "Response: $RESPONSE"

                  if [ "$HTTP_STATUS" -ne 200 ]; then
                    echo "Error: expected 200, got $HTTP_STATUS"
                    exit 1
                  fi

                  ADDED=$(echo "$RESPONSE" | grep -o '"added":[0-9]*' | grep -o '[0-9]*')
                  UPDATED=$(echo "$RESPONSE" | grep -o '"updated":[0-9]*' | grep -o '[0-9]*')
                  echo "Fires added: ${ADDED:-unknown}, updated: ${UPDATED:-unknown}"

            - name: Renew perimeter data
              run: |
                  echo "Requesting perimeter data renewal..."
                  HTTP_STATUS=$(curl --silent --show-error \
                                    --max-time 60 \
                                    --retry 2 \
                                    --write-out "%{http_code}" \
                                    --output /tmp/perimeter_response.json \
                                    -X POST \
                                    -H "Content-Type: application/json" \
                                    -H "X-Admin-Key: ${{ secrets.ADMIN_SECRET }}" \
                                    -d '{"action":"renew"}' \
                                    "${{ vars.APP_URL }}/api/perimeter")

                  RESPONSE=$(cat /tmp/perimeter_response.json)
                  echo "Status: $HTTP_STATUS"
                  echo "Response: $RESPONSE"

                  if [ "$HTTP_STATUS" -ne 200 ]; then
                    echo "Error: expected 200, got $HTTP_STATUS"
                    exit 1
                  fi

                  ADDED=$(echo "$RESPONSE" | grep -o '"added":[0-9]*' | grep -o '[0-9]*')
                  UPDATED=$(echo "$RESPONSE" | grep -o '"updated":[0-9]*' | grep -o '[0-9]*')
                  echo "Perimeters added: ${ADDED:-unknown}, updated: ${UPDATED:-unknown}"

```
