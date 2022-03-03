<template>
  <div class="container">
    <h1>{{ $t('headlines.settings') }}</h1>
    <div class="container mb-3">
      <h2>{{ $t('headlines.rooms') }}</h2>
      <Roomlist :rooms="this.rooms"></Roomlist>
    </div>
    <div class="container mb-3">
      <h2>{{ $t('headlines.user') }}</h2>
      <UserList></UserList>
    </div>
    <div class="container">
      <h2>{{ $t('headlines.import') }}</h2>
      <ImportBookings></ImportBookings>
    </div>


  </div>
</template>

<script>
import Roomlist from './Settings/Roomlist.vue'
import UserList from './Settings/UserList.vue'
import ImportBookings from './Settings/ImportBookings.vue'
export default {
  name: 'Settings',
  components: {
    Roomlist,
    UserList,
    ImportBookings
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