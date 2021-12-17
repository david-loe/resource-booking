<template>
  <div class="container">
    <h1>Settings</h1>
    <Roomlist></Roomlist>
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