<template>
<div>
  <div id="background">
  <img src="../assets/einsames-haus.jpg" id="background-pic">
</div>
<div id="seperator"></div>
  <Booking :rooms="this.rooms" v-on:changed="this.$refs.overview.changeSelection()" ref="booking"></Booking>
  <Overview class="mt-5" :rooms="this.rooms" ref="overview"></Overview>
</div>
  

</template>

<script>
import Overview from './Overview.vue'
import Booking from './Booking.vue'
export default {
    props: ['rooms'],
    components: {
    Overview,
    Booking
  },
}
</script>

<style>
#background{
  position: absolute;
  top: 77px;
  width: 100%;
  z-index: -10;
  height: 17vw;
}

#background-pic{
  object-fit: cover;
  object-position: center;
  height: 100%;
  width: 100%;
}
#seperator{
  height: calc(17vw - 110px);
}
</style>