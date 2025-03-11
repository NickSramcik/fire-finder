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
