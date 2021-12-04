<template>
  <div>
    <h1>Login</h1>
    <div class="field">
      <label for="email">E-Mail</label><br>
      <input v-model="email" id="email">
    </div>
    <div class="field">
      <label for="password">Passowort</label><br>
      <input v-model="password" type="password" id="password">
    </div>
    <div>
      <button v-on:click="login()">Login</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: "Login",
  props: {
    
  },
  data() {
    return {
      password: "",
      email: ""
    }
  },
  methods:{
    async login() {
      axios.post('')
      console.log(this.email)
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
label{
  color: gray;
}
</style>
