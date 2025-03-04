<template>

<h2>Admin Options</h2>

<div>
    <button @click="renewFires" class="btn btn-accent">Renew Fire Data</button>
    <p v-if="loading">Loading...</p>
    <p v-if="error">{{ error }}</p>
    <p v-if="response">{{ response }}</p>
  </div>

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

// Reactive state
const loading = ref(false); // Track loading state
const error = ref(null); // Track error messages
const response = ref(null); // Store API response

// Function to send the API request
async function renewFires() {
    loading.value = true; // Set loading to true
    error.value = null; // Reset error
    response.value = null; // Reset response

    try {
    // Send the API request
    const result = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
        }),
    });

    // Parse the response
    const data = await result.json();
    response.value = data; // Store the response
    } catch (err) {
        error.value = 'Failed to send request: ' + err.message; // Handle errors
    } finally {
        loading.value = false; // Reset loading state
    }
};

</script>

<style scoped>
form, label, input, button, h2 {
  margin: 1rem;
}

</style>
