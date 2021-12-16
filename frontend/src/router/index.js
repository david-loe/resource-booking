import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Overview from '../components/Overview.vue'
import Booking from '../components/Booking.vue'
import Settings from '../components/Settings.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/overview',
    name: 'Overview',
    component: Overview
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/booking',
    name: 'Booking',
    component: Booking
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


export default router
