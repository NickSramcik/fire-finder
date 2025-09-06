<template>

  <nav class="bg-base-200 flex items-center p-4">
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


<style>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #1f1f1f;
}

button {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
}

button.active {
  font-weight: bold;
  color: #ff5722;
}
</style>
