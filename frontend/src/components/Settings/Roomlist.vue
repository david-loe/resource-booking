<template>
  <div class="container">
      <div class="list-group mb-3 border" style="max-height: 400px ; overflow-y:scroll;">
      <a
        v-for="room of rooms"
        v-bind:key="room"
        href="#"
        class="list-group-item list-group-item-action d-flex gap-3 py-3"
        aria-current="true"
      >
        <img
          v-bind:src="room.img"
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
              v-on:click="deleteRoom(room.name)"
            >
              Delete
            </button>
          </div>
        </div>
      </a>
    </div>
    
    <form
      v-if="addRoomForm"
      class="container"
      @submit.prevent="addRoom()"
      style="max-width: 650px"
    >
      <div class="mb-3">
        <div class="row">
          <div class="col-sm">
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
          <div class="col-sm">
            <div class="row">
              <div class="col">
                <label for="addRoomFormSize" class="form-label"> Size </label>
                <input
                  type="number"
                  class="form-control"
                  id="addRoomFormSize"
                  v-model="newRoom.size"
                />
              </div>
              <div class="col-auto">
                <label for="addRoomFormColor" class="form-label"> Color </label>
                <input
                  type="color"
                  class="form-control"
                  id="addRoomFormColor"
                  v-model="newRoom.color"
                  @change="
                    this.newRoom.color = correctColorLuminance(
                      this.newRoom.color
                    )
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-3">
        <div class="row">
          <div class="col-sm">
            <label for="addRoomFormDes" class="form-label"> Description </label>
            <textarea
              class="form-control"
              id="addRoomFormDes"
              rows="3"
              v-model="newRoom.description"
            ></textarea>
          </div>
          <div class="col-sm">
            <label for="addRoomFormImg" class="form-label">
              Image (max 1MB)</label
            >
            <input
              class="form-control"
              type="file"
              id="addRoomFormImg"
              @change="changeFile"
              accept="image/*"
            />
          </div>
        </div>
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
//import Login from '../Login.vue';
export default {
  components: {},
  name: "Roomlist",
  data() {
    return {
      rooms: [],
      addRoomForm: false,
      newRoom: {
        name: "",
        size: null,
        description: "",
        img: undefined,
        color: undefined,
      },
    };
  },
  methods: {
    getRooms() {
      axios
        .get(
          process.env.VUE_APP_URL +
            ":" +
            process.env.VUE_APP_BACKEND_PORT +
            "/api/room",
          { withCredentials: true }
        )
        .then((res) => {
          if (res.status === 200) {
            this.rooms = res.data.rooms;
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            this.$router.push("login");
          } else {
            console.log(err);
          }
        });
    },
    deleteRoom(name) {
      axios
        .delete(
          process.env.VUE_APP_URL +
            ":" +
            process.env.VUE_APP_BACKEND_PORT +
            "/api/room",
          {
            params: { name: name },
            withCredentials: true,
          }
        )
        .then((res) => {
          if (res.status === 200) {
            this.getRooms();
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            this.$router.push("login");
          } else {
            console.log(err);
          }
        });
    },
    addRoom() {
      axios
        .post(
          process.env.VUE_APP_URL +
            ":" +
            process.env.VUE_APP_BACKEND_PORT +
            "/api/room",
          this.newRoom,
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          if (res.status === 200) {
            this.getRooms();
            this.newRoom = {
              name: "",
              size: null,
              description: "",
              img: undefined,
              color: this.generateRandomColorHex(),
            };
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            this.$router.push("login");
          } else {
            console.log(err);
          }
        });
      this.correctColorLuminance(this.generateRandomColorHex());
    },
    changeFile(event) {
      const reader = new FileReader();
      if (
        event.target.files.length === 1 &&
        event.target.files[0].size < 1000000
      ) {
        reader.readAsDataURL(event.target.files[0]);
        reader.onload = () => {
          this.newRoom.img = reader.result;
        };
      } else {
        this.newRoom.img = undefined;
      }
    },
    correctColorLuminance(hex) {
      if (hex) {
        // HEX to RGB
        var rgb = this.hexToRgb(hex);
        var luminance = this.calcRelativeLumiance(rgb);
        // setting 0.4 as border
        while (luminance > 0.4) {
          rgb = [
            rgb[0] >= 2 ? rgb[0] - 2 : 0,
            rgb[1] >= 7 ? rgb[1] - 7 : 0,
            rgb[2] >= 1 ? rgb[2] - 1 : 0,
          ];
          luminance = this.calcRelativeLumiance(rgb);
        }
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
      }
    },
    generateRandomColorHex() {
      const rgb = [255, 255, 255].map(function (v) {
        return Math.round(Math.random() * v);
      });
      return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    },
    calcRelativeLumiance(rgb) {
      // CALC relative Lumiance https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
      const copy = rgb.map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return copy[0] * 0.2126 + copy[1] * 0.7152 + copy[2] * 0.0722;
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    hexToRgb(hex) {
      const result = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(
        hex
      );
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ];
    },
  },
  beforeMount() {
    this.getRooms();
    this.newRoom.color = this.correctColorLuminance(
      this.generateRandomColorHex()
    );
  },
};
</script>

<style>
</style>