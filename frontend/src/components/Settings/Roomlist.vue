<template>
  <div class="container">
    <div v-if="rooms.length > 0" class="list-group mb-3 border" style="max-height: 400px; overflow-y: scroll">
      <a
        v-for="room of rooms"
        v-bind:key="room.name"
        class="list-group-item list-group-item-action gap-3 py-3"
        aria-current="true"
      >
        <div class="row align-items-center">
          <img v-bind:src="room.img" width="32" height="32" class="rounded-circle flex-shrink-0 col-auto" />
        
          <div class="ps-0 col-5 me-auto">
            <h6 class="mb-0">{{ room.name }}</h6>
            <p class="mb-0 opacity-75 d-none d-md-block">{{ room.description }}</p>
          </div>
          <div class="col-auto d-none d-md-block">
            <span class="opacity-75 small">{{ room.size }}</span>
          </div>
          
          <div class="col-auto">
            <button type="button" class="btn btn-light" v-on:click="clickEdit(room)">
              <div class=" d-none d-md-block">
                <i class="bi bi-pencil"></i>
                <span class="ps-1">{{ $t('labels.edit') }}</span>
              </div>
              <i class="bi bi-pencil d-block d-md-none"></i>
              </button>
            <button type="button" class="btn btn-danger ms-2" v-on:click="deleteRoom(room.name)">
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
<RoomForm
      v-if="roomFormMode !== ''"
      :room=roomToEdit
      :mode="roomFormMode"
      v-on:add="addRoom"
      v-on:edit="editRoom"
      v-on:cancel="roomFormMode = ''"
      ref="roomform"
      id="roomform"
      style="max-width: 650px"
    ></RoomForm>
    
    <button v-if="roomFormMode === ''" type="button" class="btn btn-secondary" v-on:click="roomFormMode = 'add'; roomToEdit = undefined">
      {{ $t('labels.addRoom') }}
    </button>
  </div>
</template>

<script>
import axios from 'axios'
import RoomForm from '../Forms/RoomForm.vue'
export default {
  components: { RoomForm },
  name: 'Roomlist',
  props: ['rooms'],
  data() {
    return {
      roomFormMode: "",
      roomToEdit: undefined
    }
  },
  methods: {
    clickEdit(room){
      this.roomFormMode = 'edit'
      this.roomToEdit = room
    },
    async editRoom(room){
      try {
        const res = await axios.post(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + '/api/admin/room/change', room, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getRooms()
          this.roomFormMode = ''
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async deleteRoom(name) {
      try {
        const res = await axios.delete(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + '/api/admin/room', {
          params: { name: name },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getRooms()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },

    async addRoom(room) {
      try {
        const res = await axios.post(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + '/api/admin/room', room, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.$root.getRooms()
          this.$refs.roomform.clear()
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