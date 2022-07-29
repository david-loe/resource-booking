<template>
  <div>
    <header class="mb-3 border-bottom bg-white bg-opacity-25">
      <div class="container">
        <div class="d-flex flex-row align-items-center">
          <div class="me-auto">
            <a href="/" class="nav-link link-dark d-flex align-items-center">
              <i :class="'fs-1 ' + iconClass"></i>
              <span class="fs-4 ms-2 d-none d-md-block">{{ $t('headlines.resourceBooking') }}</span>
            </a>
          </div>
          <div>
            <router-link v-if="useService && (isAdmin || isService)" to="/service" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-4 bi bi-bucket"></i>
              <span class="ms-1 d-none d-md-block">{{ $t('headlines.service') }}</span>
            </router-link>
          </div>
          <div>
            <router-link v-if="isAdmin" to="/settings" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-4 bi bi-gear"></i>
              <span class="ms-1 d-none d-md-block">{{ $t('headlines.settings') }}</span>
            </router-link>
          </div>
          <div>
            <div v-if="auth" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-4 bi bi-person-circle"></i>
              <span class="ms-1 d-none d-md-block">{{ name }}</span>
            </div>
            <router-link v-else to="/login" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-4 bi bi-box-arrow-in-right"></i>
              <span class="ms-1 d-none d-md-block">{{ $t('headlines.login') }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="position-absolute top-50 start-50 translate-middle">
      <div class="spinner-grow me-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="spinner-grow me-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="spinner-grow" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <router-view :class="isLoading ? 'd-none' : 'd-block'" :resources="this.resources" />

    <footer class="py-3 border-top">
      <div class="container">
        <div class="d-flex align-items-center">
          <a href="/" class="text-decoration-none link-dark lh-1">
            <i :class="'fs-3 ' + iconClass"></i>
          </a>
          <span class="ps-2 text-muted">© {{ new Date().getFullYear() }} Resource Booking</span>
        </div>
      </div>
    </footer>
  </div>
</template>



<script>
import axios from 'axios'
import jp from 'jsonpath'
export default {
  data() {
    return {
      auth: false,
      name: '',
      isAdmin: false,
      isService: false,
      resources: [],
      resourceNames: [],
      reload: null,
      isLoading: true,
      useSubresources: process.env.VUE_APP_USE_SUBRESOURCES.toLowerCase() === 'true',
      useService: process.env.VUE_APP_USE_SERVICE.toLowerCase() === 'true',
      iconClass: process.env.VUE_APP_ICON_CLASS,
    }
  },
  methods: {
    async getUser() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/user', {
          withCredentials: true,
        })
        this.name = res.data.name
        this.auth = res.status === 200
        this.isAdmin = res.data.isAdmin
        this.isService = res.data.isService
      } catch (error) {
        this.$router.push('login')
      }
    },
    async getResources() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/resource', {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.resources = res.data.resources
          this.resourceNames = jp.query(res.data.resources, '$..name')
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async getResourcesAvailability(startDate, endDate, bookingDurationInDays = undefined) {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/resource/search', {
          params: {
            startDate: startDate,
            endDate: endDate,
            bookingDurationInDays: bookingDurationInDays,
          },
          withCredentials: true,
        })
        if (res.status === 200) {
          return res.data
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
        return { available: [], unavailable: [] }
      }
    },
    getResourceByName(name) {
      for (const resource of this.resources) {
        if (resource.name === name) {
          return resource
        }
      }
      return null
    },
    async getUserandResources() {
      await this.getUser()
      await this.getResources()
      this.reload = setInterval(() => {
        this.getResources()
      }, 60 * 1000)
      this.isLoading = false
    },
    dateToHTMLInputString(date){
      const dateObject = new Date(date)
      const year = dateObject.getFullYear()
      const month = (dateObject.getMonth() + 1).toString().padStart(2, '0')
      const day = dateObject.getDate().toString().padStart(2, '0')
      const hour = dateObject.getHours().toString().padStart(2, '0')
      const minute = dateObject.getMinutes().toString().padStart(2, '0')
      const str = year +'-'+ month +'-'+ day +'T'+ hour +':'+ minute
      return str
    }
  },
  beforeMount() {
    document.title = this.$t('headlines.resourceBooking') + ' ' + this.$t('resource.emoji')
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  position: relative;
  min-height: 100%;
}
body {
  margin-bottom: 75px !important; /* Margin bottom by footer height */
}
footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px; /* Set the fixed height of the footer here */
  z-index: -999;
}
</style>
