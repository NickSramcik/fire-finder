<template>

<h2>Admin Options</h2>

<div>
    <button @click="renewFires" class="btn btn-accent">Renew Fire Data</button>
    <p v-if="loading">Loading...</p>
    <p v-if="error">Error: {{ error }}</p>
    <p v-if="response">Success! Added {{ response.data.added }} fires, updated {{ response.data.updated }} fires.</p>
</div>

</template>

<script setup>
import { ref } from 'vue';

const loading = ref(false);
const error = ref(null);
const response = ref(null);

async function renewFires() {
  loading.value = true;
  error.value = null;
  response.value = null;

  try {
    const res = await fetch('/api/renewFires', {
      method: 'POST'
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    response.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
form, label, input, button, h2 {
  margin: 1rem;
}

</style>
