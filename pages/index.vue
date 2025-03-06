<template>
  <main class="h-full">
    <KeepAlive>
      <component :is="currentComponent" />
    </KeepAlive>
  </main>
</template>

<script setup>
import Map from '~/components/Map.vue'
import Feed from '~/components/Feed.vue'
import Help from '~/components/Help.vue'
import Profile from '~/components/Profile.vue'

const props = defineProps(['activeTab'])

const components = {
  map: Map,
  feed: Feed,
  help: Help,
  profile: Profile
}

const currentComponent = computed(() => components[props.activeTab])
</script>

<style>

html, body, #app, main {
  		height: 100%;
  		margin: 0;
  		padding: 0;
}

</style>