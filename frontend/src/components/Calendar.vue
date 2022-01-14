<template>
  <div class="container">
    <iframe
      id="open-web-calendar"
      v-bind:src="this.calendarUrl"
      sandbox="allow-scripts allow-same-origin allow-popups"
      allowTransparency="true"
      height="650px"
      width="100%"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: "Calendar",
  props: ["roomNames", "tab"],
  data() {
    return {
      calendarUrl: "",
    };
  },
  methods: {
    genCalendarUrl(roomNames) {
      if(roomNames.length > 0){
        const calendarUrlParts = [
          process.env.VUE_APP_URL,
        ":3112/calendar.html",
        "&skin=dhtmlxscheduler_flat.css&target=_blank&loader=&tabs=month&tabs=week&tabs=agenda&getColorFromEvent=true",
        "&tab=",
        this.tab,
        "&locationUrlPrefix=",
        process.env.VUE_APP_USE_LINK_LOCATION.toLowerCase() === 'true' ? encodeURIComponent(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_FRONTEND_PORT + process.env.VUE_APP_ROOM_DETAILS_PATH + '/') : 'false',
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
  beforeMount() {
    this.calendarUrl = this.genCalendarUrl(this.roomNames);
    
  },
  watch: {
    roomNames: function(){
      this.calendarUrl = this.genCalendarUrl(this.roomNames);
    }
  }
};
</script>

<style scoped>
.dhx_cal_data.dhx_resize_denied.dhx_move_denied{
  height: auto !important;
  min-height: 400px !important;
}
</style>