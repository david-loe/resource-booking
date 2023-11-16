<template>
  <div class="container">
    <ul class="list-group mb-3" style="max-height: 400px; overflow-y: scroll">
      <li v-for="category of $root.categories" :key="category._id" class="list-group-item">
        <div class="row align-items-center">
          <div class="col-auto me-auto">
            <span class="fs-6">
              {{ category.name }}
            </span>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-danger ms-2" v-on:click="deleteCategory(category)">
              <div class="d-none d-md-block">
                <i class="bi bi-trash"></i>
                <span class="ps-1">{{ $t('labels.delete') }}</span>
              </div>
              <i class="bi bi-trash d-block d-md-none"></i>
            </button>
          </div>
        </div>
      </li>
    </ul>
    <CategoryForm
      v-if="categoryFormMode !== ''"
      :category="categoryToEdit"
      :mode="categoryFormMode"
      v-on:add="addCategory"
      v-on:cancel="categoryFormMode = ''"
      ref="categoryform"
      id="categoryform"
      style="max-width: 650px"
    ></CategoryForm>
    <!-- prettier-ignore-attribute -->
    <button
      v-if="categoryFormMode === ''"
      type="button"
      class="btn btn-secondary"
      v-on:click="categoryFormMode = 'add'; categoryToEdit = undefined"
    >
      {{ $t('labels.addCategory') }}
    </button>
  </div>
</template>

<script>
import CategoryForm from '../Forms/CategoryForm.vue'
import axios from 'axios'
export default {
  name: 'CategoryList',
  components: { CategoryForm },
  data() {
    return {
      categoryToEdit: undefined,
      categoryFormMode: '',
    }
  },
  methods: {
    async addCategory(category) {
      try {
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/admin/category', category, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getCategories()
          this.$refs.categoryform.clear()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async deleteCategory(category) {
      try {
        const res = await axios.delete(process.env.VUE_APP_BACKEND_URL + '/api/admin/category', {
          params: { id: category._id },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getCategories()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
  },
}
</script>

<style></style>
