# 🗺️ PROJECT BLUEPRINT
*Generated Mar 28, 2026, 10:29 PM PDT*

## Overview

Fire Finder — a wildfire mapping app designed to be fast, simple, and reliable. Displays active US wildfires and heat hotspots on an interactive Mapbox map. Data is fetched from external sources, processed server-side, and stored in MongoDB. A GitHub Actions cron job refreshes fire data automatically.

**Key Decisions**
- Mongoose schemas use { typeKey: "$type" } to avoid conflict between GeoJSON's "type" field and Mongoose's own schema type system — do not remove this without testing
- Server-side caching (server/utils/cache.js) sits in front of external API calls to avoid hitting rate limits on a tight budget
- Map interaction (Mapbox GL) is fully encapsulated in useMap.js — components must not call mapbox-gl directly
- Admin-only mutations (POST/DELETE on fire, perimeter, hotspot routes) are protected by adminAuth middleware, which accepts either a session cookie (UI) or x-admin-key header (GitHub Actions)
- Auth routes auto-detected from server/routes/auth/ filenames — adding a provider means adding a file, no other wiring needed

## Architecture

**Stack:** Nuxt, Vue 3, MongoDB (Mongoose), Mapbox GL, Tailwind CSS, DaisyUI, TypeScript
**Auth:** nuxt-auth-utils (Google OAuth)
**Deployment:** Fly.io, Docker
**Automation:** "Refresh Fire Data" (scheduled, manual)

## Project Priorities
- **Fast**: Lightweight construction to work on slow internet speeds in rural areas
- **Simple**: Readable & maintainable code, not over-engineered, easy for anyone to use
- **Reliable**: Automated data processing and error handling to stay up-to-date on a tight budget without fuss

> If critical context appears missing or truncated, ask before proceeding.

## Relationships

**`app/composables/useApiData.js`** — used by `app/composables/useFireData.js`, `app/composables/useHotspotData.js`
**`app/composables/useFireData.js`** — used by `app/components/FireFeed.vue` *(auto-import)*, `app/components/FireMap.vue` *(auto-import)*
**`app/composables/useMap.js`** — used by `app/components/FireMap.vue` *(auto-import)*
**`app/composables/useUser.js`** — used by `app/components/NavBar.vue` *(auto-import)*, `app/components/UserProfile.vue` *(auto-import)*
**`server/models/FirePoint.js`** — used by `server/services/FireService.js`
**`server/models/Perimeter.js`** — used by `server/services/PerimeterService.js`
**`server/models/Hotspot.js`** — used by `server/services/HotspotService.js`
**`server/models/User.js`** — used by `server/routes/auth/apple.get.js`, `server/routes/auth/google.get.js`
**`server/models/Data.js`** — used by `server/api/data/index.get.js`, `server/api/data/index.post.js`
**`server/services/FireService.js`** — used by `server/api/feed.js`, `server/api/fire.js`, `server/api/map-data.js`
**`server/services/PerimeterService.js`** — used by `server/api/map-data.js`, `server/api/perimeter.js`
**`server/services/HotspotService.js`** — used by `server/api/hotspots.js`
**`server/utils/db.js`** — used by `server/plugins/database.js`
**`server/utils/cache.js`** — used by `server/api/hotspots.js`, `server/api/map-data.js`

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

### .github

#### ./.github/workflows/refresh-fire-data.yml
*modified 1 week ago*
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

### App

#### ./app/app.vue
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

#### ./app/pages/index.vue
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

#### ./app/components/FireMap.vue
*modified 5 months ago*
**Uses:** useFireData, useMap

#### ./app/components/FireFeed.vue
*modified 5 months ago*
**Uses:** useFireData

#### ./app/components/NavBar.vue
*modified 1 week ago*
**Props:** activeTab
**Emits:** switch-tab
**Uses:** useUser

#### ./app/components/UserProfile.vue
*modified 1 week ago*
**Uses:** useUser

#### ./app/components/HelpPage.vue
*modified 6 months ago*
```vue
<template>
    <h2>Fire Feed</h2>

    <form @submit.prevent="submitData">
        <label for="name">Name:</label>
        <input id="name" v-model="name" type="text" required />

        <label for="location">Location:</label>
        <input id="location" v-model="location" type="text" required />

        <button type="submit">Add Data Point</button>
    </form>

    <ul>
        <li v-for="point in points" :key="point._id">
            {{ point.name }} - {{ point.location }}
        </li>
    </ul>
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
    await fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('/api/data');
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

#### ./app/composables/useApiData.js
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

#### ./app/composables/useFireData.js
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

#### ./app/composables/useHotspotData.js
*modified 4 months ago*
```javascript
import { ref, computed } from 'vue';
import { useApiData } from './useApiData.js';

