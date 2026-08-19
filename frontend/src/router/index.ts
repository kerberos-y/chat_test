import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Index from '../pages/Index.vue';
import Session from '../pages/Session.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: Index },
  { path: '/session/:id', component: Session },
];

export default function () {
  return createRouter({
    history: createWebHistory(),
    routes,
  });
}