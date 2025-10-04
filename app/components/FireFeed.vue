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
