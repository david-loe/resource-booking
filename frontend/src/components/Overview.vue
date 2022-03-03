<template>
  <div class="container">
    <h2>{{ $t('headlines.overview') }}</h2>
    <div v-if="rooms.length > 0">
      <div class="container my-3">
        <div class="row justify-content-center">
          <div class="col-9">
            <div class="bg-light">
              <div class="px-2 pt-2 pb-1">
                <div class="d-inline-block">Filter:</div>
                <div class="form-check form-check-inline float-end">
                  <label for="onlyShowAvailableRooms" class="form-check-label text-nowrap">
                    {{ $t('labels.onlyShowAvailableRooms') }}</label
                  >
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="onlyShowAvailableRooms"
                    role="switch"
                    v-model="this.onlyShowAvailableRooms"
                  />
                </div>
              </div>
              <div class="list-group list-group-checkable d-flex flex-wrap flex-row justify-content-center bg-light px-2 pb-2">
                <div v-for="(room, index) of overviewRooms" v-bind:key="room.name" class="ps-2">
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
                    <img v-bind:src="room.img" width="24" height="24" class="rounded-circle flex-shrink-0 border me-1" />
                    <span class="align-middle" :style="{ color: room.color }">{{ room.name }}</span>
                    <span
                      class="position-absolute top-50 start-0 translate-middle p-2 border border-light rounded-circle"
                      :style="{ backgroundColor: room.color }"
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Calendar
        :roomNames="this.roomNames"
        tab="month"
        v-on:changed-events="this.$emit('changed-events')"
        v-on:changed-view-dates="this.setAvailableRooms"
      ></Calendar>
    </div>

    <div v-else class="alert alert-primary" role="alert">
      <h4 class="alert-heading">{{ $t('alerts.noRoom.heading') }}</h4>
      {{ $t('alerts.noRoom.text') }}
    </div>
  </div>
</template>

<script>
import Calendar from './Calendar.vue'
import jp from 'jsonpath'
export default {
  name: 'Overview',
  components: {
    Calendar,
  },
  props: {
    rooms: {
      type: Array,
      default: function () {
        return []
      },
    },
  },
  data() {
    return {
      overviewRooms: [],
      selectedRooms: [],
      roomNames: [],
      onlyShowAvailableRooms: true,
      availableRooms: [],
      calendarViewStartDate: new Date(),
      calendarViewEndDate: new Date(),
    }
  },
  methods: {
    async setAvailableRooms(startDate, endDate, force = false) {
      if (this.onlyShowAvailableRooms && (startDate.getTime() !== this.calendarViewStartDate.getTime() || endDate.getTime() !== this.calendarViewEndDate.getTime() || force)) {
        const result = await this.$root.getRoomsAvailability(startDate, endDate, 1)
        this.availableRooms = jp.query(result.available, '$..room')
        const availableRoomNames = jp.query(this.availableRooms, '$..name')
        const newSelection = []
        for(const room of this.selectedRooms){
          if(availableRoomNames.indexOf(room) !== -1){
            newSelection.push(room)
          }
        }
        this.selectedRooms = newSelection
        this.calendarViewStartDate = startDate
        this.calendarViewEndDate = endDate
      }
    },
    changeSelection() {
      if (this.selectedRooms.length === 0) {
        this.roomNames = jp.query(this.overviewRooms, '$..name')
      } else {
        this.roomNames = this.selectedRooms
      }
    },
  },
  beforeMount() {
    this.roomNames = this.$root.roomNames
  },
  watch: {
    rooms: function () {
      this.overviewRooms = this.rooms
    },
    '$root.roomNames': function () {
      this.roomNames = this.$root.roomNames
    },
    availableRooms: function () {
      if (this.onlyShowAvailableRooms) {
        this.overviewRooms = this.availableRooms
        this.changeSelection()
      }
    },
    onlyShowAvailableRooms: function () {
      if (this.onlyShowAvailableRooms) {
        this.setAvailableRooms(this.calendarViewStartDate, this.calendarViewEndDate, true)
        this.overviewRooms = this.availableRooms
      } else {
        this.overviewRooms = this.$root.rooms
      }
      this.changeSelection()
    },
  },
}
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