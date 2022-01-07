<template>
  <div class="container">
    <h1>Settings</h1>
    <div class="container">
      <h2>Rooms</h2>
      <Roomlist></Roomlist>
    </div>
    
  </div>
</template>

<script>
import Roomlist from "./Settings/Roomlist.vue"
export default {
  name: "Settings",
  components: {
    Roomlist
  },
  data() {
    return {
    };
  },
  methods: {

  },
};
</script>

<style>
</style>