export function useHotspotData() {
    const { data, loading, error, fetchData, clearError } = useApiData();

    const filters = ref({
        minConfidence: 30,
        minBrightness: 320,
        hours: 24,
    });

    // Computed properties
    const highConfidenceHotspots = computed(() => {
        if (!data.value) return [];
        return data.value.filter(
            hotspot => hotspot.properties.confidence >= 80
        );
    });

    const recentHotspots = computed(() => {
        if (!data.value) return [];
        const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours
        return data.value.filter(
            hotspot => new Date(hotspot.properties.acquisitionDate) > cutoff
        );
    });

    // Methods
    async function fetchHotspots(params = {}) {
        const queryParams = new URLSearchParams();

        // Apply filters
        if (filters.value.minConfidence > 0) {
            queryParams.append('minConfidence', filters.value.minConfidence);
        }
        if (filters.value.minBrightness > 0) {
            queryParams.append('minBrightness', filters.value.minBrightness);
        }

        // Merge custom params
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value);
        });

        return await fetchData(`/api/hotspots?${queryParams}`);
    }

    function setFilters(newFilters) {
        filters.value = { ...filters.value, ...newFilters };
    }

    return {
        // State
        hotspots: data,
        loading,
        error,
        filters,

        // Computed
        highConfidenceHotspots,
        recentHotspots,

        // Methods
        fetchHotspots,
        setFilters,
        clearError,
    };
}

```

#### ./app/composables/useMap.js
*modified 1 week ago*
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
                        ['get', 'brightness'],
                        300,
                        3, // Min brightness = small circle
                        370,
                        8, // Max brightness = larger circle
                    ],
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'brightness'],
                        300,
                        '#ffff00', // Yellow for cooler
                        320,
                        '#ff8000', // Orange
                        340,
                        '#ff4000', // Red-orange
                        370,
                        '#ff0000', // Red for hottest
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff',
                },
            });

            // Option 2: Heatmap layer for density visualization
            map.value.addLayer({
                id: `${sourceId}-heatmap`,
                type: 'heatmap',
                source: sourceId,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'brightness'],
                        300,
                        0,
                        370,
                        1,
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0,
                        1,
                        9,
                        3,
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0,
                        'rgba(0, 0, 255, 0)',
                        0.2,
                        'rgba(0, 255, 255, 0.5)',
                        0.4,
                        'rgba(0, 255, 0, 0.5)',
                        0.6,
                        'rgba(255, 255, 0, 0.5)',
                        0.8,
                        'rgba(255, 165, 0, 0.5)',
                        1,
                        'rgba(255, 0, 0, 0.5)',
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0,
                        2,
                        9,
                        20,
                    ],
                    'heatmap-opacity': 0.6,
                },
            });

            addedLayers.value.add(`${sourceId}-points`);
            addedLayers.value.add(`${sourceId}-heatmap`);
            console.log(
                `Hotspot layer added with ${hotspotData.length} features`
            );
        } catch (err) {
            console.error('Error adding hotspot layer:', err);
        }
    }

    // Add hotspot popup interactivity
    function addHotspotPopupInteractivity(sourceId = 'hotspots') {
        if (!map.value) return;

        const layerId = `${sourceId}-points`;

        // Remove existing event listeners
        map.value.off('click', layerId);
        map.value.off('mouseenter', layerId);
        map.value.off('mouseleave', layerId);

        // Click for popup
        map.value.on('click', layerId, e => {
            if (!e.features || e.features.length === 0) return;

            document
                .querySelectorAll('.mapboxgl-popup')
                .forEach(popup => popup.remove());

            new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: true,
                anchor: 'top-left',
            })
                .setLngLat(e.lngLat)
                .setHTML(createHotspotPopupContent(e.features[0]))
                .addTo(map.value);
        });

        // Cursor changes
        map.value.on('mouseenter', layerId, () => {
            map.value.getCanvas().style.cursor = 'pointer';
        });

        map.value.on('mouseleave', layerId, () => {
            map.value.getCanvas().style.cursor = '';
        });
    }

    function createHotspotPopupContent(feature) {
        const props = feature.properties;
        const date = new Date(props.acquisitionDate).toLocaleString();

        return `
      <div class="popup-content">
        <h3 class="font-bold text-lg">🔥 Infrared Hotspot</h3>
        <div class="mt-2 space-y-1 text-sm">
          <p><span class="font-semibold">Brightness:</span> ${
              props.brightness
          }K</p>
          <p><span class="font-semibold">Confidence:</span> ${
              props.confidence
          }%</p>
          <p><span class="font-semibold">Satellite:</span> ${
              props.satellite
          }</p>
          <p><span class="font-semibold">Detected:</span> ${date}</p>
          <p><span class="font-semibold">Fire Power:</span> ${
              props.frp || 'N/A'
          } MW</p>
        </div>
      </div>
    `;
    }

    // Toggle hotspot layers
    function toggleHotspotLayer(visible = true) {
        if (!map.value) return;

        const layers = ['hotspots-points', 'hotspots-heatmap'];
        layers.forEach(layerId => {
            if (map.value.getLayer(layerId)) {
                map.value.setLayoutProperty(
                    layerId,
                    'visibility',
                    visible ? 'visible' : 'none'
                );
            }
        });
    }

    // Add popup interactivity
    function addPopupInteractivity(sourceId = 'fires') {
        if (!map.value) {
            console.log('Map not ready for adding interactivity');
            return;
        }

        const layerId = `${sourceId}-points`;

        // Remove existing event listeners to prevent duplicates
        map.value.off('click', layerId);
        map.value.off('mouseenter', layerId);
        map.value.off('mouseleave', layerId);

        // Click for popup
        map.value.on('click', layerId, e => {
            if (!e.features || e.features.length === 0) return;

            // Remove any existing popups
            document
                .querySelectorAll('.mapboxgl-popup')
                .forEach(popup => popup.remove());

            new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: true,
                anchor: 'top-left',
            })
                .setLngLat(e.lngLat)
                .setHTML(createPopupContent(e.features[0]))
                .addTo(map.value);
        });

        // Cursor changes
        map.value.on('mouseenter', layerId, () => {
            if (map.value) {
                map.value.getCanvas().style.cursor = 'pointer';
            }
        });

        map.value.on('mouseleave', layerId, () => {
            if (map.value) {
                map.value.getCanvas().style.cursor = '';
            }
        });
    }

    function createPopupContent(feature) {
        const props = feature.properties;
        return `
      <div class="popup-content">
        <h3 class="font-bold text-lg">${props.name || 'Unknown Fire'}</h3>
        <p class="mt-2"><span class="font-semibold">Status:</span> ${
            props.status || 'Unknown'
        }</p>
        <p><span class="font-semibold">Containment:</span> ${
            props.containment ? props.containment + '%' : 'Unknown'
        }</p>
        <p><span class="font-semibold">Area:</span> ${
            props.area?.toLocaleString() || 'N/A'
        } acres</p>
        <p><span class="font-semibold">Last Updated:</span> ${
            props.lastUpdated
                ? new Date(props.lastUpdated).toLocaleDateString()
                : 'Unknown'
        }</p>
      </div>
    `;
    }

    // Cleanup
    function destroyMap() {
        if (map.value) {
            try {
                map.value.remove();
            } catch (err) {
                console.warn('Error removing map:', err);
            }
            map.value = null;
            mapLoaded.value = false;
            addedLayers.value.clear();
        }
    }

    // Auto-cleanup on unmount
    onUnmounted(() => {
        destroyMap();
    });

    return {
        map,
        mapLoaded,
        mapError,
        mapConfig,
        mapIcons,
        initializeMap,
        loadMapIcons,
        addFireLayer,
        addPerimeterLayer,
        addHotspotLayer,
        addHotspotPopupInteractivity,
        toggleHotspotLayer,
        addPopupInteractivity,
        destroyMap,
    };
}

```

