<template>
  <div class="container">
    <h2>{{ $t('headlines.overview') }}</h2>
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
    <Calendar :roomNames="this.roomNames" tab="month"></Calendar>
    </div>
    
    <div v-else class="alert alert-primary" role="alert">
      <h4 class="alert-heading">{{ $t('alerts.noRoom.heading') }}</h4>
      {{ $t('alerts.noRoom.text') }}
    </div>
    
  </div>
</template>

<script>
import Calendar from './Calendar.vue'
import jp from 'jsonpath';
export default {
  name: "Overview",
  components: {
    Calendar
  },
  props: ['rooms'],
  data() {
    return {
      selectedRooms: [],
      roomNames: [],
    };
  },
  methods: {
    changeSelection() {
      if(this.selectedRooms.length === 0){
        this.roomNames = jp.query(this.rooms, '$..name')
      } else {
        this.roomNames = this.selectedRooms;
      }
    },
  },
  beforeMount() {
    this.roomNames = jp.query(this.rooms, '$..name')
  },
  watch: {
    rooms: function(){
      this.roomNames = jp.query(this.rooms, '$..name')
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