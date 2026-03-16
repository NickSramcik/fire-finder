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

const { loggedIn, user, isAdmin, signInWithGoogle, signInWithApple, signOut } = useUser();

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
    const res = await $fetch('/api/perimeter', {
      method: 'POST',
      body: { action: 'renew' },
    });
    perimeterResponse.value = res.data;
    await fetchAdminData();
  } catch (err) {
    perimeterError.value = err?.data?.statusMessage || err.message || 'Unknown error';
  } finally {
    perimeterLoading.value = false;
  }
}

// Only fetch admin data if the user is actually an admin
onMounted(() => {
  if (isAdmin.value) fetchAdminData();
});
</script>