#### ./app/composables/useUser.js
*modified 1 week ago*
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

### Root

- `./tailwind.config.js` — Tailwind CSS configuration
- `./fly.toml` — Fly.io config — firefinder

#### ./package.json
*modified 1 week ago*
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

#### ./nuxt.config.ts
*modified 1 week ago*
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

### Server

- `./server/api/data/index.get.js` — GET handler
- `./server/api/data/index.post.js` — POST handler
- `./server/plugins/database.js` — Nitro plugin
- `./server/routes/auth/apple.get.js` — Apple OAuth handler
- `./server/routes/auth/google.get.js` — Google OAuth handler
- `./server/routes/auth/logout.get.js` — logout GET handler

#### ./server/models/FirePoint.js
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

#### ./server/models/Perimeter.js
*modified 1 week ago*
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

#### ./server/models/Hotspot.js
*modified 4 months ago*
```javascript
import { Schema, model } from 'mongoose';

const hotspotSchema = new Schema(
    {
        geometry: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        properties: {
            sourceId: String,
            brightness: Number, // Kelvin temperature
            confidence: Number, // 0-100 confidence score
            satellite: String, // 'VIIRS' or 'MODIS'
            acquisitionDate: Date,
            scan: Number, // Pixel size
            track: Number, // Pixel size
            frp: Number, // Fire Radiative Power (MW)
            daynight: String, // 'D' or 'N' for Day and Night, respectively
            source: {
                type: String,
                default: 'NASA_FIRMS',
            },
        },
    },
    { timestamps: true }
);

hotspotSchema.index({ geometry: '2dsphere' });
hotspotSchema.index({ 'properties.acquisitionDate': -1 });
hotspotSchema.index({ 'properties.confidence': -1 });

export default model('Hotspot', hotspotSchema);

```

