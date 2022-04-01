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
    if (this.$root.isLoading) {
      await this.$root.getUser()
      this.$root.isLoading = false
    }
  },
}
</script>

<style>
</style>