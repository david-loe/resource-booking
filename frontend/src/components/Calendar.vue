<template>
  <div class="container">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script>
import "@fullcalendar/core/vdom"; // solves problem with Vite
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import iCalendarPlugin from "../libs/icalendar/main";
import allLocales from '@fullcalendar/core/locales-all';
export default {
  name: "Calendar",
  props: ["roomNames", "tab"],
  components: {
    FullCalendar,
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, iCalendarPlugin],
        initialView: 'dayGridMonth',
        locales: allLocales,
        dateClick: this.handleDateClick,
        events: {},
        displayEventTime: false,

      },
    };
  },
  methods: {
    genEventSources(roomNames) {
      if(roomNames.length === 0){
        return ''
      }
      const urlParts = [
        process.env.VUE_APP_URL +
          ":" +
          process.env.VUE_APP_BACKEND_PORT +
          "/ical",
        "?token=",
        process.env.VUE_APP_ICAL_TOKEN,
      ];
      for (const name of roomNames) {
        urlParts.push('&name=' + name)
      }
      return {url: urlParts.join(''), format:'ics'};
    },
  },
  beforeMount() {
    this.calendarOptions.events = this.genEventSources(this.roomNames)
  },
  watch: {
    roomNames: function () {
      this.calendarOptions.events = this.genEventSources(this.roomNames);
      console.log(this.genEventSources(this.roomNames));
    },
  },
};
</script>

<style scoped>
</style>