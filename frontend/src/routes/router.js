import { createRouter, createWebHistory } from 'vue-router';
import { shallowRef } from 'vue';
import FireMap from '../components/FireMap.vue';

// Lazy-loaded components with shallowRef to avoid extra overhead
const FireFeed = shallowRef(() => import('./components/FireFeed.vue'));
const Help = shallowRef(() => import('./components/Help.vue'));
const Profile = shallowRef(() => import('./components/Profile.vue'));

const routes = [
    { path: '/', component: FireMap }, // Default route 
    { path: '/feed', component: FireFeed },
    { path: '/help', component: Help },
    { path: '/profile', component: Profile },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
