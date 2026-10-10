import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/wheel',
    name: 'Wheel',
    component: () => import('../views/WheelPage.vue'),
  },
  {
    path: '/recommend',
    name: 'Recommend',
    component: () => import('../views/RecommendPage.vue'),
  },
  {
    path: '/dish/:dishId',
    name: 'DishDetail',
    component: () => import('../views/DishDetailPage.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
  },
  {
    path: '/cafeterias',
    name: 'Cafeterias',
    component: () => import('../views/CafeteriasPage.vue'),
  },
  {
    path: '/cafeterias/:cafeteriaId/windows',
    name: 'CafeteriaWindows',
    component: () => import('../views/CafeteriaWindowsPage.vue'),
  },
  {
    path: '/windows/:windowId/dishes',
    name: 'WindowDishes',
    component: () => import('../views/WindowDishesPage.vue'),
  },
  {
    path: '/must-eat',
    name: 'MustEat',
    component: () => import('../views/MustEatPage.vue'),
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/FeedbackPage.vue'),
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('../views/OnboardingPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
