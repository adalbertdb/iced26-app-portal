import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const isAuthenticated = computed(() => !!token.value);

  async function login(username, password) {
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    token.value = data.token;
    localStorage.setItem('token', data.token);
  }

  function logout() {
    token.value = '';
    localStorage.removeItem('token');
  }

  return {
    token,
    isAuthenticated,
    login,
    logout,
  };
});
