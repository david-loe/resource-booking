<template>
<calendar :roomNames="['roomservice']"></calendar>
</template>

<script>
import Calendar from './Calendar.vue'
export default {
  name: 'RoomService',
  components: {
    Calendar,
  },
}
</script>

<style>
</style>