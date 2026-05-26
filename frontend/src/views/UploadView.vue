<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">Upload Schedule</h1>
      <p class="mt-2 text-gray-600">Upload view coming in next slice...</p>
      <button
        @click="logout"
        class="mt-4 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

function logout() {
  auth.logout();
  router.push('/login');
}
</script>
