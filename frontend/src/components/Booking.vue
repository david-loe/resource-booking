<template>
  <div class="container">
    <h1>Booking</h1>
    <div class="container mb-3">
      <form @submit.prevent="search()">
        <div class="row justify-content-center">
          <div class="col-auto">
            <div class="row bg-light" style="max-width: 550px">
              <div class="col-auto p-2">
                <label for="startDateInput" class="form-label">From</label>
                <input
                  id="startDateInput"
                  class="form-control"
                  type="date"
                  v-model="bookingData.startDate"
                  required
                />
                <input
                  id="startTime"
                  type="time"
                  class="form-control"
                  v-model="bookingData.startTime"
                />
              </div>
              <div class="col-auto p-2">
                <label for="endDateInput" class="form-label">To</label>
                <input
                  id="endDateInput"
                  class="form-control"
                  type="date"
                  v-model="bookingData.endDate"
                  required
                  v-bind:min="bookingData.startDate"
                />
                <input
                  id="endTime"
                  type="time"
                  class="form-control"
                  v-model="bookingData.endTime"
                />
              </div>
              <div class="col-auto p-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary">Search</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
    <div
      v-if="rooms.available.length > 0 || rooms.unavailable.length > 0"
      class="container mb-3"
    >
      <div class="list-group">
        <label
          class="list-group-item d-flex gap-3"
          v-for="room of rooms.available"
          v-bind:key="room"
        >
          <input
            class="form-check-input flex-shrink-0"
            type="checkbox"
            v-bind:value="room.name"
            style="font-size: 1.375em"
            v-model="selectedRooms"
          />
          <img
            v-bind:src="room.img"
            width="45"
            height="45"
            class="rounded-circle flex-shrink-0"
          />
          <span class="pt-1 form-checked-content">
            <h6>{{ room.name }}</h6>
            <small class="d-block text-muted">
              {{ room.description }} - Size: {{ room.size }}
            </small>
          </span>
        </label>
        <label
          class="list-group-item d-flex gap-3 bg-light"
          v-if="rooms.unavailable.length > 0"
        >
          <span class="pt-1">
            <span class="w-100" v-if="rooms.unavailable.length > 0 && rooms.available.length === 0">All rooms are booked in this time frame.</span>
            <span class="w-100" v-else-if="rooms.unavailable.length === 1">One room is already booked.</span>
            <span class="w-100" v-else-if="rooms.unavailable.length > 1">{{ rooms.unavailable.length }} rooms are already booked.</span>
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
                <label for="summary" class="form-label"> Summary </label>
                <input
                  type="text"
                  class="form-control"
                  id="summary"
                  placeholder="e.g. John Doe for an interview"
                  v-model="bookingData.summary"
                  required
                />
              </div>
              <div class="col-auto p-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary">Book</button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "Booking",
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
      rooms: { available: [], unavailable: [] },
      selectedRooms: [],
    };
  },
  methods: {
    getDateTime(date,time) {
      return new Date(date + " " + time)
    },
    search() {
      axios
        .get("http://localhost:8000/api/room/search", {
          params: {
            startDate: this.getDateTime(this.bookingData.startDate, this.bookingData.startTime),
            endDate: this.getDateTime(this.bookingData.endDate, this.bookingData.endTime),
          },
          withCredentials: true,
        })
        .then((res) => {
          if (res.status === 200) {
            console.log(res);
            this.rooms.available = res.data.available;
            this.rooms.unavailable = res.data.unavailable;
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
      console.log(data);
      axios
        .post("http://localhost:8000/api/booking", data, {
          withCredentials: true,
        })
        .then((res) => {
          console.log(res);
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

<style>
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