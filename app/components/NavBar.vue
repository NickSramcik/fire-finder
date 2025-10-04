<template>
  <nav class="bg-base-200 flex items-center p-4 navbar">
    <button :class="{ active: activeTab === 'map'}" @click="switchTab('map')">Fire Finder</button>
    <button :class="{ active: activeTab === 'feed'}" @click="switchTab('feed')">Feed</button>
    <button :class="{ active: activeTab === 'help'}" @click="switchTab('help')">Help</button>
    <button :class="{ active: activeTab === 'profile'}" @click="switchTab('profile')">Profile</button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['switch-tab']);
function switchTab(tab) {
  emit('switch-tab', tab);
}
</script>

<style scoped>
.navbar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #1f1f1f;
  height: 4rem; 
  box-sizing: border-box;
}

button {
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  background: none;
  color: #ccc;
}

button:hover {
  background-color: #333;
  color: white;
}

button.active {
  background-color: #ff5722;
  color: white;
  font-weight: bold;
}
</style>
