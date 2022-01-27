<template>
    <div class="container">
        <div v-if="rooms.length  > 0" class="list-group mb-3 border" style="max-height: 400px ; overflow-y:scroll;">
            <a v-for="room of rooms" v-bind:key="room" href="#"
                class="list-group-item list-group-item-action d-flex gap-3 py-3" aria-current="true">
                <img v-bind:src="room.img" width="32" height="32" class="rounded-circle flex-shrink-0" />
                <div class="d-flex gap-2 w-100 justify-content-between">
                    <div>
                        <h6 class="mb-0">{{ room.name }}</h6>
                        <p class="mb-0 opacity-75">{{ room.description }}</p>
                    </div>
                    <div>
                        <span class="opacity-75 px-3 small">{{ $t('labels.size') }}: {{ room.size }}</span>
                        <button type="button" class="btn btn-danger" v-on:click="deleteRoom(room.name)">
                            Delete
                        </button>
                    </div>
                </div>
            </a>
        </div>
        <RoomForm v-if="addRoomForm" :mode="'add'" v-on:done="addRoom" v-on:cancel="addRoomForm = false" ref="roomForm"></RoomForm>
        <button v-if="!addRoomForm" type="button" class="btn btn-secondary" v-on:click="addRoomForm = true">
            {{ $t('labels.addRoom') }}
        </button>
    </div>
</template>

<script>
import axios from "axios";
import RoomForm from "../Forms/RoomForm.vue"
export default {
  components: {RoomForm},
  name: "Roomlist",
  props: ['rooms'],
  data() {
    return {
      addRoomForm: false,
    };
  },
  methods: {
    async deleteRoom(name) {
      try {
        const res = await axios.delete(
          process.env.VUE_APP_URL + ":" + process.env.VUE_APP_BACKEND_PORT + "/api/room",
          {
            params: { name: name },
            withCredentials: true,
          }
        )
        if (res.status === 200) {
          this.$root.getRooms();
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push("login");
        } else {
          console.log(error.response.data);
        }
      }
    },
    
    async addRoom(room) {
      try {
        const res = await axios.post(process.env.VUE_APP_URL + ":" + process.env.VUE_APP_BACKEND_PORT + "/api/room",
          room,
          { withCredentials: true }
        )
        if (res.status === 200) {
          this.$root.getRooms();
          this.$refs.roomForm.clear()
        }
      } catch (error) {
        if (error.response.status === 401) {
            this.$router.push("login");
          } else {
            console.log(error.response.data);
          }
      }
    },

    
  },
  beforeMount() {

  },
};
</script>

<style>
</style>