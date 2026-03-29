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
            <button class="btn btn-ghost btn-sm" @click="signOut">Sign out</button>
          </div>
        </div>
      </div>

      <!-- Admin dashboard -->
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
            <div class="stat-title">IR Hotspots</div>
            <div class="stat-value text-warning text-2xl">{{ totalHotspots }}</div>
            <div class="stat-desc">Last 24h: {{ recentHotspots }}</div>
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
                  <span class="font-medium">Orphaned Perimeters:</span>
                  <span class="badge badge-warning">{{ orphanedPerimetersCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Stats Last Updated:</span>
                  <span class="text-sm">{{ statsLastUpdated }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management Actions -->
        <div class="space-y-4 mb-8">

          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title">Fire Point Data</h3>
              <p class="text-sm mb-4">Update fire point data from NIFC</p>
              <button :disabled="fireLoading" class="btn btn-accent w-full md:w-auto" @click="renewFires">
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
              <p class="text-sm mb-4">Update fire perimeter data from NIFC</p>
              <button :disabled="perimeterLoading" class="btn btn-accent w-full md:w-auto" @click="renewPerimeters">
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

          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title">IR Hotspot Data</h3>
              <p class="text-sm mb-4">Fetch latest infrared hotspots from NASA (last 24h, US-wide)</p>
              <button :disabled="hotspotLoading" class="btn btn-accent w-full md:w-auto" @click="renewHotspots">
                {{ hotspotLoading ? 'Updating...' : 'Renew Hotspot Data' }}
              </button>
              <div v-if="hotspotResponse" class="mt-3 p-3 bg-success/20 rounded">
                <p class="text-success font-semibold">Success!</p>
                <p>Added {{ hotspotResponse.added }}, updated {{ hotspotResponse.updated }} ({{ hotspotResponse.total }} processed).</p>
              </div>
              <div v-if="hotspotError" class="mt-3 p-3 bg-error/20 rounded">
                <p class="text-error font-semibold">Error:</p>
                <p>{{ hotspotError }}</p>
              </div>
            </div>
          </div>

          <!-- IR Reset — separate card, destructive action -->
          <div class="card bg-base-200 border border-warning/30">
            <div class="card-body">
              <h3 class="card-title text-warning">⚠️ Reset IR Hotspot Data</h3>
              <p class="text-sm mb-4">
                Deletes all hotspot data from the database, then re-fetches the last 7 days from NASA.
                Use this to fix corrupt or stale data.
              </p>
              <button
                :disabled="resetLoading"
                class="btn btn-warning w-full md:w-auto"
                @click="confirmReset"
              >
                {{ resetLoading ? 'Resetting...' : 'Reset IR Data (7 days)' }}
              </button>
              <div v-if="resetResponse" class="mt-3 p-3 bg-success/20 rounded">
                <p class="text-success font-semibold">Reset complete!</p>
                <p>Deleted {{ resetResponse.deleted }} old records. Added {{ resetResponse.added }}, updated {{ resetResponse.updated }} from NASA.</p>
              </div>
              <div v-if="resetError" class="mt-3 p-3 bg-error/20 rounded">
                <p class="text-error font-semibold">Error:</p>
                <p>{{ resetError }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Activity Log -->
        <div class="card bg-base-200">
          <div
            class="card-body cursor-pointer select-none"
            @click="logExpanded = !logExpanded"
          >
            <div class="flex justify-between items-center">
              <h3 class="card-title">
                📋 Activity Log
                <span v-if="activityLog.length" class="badge badge-neutral badge-sm font-normal">
                  {{ activityLog.length }} entries
                </span>
              </h3>
              <div class="flex items-center gap-3">
                <!-- Last event summary when collapsed -->
                <span v-if="!logExpanded && activityLog.length" class="text-sm text-base-content/60">
                  Last: {{ formatRelativeTime(activityLog[0]?.createdAt) }}
                  <span :class="typeBadgeClass(activityLog[0]?.type)" class="badge badge-sm ml-1">
                    {{ activityLog[0]?.type }}
                  </span>
                </span>
                <span class="text-base-content/40 text-lg">{{ logExpanded ? '▲' : '▼' }}</span>
              </div>
            </div>
          </div>

          <!-- Log entries -->
          <div v-if="logExpanded" class="px-6 pb-6">
            <div v-if="logLoading" class="text-center py-4 text-base-content/50">Loading...</div>
            <div v-else-if="!activityLog.length" class="text-center py-4 text-base-content/40 text-sm">
              No activity recorded yet.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="entry in activityLog"
                :key="entry._id"
                class="rounded-lg bg-base-300 overflow-hidden"
              >
                <!-- Collapsed row -->
                <div
                  class="flex items-center gap-3 p-3 cursor-pointer hover:bg-base-300/80"
                  @click="toggleEntry(entry._id)"
                >
                  <span :class="typeBadgeClass(entry.type)" class="badge badge-sm shrink-0">
                    {{ entry.type }}
                  </span>
                  <span class="text-xs shrink-0">{{ sourceEmoji(entry.source) }}</span>
                  <span class="text-sm flex-1 truncate">{{ entry.message }}</span>
                  <span class="text-xs text-base-content/40 shrink-0">
                    {{ formatRelativeTime(entry.createdAt) }}
                  </span>
                  <span class="text-base-content/30 text-xs shrink-0">
                    {{ expandedEntries.has(entry._id) ? '▲' : '▼' }}
                  </span>
                </div>

                <!-- Expanded details -->
                <div v-if="expandedEntries.has(entry._id)" class="px-3 pb-3 border-t border-base-content/10">
                  <div class="mt-2 space-y-1 text-xs font-mono text-base-content/70">
                    <div><span class="text-base-content/40">source:</span> {{ entry.source }}</div>
                    <div><span class="text-base-content/40">trigger:</span> {{ entry.trigger }}</div>
                    <div><span class="text-base-content/40">time:</span> {{ formatFullTime(entry.createdAt) }}</div>
                    <template v-if="entry.details">
                      <div
                        v-for="(val, key) in entry.details"
                        :key="key"
                      >
                        <span class="text-base-content/40">{{ key }}:</span> {{ val }}
                      </div>
                    </template>
                  </div>
                </div>
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

// ---- Data ----
const fireData      = ref(null);
const perimeterData = ref(null);
const hotspotStats  = ref(null);
const activityLog   = ref([]);
const statsLastUpdated = ref(null);

// ---- Action states ----
const fireLoading      = ref(false);
const fireError        = ref(null);
const fireResponse     = ref(null);

const perimeterLoading  = ref(false);
const perimeterError    = ref(null);
const perimeterResponse = ref(null);

const hotspotLoading  = ref(false);
const hotspotError    = ref(null);
const hotspotResponse = ref(null);

const resetLoading  = ref(false);
const resetError    = ref(null);
const resetResponse = ref(null);

// ---- Log UI state ----
const logExpanded    = ref(false);
const logLoading     = ref(false);
const expandedEntries = ref(new Set());

function toggleEntry(id) {
  const next = new Set(expandedEntries.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expandedEntries.value = next;
}

// ---- Helpers ----
function getFiresArray() {
  if (!fireData.value) return [];
  return Array.isArray(fireData.value) ? fireData.value : fireData.value.fires || [];
}

function getPerimetersArray() {
  if (!perimeterData.value) return [];
  return Array.isArray(perimeterData.value) ? perimeterData.value : perimeterData.value.perimeters || [];
}

function typeBadgeClass(type) {
  return {
    success: 'badge-success',
    error:   'badge-error',
    reset:   'badge-warning',
  }[type] ?? 'badge-neutral';
}

function sourceEmoji(source) {
  return { fire: '🔥', perimeter: '📍', hotspot: '🌡️' }[source] ?? '•';
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatFullTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
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

const totalHotspots  = computed(() => hotspotStats.value?.total  ?? '—');
const recentHotspots = computed(() => hotspotStats.value?.recent ?? '—');

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

// ---- Data fetching ----
async function fetchAdminData() {
  const [firesRes, perimetersRes, hotspotRes] = await Promise.all([
    $fetch('/api/map-data'),
    $fetch('/api/perimeter'),
    $fetch('/api/hotspots/stats'),
  ]);
  fireData.value      = firesRes;
  perimeterData.value = perimetersRes;
  hotspotStats.value  = hotspotRes?.data ?? null;
  statsLastUpdated.value = new Date().toLocaleString();
}

async function fetchActivityLog() {
  logLoading.value = true;
  try {
    const res = await $fetch('/api/activity-log');
    activityLog.value = res.data ?? [];
  } catch (err) {
    console.error('Failed to fetch activity log:', err);
  } finally {
    logLoading.value = false;
  }
}

// ---- Actions ----
async function renewFires() {
  fireLoading.value = true;
  fireError.value = null;
  fireResponse.value = null;
  try {
    const res = await $fetch('/api/fire', { method: 'POST', body: { action: 'renew' } });
    fireResponse.value = res.data;
    await Promise.all([fetchAdminData(), fetchActivityLog()]);
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
    const res = await $fetch('/api/perimeter', { method: 'POST', body: { action: 'renew' } });
    perimeterResponse.value = res.data;
    await Promise.all([fetchAdminData(), fetchActivityLog()]);
  } catch (err) {
    perimeterError.value = err?.data?.statusMessage || err.message || 'Unknown error';
  } finally {
    perimeterLoading.value = false;
  }
}

async function renewHotspots() {
  hotspotLoading.value = true;
  hotspotError.value = null;
  hotspotResponse.value = null;
  try {
    const res = await $fetch('/api/hotspots', { method: 'POST', body: { action: 'renew' } });
    hotspotResponse.value = res.data;
    await Promise.all([fetchAdminData(), fetchActivityLog()]);
  } catch (err) {
    hotspotError.value = err?.data?.statusMessage || err.message || 'Unknown error';
  } finally {
    hotspotLoading.value = false;
  }
}

async function confirmReset() {
  if (!confirm('Delete all IR hotspot data and re-fetch 7 days from NASA? This may take a minute.')) return;
  resetLoading.value = true;
  resetError.value = null;
  resetResponse.value = null;
  try {
    const res = await $fetch('/api/hotspots', { method: 'POST', body: { action: 'reset' } });
    resetResponse.value = res.data;
    await Promise.all([fetchAdminData(), fetchActivityLog()]);
  } catch (err) {
    resetError.value = err?.data?.statusMessage || err.message || 'Unknown error';
  } finally {
    resetLoading.value = false;
  }
}

onMounted(() => {
  if (isAdmin.value) {
    fetchAdminData();
    fetchActivityLog();
  }
});
</script>
