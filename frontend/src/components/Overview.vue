<template>
  <div class="container">
    <h1>Overview</h1>
    <div class="container my-3">
      <div class="row justify-content-center">
        <div class="col-9">
          <div
            class="
              list-group list-group-checkable
              d-flex
              flex-wrap flex-row
              bg-light
              p-2
            "
          >
            <div v-for="(room, index) of rooms" v-bind:key="room">
              <input
                class="list-group-item-check"
                type="checkbox"
                name="filter"
                v-bind:id="index"
                v-bind:value="room.name"
                v-model="selectedRooms"
                @change="changeSelection"
              />
              <label class="list-group-item py-1 small" v-bind:for="index">
                <img
                  v-bind:src="room.img"
                  width="24"
                  height="24"
                  class="rounded-circle flex-shrink-0 mr-2"
                />
                <span class="align-middle">{{ room.name }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <iframe
        id="open-web-calendar"
        v-bind:src="this.calendarUrl"
        sandbox="allow-scripts allow-same-origin allow-popups"
        allowTransparency="true"
        scrolling="no"
        frameborder="0"
        height="600px"
        width="100%"
      ></iframe>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "Overview",
  data() {
    return {
      rooms: [],
      selectedRooms: [],
      calendarUrl: "",
    };
  },
  methods: {
    async getRooms() {
      await axios
        .get(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + "/api/room", { withCredentials: true })
        .then((res) => {
          if (res.status === 200) {
            this.rooms = res.data.rooms;
            const roomNames = [];
            for (var i = 0; i < res.data.rooms.length;i++) {
              roomNames.push(res.data.rooms[i].name);
            }
            this.calendarUrl = this.genCalendarUrl(roomNames);
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
    changeSelection() {
      this.calendarUrl = this.genCalendarUrl(this.selectedRooms);
    },
    genCalendarUrl(roomNames) {
      if(roomNames.length == 0){
        for (var i = 0; i < this.rooms.length;i++) {
              roomNames.push(this.rooms[i].name);
            }
      }
      const calendarUrlParts = [
        "http://localhost:3112/calendar.html",
        "&skin=dhtmlxscheduler_flat.css&target=_blank&loader=&tabs=month&tabs=week&tabs=agenda&getColorFromEvent=true",
        "&locationUrlPrefix=",
        encodeURIComponent(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_FRONTEND_PORT + process.env.VUE_APP_ROOM_DETAILS_PATH + '/')
      ]
      const urlParts = ["http://backend:8000/ical/", "?token=", process.env.VUE_APP_ICAL_TOKEN]
      const urls = []
      for (var j = 0; j < roomNames.length; j++){
        var tempParts = [...urlParts]
        tempParts.splice(1,0, roomNames[j])
        if(j == 0){
          urls.push(['?url=', encodeURIComponent(tempParts.join(''))].join(''))
        }else{
          urls.push(['&url=', encodeURIComponent(tempParts.join(''))].join(''))
        }
        
      }
      calendarUrlParts.splice(1, 0, ...urls);
      console.log(calendarUrlParts.join(""))
      return calendarUrlParts.join("");
    },
  },
  async beforeMount() {
    await this.getRooms();
  },
};
</script>

<style scoped>
.list-group-checkable {
  display: grid;
  gap: 0.5rem;
  border: 0;
}
.list-group-checkable .list-group-item {
  cursor: pointer;
  border-radius: 0.5rem;
  opacity: 0.5;
}
.list-group-item-check {
  position: absolute;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
}
.list-group-item-check:hover + .list-group-item {
  background-color: var(--bs-secondary);
  color: var(--bs-white);
}
.list-group-item-check:checked + .list-group-item {
  opacity: 1;
}
.list-group-item-check[disabled] + .list-group-item,
.list-group-item-check:disabled + .list-group-item {
  pointer-events: none;
  filter: none;
  opacity: 0.6;
}
</style>