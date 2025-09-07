<template>
  <div>
    <h2>Admin Options</h2>

    <div>
      <button class="btn btn-accent" @click="renewFires">Renew Fire Point Data</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error">Error: {{ error }}</p>
      <p v-if="response">Success! Added {{ response.added }} fires, updated {{ response.updated }} fires.</p>
    </div>

    <div>
      <button class="btn btn-accent" @click="renewPerimeters">Renew Fire Perimeters</button>
      <p v-if="loading">Loading...</p>
      <p v-if="error">Error: {{ error }}</p>
      <p v-if="response">Success! Added {{ response.added }} fire perimeters, updated {{ response.updated }} fire perimeters.</p>
    </div>
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
    const res = await fetch('/api/fires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    response.value = data.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function renewPerimeters() {
  loading.value = true;
  error.value = null;
  response.value = null;

  try {
    const res = await fetch('/api/perimeters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew' })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    response.value = data.data;
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