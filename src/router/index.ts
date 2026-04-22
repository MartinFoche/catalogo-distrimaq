import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Esta función es para esperar a que Firebase nos diga si hay alguien logueado
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(auth, (user) => {
      removeListener();
      resolve(user);
    }, reject);
  });
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      component: () => import('../views/Login.vue') 
    },
    { 
      path: '/', 
      component: () => import('../components/AdminPanel.vue')
    },
    { 
      path: '/admin', 
      component: () => import('../components/AdminPanel.vue'),
      meta: { requiresAuth: true } 
    }
  ]
});

// EL GUARDIÁN
router.beforeEach(async (to, _, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next(); 
    } else {
      next('/login'); 
    }
  } else {
    next(); 
  }
});

export default router;