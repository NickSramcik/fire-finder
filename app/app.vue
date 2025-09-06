<template>
  <div class="h-full">
    <NavBar :active-tab="activeTab" @switch-tab="switchTab" />
    <NuxtPage :active-tab="activeTab" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('map')

function switchTab(tab) {
  activeTab.value = tab
}
</script>

