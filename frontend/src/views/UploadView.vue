<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-lg">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Upload Schedule</h1>
        <button
          @click="logout"
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        :class="[
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white',
        ]"
      >
        <p class="text-gray-600">
          Drag and drop a zip file here, or
          <label class="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
            browse
            <input type="file" accept=".zip" class="hidden" @change="handleFileSelect" />
          </label>
        </p>
        <p class="mt-2 text-xs text-gray-500">Expected: rooms.csv, sessions.csv, talks.csv, authors.csv, session_chairs.csv</p>
      </div>

      <div v-if="selectedFile" class="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
        <p class="text-sm text-gray-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
      </div>

      <button
        v-if="selectedFile && !isUploading"
        @click="upload"
        class="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Upload
      </button>

      <div v-if="isUploading" class="mt-4 text-center">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-sm text-gray-600">Processing...</p>
      </div>

      <div v-if="successMessage" class="mt-4 rounded-lg bg-green-50 p-4 text-green-800">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 p-4 text-red-800">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files?.length) {
    selectedFile.value = files[0];
    clearMessages();
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    selectedFile.value = input.files[0];
    clearMessages();
  }
}

function clearMessages() {
  successMessage.value = '';
  errorMessage.value = '';
}

async function upload() {
  if (!selectedFile.value) return;

  isUploading.value = true;
  clearMessages();

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const res = await fetch('/admin/upload', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${auth.token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      successMessage.value = data.message;
      selectedFile.value = null;
    } else {
      errorMessage.value = data.error || 'Upload failed';
    }
  } catch {
    errorMessage.value = 'Upload failed. Please try again.';
  } finally {
    isUploading.value = false;
  }
}

function logout() {
  auth.logout();
  router.push('/login');
}
</script>
