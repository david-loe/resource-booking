<template>
  <div class="container">
    <div v-if="resources.length > 0" class="list-group mb-3 border" style="max-height: 400px; overflow-y: scroll">
      <a
        v-for="resource of resources"
        v-bind:key="resource.name"
        class="list-group-item list-group-item-action gap-3 py-3"
        aria-current="true"
      >
        <div class="row align-items-center">
          <img v-bind:src="resource.img" width="32" height="32" class="rounded-circle flex-shrink-0 col-auto" />
        
          <div class="ps-0 col-5 me-auto">
            <h6 class="mb-0">{{ resource.name }}</h6>
            <p class="mb-0 opacity-75 d-none d-md-block">{{ resource.description }}</p>
          </div>
          <div class="col-auto d-none d-md-block">
            <span class="opacity-75 small">{{ resource.size }}</span>
          </div>
          
          <div class="col-auto">
            <button type="button" class="btn btn-light" v-on:click="clickEdit(resource)">
              <div class=" d-none d-md-block">
                <i class="bi bi-pencil"></i>
                <span class="ps-1">{{ $t('labels.edit') }}</span>
              </div>
              <i class="bi bi-pencil d-block d-md-none"></i>
              </button>
            <button type="button" class="btn btn-danger ms-2" v-on:click="deleteResource(resource.name)">
              <div class=" d-none d-md-block">
                <i class="bi bi-trash"></i>
                <span class="ps-1">{{$t('labels.delete')}}</span>
              </div>
              <i class="bi bi-trash d-block d-md-none"></i>
            </button>
          </div>
        </div>
        
        
      </a>
    </div>
<ResourceForm
      v-if="resourceFormMode !== ''"
      :resource=resourceToEdit
      :mode="resourceFormMode"
      v-on:add="addResource"
      v-on:edit="editResource"
      v-on:cancel="resourceFormMode = ''"
      ref="resourceform"
      id="resourceform"
      style="max-width: 650px"
    ></ResourceForm>
    
    <button v-if="resourceFormMode === ''" type="button" class="btn btn-secondary" v-on:click="resourceFormMode = 'add'; resourceToEdit = undefined">
      {{ $t('labels.addResource') }}
    </button>
  </div>
</template>

<script>
import axios from 'axios'
import ResourceForm from '../Forms/ResourceForm.vue'
export default {
  components: { ResourceForm },
  name: 'ResourceList',
  props: ['resources'],
  data() {
    return {
      resourceFormMode: "",
      resourceToEdit: undefined
    }
  },
  methods: {
    clickEdit(resource){
      this.resourceFormMode = 'edit'
      this.resourceToEdit = resource
    },
    async editResource(resource){
      try {
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/admin/resource/change', resource, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getResources()
          this.resourceFormMode = ''
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async deleteResource(name) {
      try {
        const res = await axios.delete(process.env.VUE_APP_BACKEND_URL + '/api/admin/resource', {
          params: { name: name },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getResources()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },

    async addResource(resource) {
      try {
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/admin/resource', resource, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getResources()
          this.$refs.resourceform.clear()
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
  beforeMount() {},
}
</script>

<style>
</style>