import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Settings from '../components/Settings.vue'
import Home from '../components/Home.vue'
import RoomService from '../components/RoomService.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

if (process.env.VUE_APP_USE_ROOMSERVICE.toLowerCase() === 'true') {
  routes.push({
    path: '/room-service',
    name: 'RoomService',
    component: RoomService
  })
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


export default router
