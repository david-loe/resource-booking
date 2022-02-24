<template>
  <div>
    <header class="mb-3 border-bottom bg-white bg-opacity-25">
      <div class="container">
        <div class="d-flex flex-row align-items-center">
          <div class="me-auto">
            <a href="/" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-1 bi bi-house"></i>
              <span class="fs-4 ms-2 d-none d-md-block">{{ $t('headlines.roomBooking') }}</span>
            </a>
          </div>
          <div>
            <router-link v-if="isAdmin || isRoomService" to="/room-service" class="nav-link link-dark d-flex align-items-center">
              <i class="fs-4 bi bi-bucket"></i>
              <span class="ms-1 d-none d-md-block">{{ $t('headlines.roomService') }}</span>
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
    <router-view :rooms="this.rooms" />

    <footer class="py-3 border-top">
      <div class="container">
        <div class="d-flex align-items-center">
          <a href="/" class="text-decoration-none link-dark lh-1">
            <i class="fs-3 bi bi-house"></i>
          </a>
          <span class="ps-2 text-muted">© {{ new Date().getFullYear() }} Room Booking</span>
        </div>
      </div>
    </footer>
  </div>
</template>



<script>
import axios from 'axios'
export default {
  data() {
    return {
      auth: false,
      name: '',
      isAdmin: false,
      isRoomService: false,
      rooms: [],
    }
  },
  methods: {
    async authAndGetRoom() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/user', {
          withCredentials: true,
        })
        this.name = res.data.name
        this.auth = res.status === 200
        this.isAdmin = res.data.isAdmin
        this.isRoomService = res.data.isRoomService
        this.getRooms()
      } catch (error) {
        this.$router.push('login')
      }
    },
    async getRooms() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/room', {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.rooms = res.data.rooms
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    getRoomByName(name) {
      for (const room of this.rooms) {
        if (room.name === name) {
          return room
        }
      }
      return null
    },
  },
  beforeMount() {
    this.authAndGetRoom()
    document.title = this.$t('headlines.roomBooking') + ' 🏠'
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
