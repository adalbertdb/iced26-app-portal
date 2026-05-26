import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import UploadView from '../views/UploadView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/upload', component: UploadView, meta: { requiresAuth: true } },
    { path: '/', redirect: '/upload' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return '/upload';
  }
});

export default router;
