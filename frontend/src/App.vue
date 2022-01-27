<template>
  <div>
    <header class="mb-3 border-bottom bg-white bg-opacity-25">
        <div class="container">
            <div class="d-flex flex-row align-items-center">
                <div class="me-auto">
                    <a href="/" class="nav-link link-dark d-flex align-items-center">
                      <i class="fs-1 bi bi-house"></i>
                      <span class="fs-4 ms-2">{{ $t("headlines.roombooking")}}</span> 
                    </a>
                </div>
                <div class="ps-2">
                    <router-link to="/settings" class="nav-link link-dark d-flex align-items-center">
                      <i class="fs-4 bi bi-gear"></i>
                      <span class="ms-1 d-none d-md-block">{{ $t("headlines.settings")}}</span>
                    </router-link>
                </div>
                <div class="ps-2">
                    <div v-if="auth" class="d-flex align-items-center">
                        <i class="fs-4 bi bi-person-circle"></i>
                        <span class="ms-1 d-none d-md-block">{{ name }}</span>
                    </div>
                    <router-link v-else to="/login" class="nav-link link-dark d-flex align-items-center">
                    <i class="fs-4 bi bi-box-arrow-in-right"></i>
                    <span class="ms-1 d-none d-md-block">{{ $t("headlines.login") }}</span>
                    </router-link>
                </div>
            </div>
        </div>
    </header>
    <router-view :rooms="this.rooms" />

    <footer class="py-3 border-top">
        <div class="container">
            <div class="col-md-4 d-flex align-items-center">
                <a href="/" class="mb-3 me-2 mb-md-0 text-decoration-none link-dark lh-1">
                    <i class="fs-3 bi bi-house"></i>
                </a>
                <span class="text-muted">© {{ new Date().getFullYear() }} Room Booking</span>
            </div>
        </div>
    </footer>
</div>
</template>



<script>
import axios from "axios";
export default {
  data() {
    return {
      auth: false,
      name: "",
      rooms: []
    };
  },
  methods: {
    async authAndGetRoom() {
      try {
        const res = await axios.get(
          process.env.VUE_APP_URL +
            ":" +
            process.env.VUE_APP_BACKEND_PORT +
            "/api/user",
          {
            withCredentials: true,
          }
        );
        this.name = res.data.name;
        this.auth = res.status === 200;
        this.getRooms()
      } catch (error) {
        this.$router.push("login");
      }
    },
    async getRooms() {
      try {
        const res = await axios.get(
          process.env.VUE_APP_URL +
            ":" +
            process.env.VUE_APP_BACKEND_PORT +
            "/api/room",
          { withCredentials: true }
        )
        if (res.status === 200) {
            this.rooms = res.data.rooms;
          }
      } catch (error) {
        if (error.response.status === 401) {
            this.$router.push("login");
          } else {
            console.log(error.response.data);
          }
      }
    }
  },
  beforeMount() {
    this.authAndGetRoom();
  },
};
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
header{
  height: 77px;
}
</style>
