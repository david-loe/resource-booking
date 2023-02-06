<template>
  <div class="container">
    <h1>Availability</h1>
    <div class="container">
      <div class="list-group" style="max-width: 500px">
        <div v-for="resource in resources.available" :key="resource.name" class="list-group-item list-group-item-success">
          <div class="row align-items-center">
            <div class="col-auto">
              <img :src="resource.img" width="45" height="45" class="rounded-circle flex-shrink-0 bg-white" />
            </div>
            <div class="col">
              <h5>{{ resource.name }}</h5>
              <span>{{$t('labels.available')}}</span>
            </div>
          </div>
        </div>
        <div v-for="entry in resources.partlyAvailable" :key="entry.resource.name" class="list-group-item list-group-item-warning">
          <div class="row align-items-center">
            <div class="col-auto">
              <img :src="entry.resource.img" width="45" height="45" class="rounded-circle flex-shrink-0 bg-white" />
            </div>
            <div class="col">
              <h5>{{ entry.resource.name }}</h5>
              <span>{{$t('labels.partlyAvailable')}}</span>
              <ul>
                <li v-for="booking in entry.conflictingBookings" :key="booking.uid" class="mb-1">
                  <span class="fw-bold me-1">{{ booking.summary }}</span> <small class="text-nowrap">{{ displayTime(booking) }}</small>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-for="entry in resources.unavailable" :key="entry.resource.name" class="list-group-item list-group-item-danger">
          <div class="row align-items-center">
            <div class="col-auto">
              <img :src="entry.resource.img" width="45" height="45" class="rounded-circle flex-shrink-0 bg-white" />
            </div>
            <div class="col">
              <h5>{{ entry.resource.name }}</h5>
              <span>{{$t('labels.unavailable')}}</span>
              <ul>
                <li v-for="booking in entry.conflictingBookings" :key="booking.uid" class="mb-1">
                  <span class="fw-bold me-1">{{ booking.summary }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'Availability',
  props: {
    token: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      resources: {
        available: [],
        partlyAvailable: [],
        unavailable: [],
      },
    }
  },
  methods: {
    displayTime(confictBooking) {
      var dateStringOptions = { hour: '2-digit', minute: '2-digit' }
      if (confictBooking.conflictCode === 2) {
        return (
          this.$t('labels.bookedUntil') +
          ': ' +
          new Date(confictBooking.endDate).toLocaleTimeString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
        )
      } else if (confictBooking.conflictCode === 4) {
        return (
          this.$t('labels.bookedFrom') +
          ': ' +
          new Date(confictBooking.startDate).toLocaleTimeString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
        )
      } else if (confictBooking.conflictCode === 3) {
        return (
          new Date(confictBooking.startDate).toLocaleTimeString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) +
          ' - ' +
          new Date(confictBooking.endDate).toLocaleTimeString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
        )
      }
    },
    async getAvailability() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/public/availability', {
          params: {
            token: this.token,
          },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.resources = res.data
        }
      } catch (error) {
        if (error.response.status === 401) {
          console.log(error.response.data)
        }
      }
    },
  },
  beforeMount() {
    this.$root.loadState = 'LOADED'
    this.getAvailability()
  },
}
</script>

<style>
</style>