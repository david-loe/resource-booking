<template>
  <div class="container">
    <h1>{{ $t('headlines.settings') }}</h1>
    <div class="container mb-3">
      <h2>{{ $t('headlines.resources') }}</h2>
      <ResourceList :resources="this.resources"></ResourceList>
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
import ResourceList from './Settings/ResourceList.vue'
import UserList from './Settings/UserList.vue'
import ImportBookings from './Settings/ImportBookings.vue'
export default {
  name: 'Settings',
  components: {
    ResourceList,
    UserList,
    ImportBookings
  },
  props: ['resources'],
  data() {
    return {}
  },
  methods: {},
  beforeMount() {
    if (this.$root.isLoading) {
      this.$root.getUserandResources()
    }
  },
}
</script>

<style>
</style>