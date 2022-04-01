import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Settings from '../components/Settings.vue'
import Home from '../components/Home.vue'
import Service from '../components/Service.vue'
import Availability from '../components/Availability.vue'
import axios from 'axios'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false}
  },
  {
    path: '/availablitity/:token?',
    name: 'Availability',
    component: Availability,
    props: true,
    meta: { requiresAuth: false}
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true}
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true}
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
    component: Service,
    meta: { requiresAuth: true}
  })
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

async function auth() {
  var auth = false;
  try {
    const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/user', {
      withCredentials: true,
    })
    auth = res.status === 200
  } catch (error) {
    console.log(error)
  }
  return auth
}

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !await auth()) {
    return {
      path: '/login',
    }
  }
})


export default router
