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
    <div class="container mb-3">
      <h2>{{ $t('headlines.categories') }}</h2>
      <CategoryList></CategoryList>
    </div>
    <div class="container mb-3">
      <h2>{{ $t('headlines.import') }}</h2>
      <ImportBookings></ImportBookings>
    </div>
    <div class="container">
      <h2>{{ $t('headlines.export') }}</h2>
      <ExportBookings></ExportBookings>
    </div>


  </div>
</template>

<script>
import ResourceList from './Settings/ResourceList.vue'
import UserList from './Settings/UserList.vue'
import CategoryList from './Settings/CategoryList.vue'
import ImportBookings from './Settings/ImportBookings.vue'
import ExportBookings from './Settings/ExportBookings.vue'
export default {
  name: 'Settings',
  components: {
    ResourceList,
    UserList,
    CategoryList,
    ImportBookings,
    ExportBookings
  },
  props: ['resources'],
  data() {
    return {}
  },
  methods: {},
  async beforeMount() {
    await this.$root.load()
  },
}
</script>

<style>
</style>