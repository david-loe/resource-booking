<template>
  <div>
    <header class="p-3 mb-3 border-bottom">
      <div class="container">
        <div
          class="
            d-flex
            flex-wrap
            align-items-center
            justify-content-center justify-content-lg-start
          "
        >
          <a
            href="/"
            class="
              d-flex
              align-items-center
              mb-2 mb-lg-0
              text-dark text-decoration-none
            "
          >
            <img
              class="px-2"
              src="./assets/home-solid.svg"
              alt=""
              width="40"
              height="32"
            />
          </a>

          <ul
            class="
              nav
              col-12 col-lg-auto
              me-lg-auto
              mb-2
              justify-content-center
              mb-md-0
            "
          >
            <li>
              <router-link to="/overview" class="nav-link px-2 link-dark"
                >Overview</router-link
              >
            </li>
            <li>
              <router-link to="/booking" class="nav-link px-2 link-dark"
                >Booking</router-link
              >
            </li>
            <li>
              <router-link to="/settings" class="nav-link px-2 link-dark"
                >Settings</router-link
              >
            </li>
          </ul>

          <div class="dropdown text-end">
            <div v-if="auth">
              <img
                src="./assets/user-circle-regular.svg"
                alt="user"
                width="32"
                height="32"
                class="rounded-circle"
              />
              <span class="px-2 align-middle">{{ name }}</span>
            </div>

            <router-link
              v-if="!auth"
              to="/login"
              class="nav-link px-2 link-dark"
              >Login</router-link
            >
          </div>
        </div>
      </div>
    </header>
    <router-view />

    <footer class="justify-content-between align-items-center py-3 my-4 border-top">
      <div class="container">
        <div class="col-md-4 d-flex align-items-center">
          <a
            href="/"
            class="mb-3 me-2 mb-md-0 text-muted text-decoration-none lh-1">
            <img
              class="bi"
              src="./assets/home-solid.svg"
              alt=""
              width="30"
              height="24"
            />
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
    };
  },
  methods: {
    async authen() {
      try {
        const res = await axios.get(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + "/api/user", {
          withCredentials: true,
        });
        this.name = res.data.name;
        this.auth = res.status === 200;
      } catch (error) {
        this.$router.push("login");
      }
    },
  },
  beforeMount() {
    this.authen();
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
  margin-bottom: 40px; /* Margin bottom by footer height */
}
footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px; /* Set the fixed height of the footer here */
  z-index: -999;
}
</style>
