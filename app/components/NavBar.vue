<template>
  <nav class="navbar">
    <button :class="{ active: activeTab === 'map' }" @click="switchTab('map')">Fire Finder</button>
    <button :class="{ active: activeTab === 'feed' }" @click="switchTab('feed')">Feed</button>
    <button :class="{ active: activeTab === 'help' }" @click="switchTab('help')">Help</button>
    <button :class="{ active: activeTab === 'profile' }" @click="switchTab('profile')">Profile</button>

    <div class="spacer" />

    <!-- Guest: sign in button -->
    <button v-if="!loggedIn" @click="showSignIn = true">Sign in</button>

    <!-- Signed in: avatar button opens logout modal -->
    <button v-else class="avatar-btn" @click="showAccount = true">
      <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="avatar" />
      <span v-else>{{ user?.name?.charAt(0) ?? '?' }}</span>
    </button>

    <!-- Sign-in modal -->
    <dialog :open="showSignIn" class="modal">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg mb-2">Sign in</h3>
        <p class="text-sm text-base-content/70 mb-6">
          Save your home location and settings across devices.
        </p>
        <div class="flex flex-col gap-3">
          <button class="btn btn-outline w-full gap-2" @click="signInWithGoogle">
            <img src="https://www.google.com/favicon.ico" class="w-4 h-4" alt="" />
            Continue with Google
          </button>
          <!-- <button class="btn btn-outline w-full gap-2" @click="signInWithApple">
            Continue with Apple
          </button> -->
        </div>
        <p class="text-xs text-center text-base-content/50 mt-4">
          Or continue as guest — no sign-in needed to view maps.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="showSignIn = false">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showSignIn = false" />
    </dialog>

    <!-- Account modal -->
    <dialog :open="showAccount" class="modal">
      <div class="modal-box max-w-sm">
        <div class="flex items-center gap-3 mb-6">
          <img v-if="user?.avatar" :src="user.avatar" :alt="user?.name" class="w-10 h-10 rounded-full" />
          <div v-else class="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center font-bold">
            {{ user?.name?.charAt(0) ?? '?' }}
          </div>
          <div>
            <p class="font-semibold">{{ user?.name }}</p>
            <p class="text-sm text-base-content/60">{{ user?.email }}</p>
          </div>
        </div>
        <div class="modal-action justify-between">
          <button class="btn btn-ghost btn-sm" @click="showAccount = false">Close</button>
          <button class="btn btn-error btn-sm" @click="signOut">Sign out</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showAccount = false" />
    </dialog>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useUser } from '~/composables/useUser';

defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['switch-tab']);
function switchTab(tab) {
  emit('switch-tab', tab);
}

const { loggedIn, user, signInWithGoogle, signInWithApple, signOut } = useUser();
const showSignIn = ref(false);
const showAccount = ref(false);
</script>

<style scoped>
nav.navbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #2a2a2a;
  height: 4rem;
  box-sizing: border-box;
}

.spacer {
  flex: 1;
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
  background-color: #3a3a3a;
  color: white;
}

button.active {
  background-color: #ff5722;
  color: white;
  font-weight: bold;
}

.avatar-btn {
  padding: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #ccc;
  background: none;
  border: 2px solid #ccc;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-btn:hover {
  border-color: white;
  color: white;
  background-color: #3a3a3a;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
