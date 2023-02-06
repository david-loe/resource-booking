<template>
<calendar :resourceNames="['service']" :editable="false"></calendar>
</template>

<script>
import Calendar from './Calendar.vue'
export default {
  name: 'Service',
  components: {
    Calendar,
  },
  methods: {},
  async beforeMount() {
    await this.$root.load()
  },
}
</script>

<style>
</style>