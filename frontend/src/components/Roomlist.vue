<template>
  <div class="container">
    <h2>Rooms</h2>
    <div class="list-group mb-3">
      <a
        v-for="room of rooms"
        v-bind:key="room"
        href="#"
        class="list-group-item list-group-item-action d-flex gap-3 py-3"
        aria-current="true"
      >
        <img
          src="../assets/home-solid.svg"
          alt="twbs"
          width="32"
          height="32"
          class="rounded-circle flex-shrink-0"
        />
        <div class="d-flex gap-2 w-100 justify-content-between">
          <div>
            <h6 class="mb-0">{{ room.name }}</h6>
            <p class="mb-0 opacity-75">{{ room.description }}</p>
          </div>
          <div>
            <span class="opacity-75 px-3 small">Size: {{ room.size }}</span>
            <button
              type="button"
              class="btn btn-danger"
              v-on:click="deleteRoom(room.name)">
              Delete
            </button>
          </div>
        </div>
      </a>
    </div>
    <form v-if="addRoomForm" class="container" @submit.prevent="addRoom()">
      <div class="mb-3">
        <label for="addRoomFormName" class="form-label"> Name </label>
        <input
          type="text"
          class="form-control"
          id="addRoomFormName"
          placeholder="e.g. Room 2"
          v-model="newRoom.name"
          required
          pattern='^[^<>\/\\\*\|":\?]*$'
        />
      </div>
      <div class="mb-3">
        <label for="addRoomFormSize" class="form-label"> Size </label>
        <input
          type="number"
          class="form-control"
          id="addRoomFormSize"
          v-model="newRoom.size"
        />
      </div>
      <div class="mb-3">
        <label for="addRoomFormDes" class="form-label"> Description </label>
        <textarea
          class="form-control"
          id="addRoomFormDes"
          rows="3"
          v-model="newRoom.description"
        ></textarea>
      </div>
      <div class="mb-3">
        <p>
          <button type="submit" class="btn btn-primary">Add Room</button>
          <button
            type="button"
            class="btn btn-light"
            v-on:click="addRoomForm = false"
          >
            Cancel
          </button>
        </p>
      </div>
    </form>
    <button
      v-else
      type="button"
      class="btn btn-secondary"
      v-on:click="addRoomForm = true"
    >
      Add Room
    </button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "Roomlist",
  data() {
    return {
      rooms: [],
      addRoomForm: false,
      newRoom: { name: "", size: null, description: "" },
    };
  },
  methods: {
    getRooms() {
      axios
        .get("http://localhost:8000/api/room", { withCredentials: true })
        .then((res) => {
          if (res.status === 200) {
            this.rooms = res.data.rooms;
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },
    deleteRoom(name) {
      axios
        .delete("http://localhost:8000/api/room", {
          params: { name: name },
          withCredentials: true,
        })
        .then((res) => {
          if (res.status === 200) {
            this.getRooms();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },
    addRoom() {
      axios
        .post("http://localhost:8000/api/room", this.newRoom, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.status === 200) {
            this.getRooms();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
  beforeMount() {
    this.getRooms();
  },
};
</script>

<style>
</style>