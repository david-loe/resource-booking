<template>
  <div>
    <div id="background">
      <img src="../assets/banner.jpg" id="background-pic" />
    </div>
    <div id="separator"></div>
    <Booking :resources="this.resources" v-on:changed="this.$refs.overview.changeSelection()" ref="booking"></Booking>
    <Overview class="mt-5" :resources="this.resources" ref="overview" v-on:changed-bookings="this.$refs.booking.clear()" v-on:selected-dates-in-calendar="this.selectedDatesInCalendar"></Overview>
  </div>
</template>

<script>
import Overview from './Overview.vue'
import Booking from './Booking.vue'
export default {
  props: ['resources'],
  components: {
    Overview,
    Booking,
  },
  methods: {
    selectedDatesInCalendar(startDate, endDate){
      this.$refs.booking.bookingData.startDate = this.$root.dateToHTMLInputString(startDate)
      this.$refs.booking.bookingData.endDate = this.$root.dateToHTMLInputString(endDate)
      this.$refs.booking.search(startDate, endDate)
    },
  },
  beforeMount() {
    if (this.$root.isLoading) {
      this.$root.getUserandResources()
    }
  },
}
</script>

<style>
#background {
  position: absolute;
  margin-top: -1rem;
  width: 100%;
  z-index: -10;
  height: calc(4rem + 12vw);
}

#background-pic {
  object-fit: cover;
  object-position: center;
  height: 100%;
  width: 100%;
}
#separator {
  height: 10.5vw;
}
</style>