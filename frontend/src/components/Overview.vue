<template>
  <div class="container">
    <h1>{{ $t('headlines.overview') }}</h1>
    <div v-if="rooms.length > 0" >
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
            <div v-for="(room, index) of rooms" v-bind:key="room" class="ps-2">
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
                  class="rounded-circle flex-shrink-0 border me-1"
                />
                <span class="align-middle" :style="{color : room.color}">{{ room.name }}</span>
                <span class="position-absolute top-50 start-0 translate-middle p-2 border border-light rounded-circle" :style="{backgroundColor : room.color}"></span>
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
    <div v-else class="alert alert-primary" role="alert">
      <h4 class="alert-heading">{{ $t('alerts.noRoom.heading') }}</h4>
      {{ $t('alerts.noRoom.text') }}
    </div>
    
  </div>
</template>

<script>
import jp from 'jsonpath';
export default {
  name: "Overview",
  props: ['rooms'],
  data() {
    return {
      selectedRooms: [],
      calendarUrl: "",
    };
  },
  methods: {
    changeSelection() {
      this.calendarUrl = this.genCalendarUrl(this.selectedRooms);
    },
    genCalendarUrl(roomNames) {
      if(roomNames.length == 0){
        roomNames = jp.query(this.rooms, '$..name')
      }
      if(roomNames.length > 0){
        const calendarUrlParts = [
          process.env.VUE_APP_URL,
        ":3112/calendar.html",
        "&skin=dhtmlxscheduler_flat.css&target=_blank&loader=&tabs=month&tabs=week&tabs=agenda&getColorFromEvent=true",
        "&locationUrlPrefix=",
        encodeURIComponent(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_FRONTEND_PORT + process.env.VUE_APP_ROOM_DETAILS_PATH + '/'),
        "&language=",
        process.env.VUE_APP_I18N_LOCALE
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
      calendarUrlParts.splice(2, 0, ...urls);
      return calendarUrlParts.join("");
      }
      
    },
  },
  async beforeMount() {
    this.calendarUrl = this.genCalendarUrl([]);
  },
  watch: {
    rooms: function(){
      this.calendarUrl = this.genCalendarUrl([]);
    }
  }
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