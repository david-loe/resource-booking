<template>
  <div class="container">
    <h1>{{ $t('headlines.settings') }}</h1>
    <div class="container">
      <h2>{{ $t('headlines.rooms') }}</h2>
      <Roomlist :rooms="this.rooms"></Roomlist>
    </div>
  </div>
</template>

<script>
import Roomlist from './Settings/Roomlist.vue'
export default {
  name: 'Settings',
  components: {
    Roomlist,
  },
  props: ['rooms'],
  data() {
    return {}
  },
  methods: {},
}
</script>

<style>
</style>