#### ./server/models/User.js
*modified 1 week ago*
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

#### ./server/models/Data.js
*modified 6 months ago*
```javascript
import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true }
});

export default mongoose.model('Data', dataSchema); // Use default export

```

#### ./server/services/FireService.js
*modified 1 week ago*
```javascript
export class FireService {
    constructor()
    async find(query = {})
    async findOne(sourceId)
    async create(fireData)
    async update(sourceId, updateData)
    async delete(query = {})
    async renewFires()
    async fetchFirePoints()
    processFire(rawPoint)
    fixFireName(rawPoint)
    fixFireStatus(rawPoint)
    async cleanupOldFires(daysThreshold = 90)
    async removeDuplicateFires()
    async findActiveFires()
    async findLargeFires(minArea = 10000)
    async findByState(state)
    async getFireStatistics()
    mapQuery(apiQuery)
}
```

#### ./server/services/PerimeterService.js
*modified 1 week ago*
```javascript
export class PerimeterService {
    constructor()
    async find(query = {})
    async findOne(sourceId)
    async create(perimeterData)
    async update(sourceId, updateData)
    async delete(query = {})
    async renewPerimeters()
    async fetchPerimeters()
    processPerimeter(rawPerimeter)
    normalizeGeometry(geometry)
    fixPerimeterName(rawPerimeter)
    async cleanupOldPerimeters(daysThreshold = 90)
    async removeDuplicatePerimeters()
    async findRecentPerimeters(days = 7)
    async findOrphanedPerimeters(fireSourceIds)
    async getPerimeterStats()
    mapQuery(apiQuery)
}
```

#### ./server/services/HotspotService.js
*modified 4 months ago*
```javascript
export class HotspotService {
    constructor()
    async fetchHotspots(area = null, days = 1)
    parseCSVData(csvText)
    async fetchHotspotsKML(area = null, days = 1)
    parseKMLData(kmlText)
    async renewHotspots(area = null, days = 1)
    async cleanupOldHotspots(daysThreshold = 7)
    async find(query = {})
    async findOne(sourceId)
    async create(hotspotData)
    async update(sourceId, updateData)
    async delete(query = {})
    mapQuery(apiQuery)
    async getHotspotStatistics()
}
```

#### ./server/middleware/adminAuth.js
*modified 1 week ago*
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

#### ./server/api/fire.js
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

#### ./server/api/perimeter.js
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

#### ./server/api/hotspots.js
*modified 4 months ago*
```javascript
import { defineEventHandler, getQuery, readBody } from 'h3';
import { hotspotService } from '../services/HotspotService.js';
import { cache } from '../utils/cache.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET - Fetch hotspots with caching
        if (event.method === 'GET') {
            const cacheKey = `hotspots:${JSON.stringify(queryParams)}`;
            const cached = cache.get(cacheKey);

            if (cached) {
                console.log('Using cached hotspots data');
                return cached;
            }

            const hotspots = await hotspotService.find(queryParams);
            const result = { statusCode: 200, data: hotspots };

            // Cache for 5 minutes (hotspots update every 3-6 hours)
            cache.set(cacheKey, result, 300000);
            return result;
        }

        // POST - Handle renew action
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                console.log('Renewing hotspot data from NASA FIRMS...');

                // Optional area parameter for targeted updates
                const area = body.area || null;
                const days = body.days || 1;

                const result = await hotspotService.renewHotspots(area, days);

                // Clear relevant cache entries
                cache.delete(/^hotspots:/);
                console.log('Hotspot data renewed successfully');

                return { statusCode: 200, data: result };
            }

            // Handle creating individual hotspots if needed
            if (body.geometry && body.properties) {
                const newHotspot = await hotspotService.create(body);
                return { statusCode: 201, data: newHotspot };
            }

            return createError({
                statusCode: 400,
                statusMessage: 'Invalid action or missing required fields',
            });
        }

        // PUT - Update existing hotspot
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.properties?.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedHotspot = await hotspotService.update(
                body.properties.sourceId,
                body
            );

            // Clear cache for this hotspot
            cache.delete(/^hotspots:/);
            return { statusCode: 200, data: updatedHotspot };
        }

        // DELETE - Remove hotspots
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'Filter parameters required for deletion',
                });
            }

            const result = await hotspotService.delete(queryParams);

            // Clear all hotspots cache
            cache.delete(/^hotspots:/);
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
        console.error('Error in hotspots API:', error);
        return createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});

```

#### ./server/api/map-data.js
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

#### ./server/api/feed.js
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

#### ./server/utils/db.js
*modified 6 months ago*
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

#### ./server/utils/cache.js
*modified 6 months ago*
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
