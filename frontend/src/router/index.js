import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Settings from '../components/Settings.vue'
import Home from '../components/Home.vue'
import Service from '../components/Service.vue'

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

if (process.env.VUE_APP_USE_SERVICE.toLowerCase() === 'true') {
  routes.push({
    path: '/service',
    name: 'Service',
    component: Service
  })
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


export default router
