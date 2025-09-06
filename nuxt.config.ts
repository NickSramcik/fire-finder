// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mapbox',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
  ],
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  runtimeConfig: {
    public: {
      mapboxToken: process.env.PUBLIC_MAPBOX_TOKEN,
    },
  },
})