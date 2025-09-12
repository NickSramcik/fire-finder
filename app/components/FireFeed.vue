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
              <td>{{ point.properties.area?.toLocaleString('en') }}</td>
              <td>{{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.status }}</td>
              <td>{{ getContainment(point.properties) }}</td>
              <td>{{ point.properties.fireType == 'RX' ? 'Prescribed' : point.properties.cause || 'Unknown' }}</td>
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
    if (point.status == 'Prescribed') return '100%';
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
