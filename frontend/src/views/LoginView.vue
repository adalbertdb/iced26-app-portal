<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 class="mb-6 text-2xl font-bold text-gray-900">ICED26 Admin Login</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Username</label>
          <input
            v-model="username"
            type="text"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Log In
        </button>
        <p v-if="error" class="text-center text-sm text-red-600">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

async function handleLogin() {
  error.value = '';
  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    if (!res.ok) {
      error.value = 'Invalid credentials';
      return;
    }

    const data = await res.json();
    auth.login(data.token);
    router.push('/upload');
  } catch {
    error.value = 'Login failed. Please try again.';
  }
}
</script>
