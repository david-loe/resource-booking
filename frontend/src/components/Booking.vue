<template>
  <div class="container">
    <h1>{{ $t('headlines.booking') }}</h1>
    <div v-if="rooms.length > 0">
      <div class="container mb-3">
      <form @submit.prevent="search()">
        <div class="row justify-content-center">
          <div class="col-auto">
            <div class="row bg-light" style="max-width: 550px">
              <div class="col-auto p-2">
                <label for="startDateInput" class="form-label">{{ $t('labels.from') }}</label>
                <input id="startDateInput" class="form-control" type="date" v-model="bookingData.startDate" required />
                <input id="startTime" type="time" class="form-control" v-model="bookingData.startTime" />
              </div>
              <div class="col-auto p-2">
                <label for="endDateInput" class="form-label">{{ $t('labels.to') }}</label>
                <input id="endDateInput" class="form-control" type="date" v-model="bookingData.endDate" required
                  v-bind:min="bookingData.startDate" />
                <input id="endTime" type="time" class="form-control" v-model="bookingData.endTime" />
              </div>
              <div class="col-auto p-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary">{{ $t('labels.search') }}</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
    <div v-if="searchresult.available.length > 0 || searchresult.unavailable.length > 0" class="container mb-3">
      <div class="list-group">
        <label class="list-group-item d-flex gap-3" v-for="room of searchresult.available" v-bind:key="room">
          <input class="form-check-input flex-shrink-0 my-auto" type="checkbox" v-bind:value="room.name"
            style="font-size: 1.375em" v-model="selectedRooms" />
          <img v-bind:src="room.img" width="45" height="45" class="rounded-circle flex-shrink-0" />
          <span class="pt-1 form-checked-content">
            <h6>{{ room.name }}</h6>
            <small class="d-block text-muted">
              {{ room.description }} - {{ $t('labels.size') }}: {{ room.size }}
            </small>
          </span>
        </label>
        <label class="list-group-item d-flex gap-3 bg-light" v-if="searchresult.unavailable.length > 0">
          <span class="pt-1">
            <span class="w-100" v-if="searchresult.unavailable.length > 0 && searchresult.available.length === 0">{{ $t('comp.booking.allRoomsBooked') }}</span>
            <span class="w-100" v-else>{{ $t('comp.booking.roomsBooked', searchresult.unavailable.length) }}</span>
          </span>
        </label>
      </div>
    </div>
    <div v-if="selectedRooms.length > 0" class="container">
      <form @submit.prevent="book()">
        <div class="row justify-content-center">
          <div class="col-auto">
            <div class="row bg-light" style="max-width: 450px">
              <div class="col p-2">
                <label for="summary" class="form-label"> {{ $t('labels.summary') }} </label>
                <input type="text" class="form-control" id="summary" :placeholder="$t('comp.booking.exampleSummary')"
                  v-model="bookingData.summary" required />
              </div>
              <div class="col-auto p-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary">{{ $t('labels.book') }}</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
    </div>
    <div v-else class="alert alert-primary" role="alert">
      <h4 class="alert-heading">{{ $t('alerts.noRoom.heading') }}</h4>
      {{ $t('alerts.noRoom.text') }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "Booking",
  props: ['rooms'],
  data() {
    return {
      bookingData: {
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        startTime: "16:00",
        endTime: "12:00",
        summary: "",
      },
      searchresult: { available: [], unavailable: [] },
      selectedRooms: [],
    };
  },
  methods: {
    getDateTime(date,time) {
      return new Date(date + " " + time)
    },
    search() {
      axios
        .get(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + "/api/room/search", {
          params: {
            startDate: this.getDateTime(this.bookingData.startDate, this.bookingData.startTime),
            endDate: this.getDateTime(this.bookingData.endDate, this.bookingData.endTime),
          },
          withCredentials: true,
        })
        .then((res) => {
          if (res.status === 200) {
            this.searchresult.available = res.data.available;
            this.searchresult.unavailable = res.data.unavailable;
            this.selectedRooms = [];
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
    book() {
      const data = {
        rooms: this.selectedRooms,
        summary: this.bookingData.summary,
        startDate: this.getDateTime(this.bookingData.startDate, this.bookingData.startTime),
        endDate: this.getDateTime(this.bookingData.endDate, this.bookingData.endTime),
      };
      axios
        .post(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + "/api/booking", data, {
          withCredentials: true,
        })
        .then((res) => {
          if(res.status == 200){
            alert('success')
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
  },
};
</script>

<style scoped>
.form-check-input:checked + .form-checked-content {
  opacity: 0.5;
}

.form-check-input-placeholder {
  pointer-events: none;
  border-style: dashed;
}
[contenteditable]:focus {
  outline: 0;
}

.list-group-checkable {
  display: grid;
  gap: 0.5rem;
  border: 0;
}
.list-group-checkable .list-group-item {
  cursor: pointer;
  border-radius: 0.5rem;
}
.list-group-item-check {
  position: absolute;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
}
.list-group-item-check:hover + .list-group-item {
  background-color: var(--bs-light);
}
.list-group-item-check:checked + .list-group-item {
  color: #fff;
  background-color: var(--bs-blue);
}
.list-group-item-check[disabled] + .list-group-item,
.list-group-item-check:disabled + .list-group-item {
  pointer-events: none;
  filter: none;
  opacity: 0.5;
}
</style>