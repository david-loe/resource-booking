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
}
</script>

<style>
</style>