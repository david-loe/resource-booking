<template>
  <div class="container">
    <ul class="list-group mb-3" style="max-height: 400px; overflow-y: scroll">
      <li v-for="user of users" :key="user._id" class="list-group-item">
        <div class="row align-items-center">
          <div class="col-auto me-auto">
            <span class="fs-6">
              {{ user.mail }}
              <i v-if="user.isAdmin" class="ms-4 bi bi-person-fill"></i>
              <i v-if="user.isService" class="ms-4 bi bi-bucket-fill"></i>
            </span>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-light" v-on:click="clickEdit(user)">
              <div class="d-none d-md-block">
                <i class="bi bi-pencil"></i>
                <span class="ps-1">{{ $t('labels.edit') }}</span>
              </div>
              <i class="bi bi-pencil d-block d-md-none"></i>
            </button>
            <button type="button" class="btn btn-danger ms-2" v-on:click="deleteUser(user)">
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
    <UserForm
      v-if="userFormMode !== ''"
      :user="userToEdit"
      :mode="userFormMode"
      v-on:add="addUser"
      v-on:edit="editUser"
      v-on:cancel="userFormMode = ''"
      ref="userform"
      id="userform"
      style="max-width: 650px"
    ></UserForm>
    <!-- prettier-ignore-attribute -->
    <button v-if="userFormMode === ''" type="button" class="btn btn-secondary" v-on:click="userFormMode = 'add'; userToEdit = undefined">
      {{ $t('labels.addUser') }}
    </button>
  </div>
</template>

<script>
import UserForm from '../Forms/UserForm.vue'
import axios from 'axios'
export default {
  name: 'UserList',
  components: { UserForm },
  data() {
    return {
      users: [],
      userToEdit: undefined,
      userFormMode: '',
    }
  },
  methods: {
    clickEdit(user) {
      this.userFormMode = 'edit'
      this.userToEdit = user
    },
    async getUsers() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/admin/user', {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.users = res.data.users
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async addUser(user) {
      try {
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/admin/user', user, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.getUsers()
          this.$refs.userform.clear()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async deleteUser(user) {
      try {
        const res = await axios.delete(process.env.VUE_APP_BACKEND_URL + '/api/admin/user', {
          params: { id: user._id },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.getUsers()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async editUser(user) {
      try {
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/admin/user/change', user, { withCredentials: true })
        if (res.status === 200) {
          this.getUsers()
          this.userFormMode = ''
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
  beforeMount() {
    this.getUsers()
  },
}
</script>

<style></style>
