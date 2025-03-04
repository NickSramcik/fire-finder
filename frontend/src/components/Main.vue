<script setup>
import { ref } from 'vue';
import FireMap from './FireMap.vue';
import FireFeed from './FireFeed.vue';
import Help from './Help.vue';
import Profile from './Profile.vue';
import NavBar from './NavBar.vue';

// State for the active tab
const activeTab = ref('map');

// Tab components
const tabs = {
  map: FireMap,
  feed: FireFeed,
  help: Help,
  profile: Profile,
};

// Function to switch tabs
function switchTab(tab) {
  activeTab.value = tab;
}
</script>


<template>
  <main>
    <NavBar :activeTab="activeTab" @switch-tab="switchTab" />

    <!-- Render the active tab component -->
    <KeepAlive>
      <component :is="tabs[activeTab]" />
    </KeepAlive>
  </main>
</template>
    

<style>

</style>