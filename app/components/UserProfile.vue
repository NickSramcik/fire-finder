<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Admin Dashboard</h2>

    <!-- Stats Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <!-- Total Fires -->
      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-title">Total Fires</div>
        <div class="stat-value text-primary text-2xl">{{ totalFires }}</div>
        <div class="stat-desc">In database</div>
      </div>
      
      <!-- Active Fires -->
      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-title">Active Fires</div>
        <div class="stat-value text-secondary text-2xl">{{ activeFiresCount }}</div>
        <div class="stat-desc">Containment &lt; 100%</div>
      </div>
      
      <!-- Total Perimeters -->
      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-title">Total Perimeters</div>
        <div class="stat-value text-accent text-2xl">{{ totalPerimeters }}</div>
        <div class="stat-desc">In database</div>
      </div>

      <!-- Orphaned Perimeters -->
      <div class="stat bg-base-200 rounded-lg">
        <div class="stat-title">Orphaned Perimeters</div>
        <div class="stat-value text-warning text-2xl">{{ orphanedPerimetersCount }}</div>
        <div class="stat-desc">No matching fire</div>
      </div>
    </div>

    <!-- Detailed Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Fire Statistics -->
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

      <!-- Perimeter Statistics -->
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
      <!-- Fire Data Update -->
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

      <!-- Perimeter Data Update -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Reactive data
const fireData = ref(null);
const perimeterData = ref(null);
const loading = ref(false);

// Admin action states
const fireLoading = ref(false);
const fireError = ref(null);
const fireResponse = ref(null);

const perimeterLoading = ref(false);
const perimeterError = ref(null);
const perimeterResponse = ref(null);

const statsLastUpdated = ref(null);

// Helper function to safely get array from data
function getFiresArray() {
  if (!fireData.value) return [];
  // Handle both array and object with fires property
  return Array.isArray(fireData.value) ? fireData.value : fireData.value.fires || [];
}

function getPerimetersArray() {
  if (!perimeterData.value) return [];
  // Handle both array and object with perimeters property
  return Array.isArray(perimeterData.value) ? perimeterData.value : perimeterData.value.perimeters || [];
}

// Computed properties for statistics
const totalFires = computed(() => getFiresArray().length);

const activeFiresCount = computed(() => {
  const fires = getFiresArray();
  return fires.filter(fire => {
    const containment = fire.properties?.containment;
    return containment !== null && containment !== undefined && containment < 100;
  }).length;
});

const totalPerimeters = computed(() => getPerimetersArray().length);

const prescribedFiresCount = computed(() => {
  const fires = getFiresArray();
  return fires.filter(fire => 
    fire.properties?.fireType === 'RX' || 
    fire.properties?.status === 'Prescribed'
  ).length;
});

const containedFiresCount = computed(() => {
  const fires = getFiresArray();
  return fires.filter(fire => 
    fire.properties?.containment === 100
  ).length;
});

const largeFiresCount = computed(() => {
  const fires = getFiresArray();
  return fires.filter(fire => 
    (fire.properties?.area || 0) > 10000
  ).length;
});

const averageContainment = computed(() => {
  const fires = getFiresArray();
  if (fires.length === 0) return 0;
  
  const validFires = fires.filter(fire => 
    fire.properties?.containment !== null && 
    fire.properties?.containment !== undefined
  );
  
  if (validFires.length === 0) return 0;
  
  const totalContainment = validFires.reduce((sum, fire) => 
    sum + fire.properties.containment, 0
  );
  
  return Math.round(totalContainment / validFires.length);
});

// Perimeter matching logic
const matchedPerimetersCount = computed(() => {
  const fires = getFiresArray();
  const perimeters = getPerimetersArray();
  
  if (fires.length === 0 || perimeters.length === 0) return 0;
  
  const fireSourceIds = new Set(
    fires.map(fire => fire.properties?.sourceId).filter(Boolean)
  );
  
  return perimeters.filter(perimeter => 
    fireSourceIds.has(perimeter.properties?.sourceId)
  ).length;
});

const orphanedPerimetersCount = computed(() => {
  const fires = getFiresArray();
  const perimeters = getPerimetersArray();
  
  if (fires.length === 0 || perimeters.length === 0) return 0;
  
  const fireSourceIds = new Set(
    fires.map(fire => fire.properties?.sourceId).filter(Boolean)
  );
  
  return perimeters.filter(perimeter => 
    !fireSourceIds.has(perimeter.properties?.sourceId)
  ).length;
});

const orphanedPercentage = computed(() => {
  const total = totalPerimeters.value;
  if (total === 0) return 0;
  return Math.round((orphanedPerimetersCount.value / total) * 100);
});

// Update stats timestamp
function updateStatsTimestamp() {
  statsLastUpdated.value = new Date().toLocaleString();
}

// Data fetching functions
async function fetchFires() {
  loading.value = true;
  try {
    const response = await $fetch('/api/map-data');
    fireData.value = response;
    updateStatsTimestamp();
  } catch (error) {
    console.error('Error fetching fires:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchPerimeters() {
  loading.value = true;
  try {
    const response = await $fetch('/api/perimeter');
    perimeterData.value = response;
    updateStatsTimestamp();
  } catch (error) {
    console.error('Error fetching perimeters:', error);
  } finally {
    loading.value = false;
  }
}

// Load initial data
onMounted(async () => {
  await Promise.all([fetchFires(), fetchPerimeters()]);
});

// Watch for data changes to update stats
watch([fireData, perimeterData], () => {
  updateStatsTimestamp();
});

// Admin actions
async function renewFires() {
  fireLoading.value = true;
  fireError.value = null;
  fireResponse.value = null;

  try {
    const res = await fetch('/api/fire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    fireResponse.value = data.data;
    
    // Refresh fire data to update statistics
    await fetchFires();
  } catch (err) {
    fireError.value = err.message;
  } finally {
    fireLoading.value = false;
  }
}

async function renewPerimeters() {
  perimeterLoading.value = true;
  perimeterError.value = null;
  perimeterResponse.value = null;

  try {
    const res = await fetch('/api/perimeter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    perimeterResponse.value = data.data;
    
    // Refresh perimeter data to update statistics
    await fetchPerimeters();
  } catch (err) {
    perimeterError.value = err.message;
  } finally {
    perimeterLoading.value = false;
  }
}
</script>

<style scoped>
.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-value {
  font-size: 1.75rem !important;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
</style>
