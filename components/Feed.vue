<template>
    <h2>Map coming soon!</h2>

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
        const response = await fetch('http://localhost:2121/api/data');
        points.value = await response.json();
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
        const response = await fetch('http://localhost:2121/api/data', {
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
