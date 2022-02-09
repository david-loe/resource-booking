<template>
  <div id="booking">
    <!-- Modal -->
    <div class="modal fade" id="bookingInfoModal" tabindex="-1" aria-labelledby="bookingInfoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 v-if="booked.startDate" class="modal-title" id="bookingInfoModalLabel">
              {{ $t('comp.booking.bookingSuccess.heading') }}
            </h5>
            <h5 v-else class="modal-title" id="bookingInfoModalLabel">
              {{ $t('comp.booking.bookingFailure.heading') }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div v-if="booked.startDate" class="modal-body">
            {{
              $t('comp.booking.bookingSuccess.text', {
                rooms: booked.roomNames,
                startDate: new Date(booked.startDate).toLocaleString(),
                endDate: new Date(booked.endDate).toLocaleString(),
              })
            }}
          </div>
          <div v-else class="modal-body">
            {{ $t('comp.booking.bookingFailure.text') }}
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="mx-auto px-3 py-2 bg-light bg-opacity-75 rounded-3" style="max-width: 80%">
        <h2>{{ $t('headlines.booking') }}</h2>
        <div v-if="rooms.length > 0">
          <div class="container mb-3">
            <form @submit.prevent="search()">
              <div class="row justify-content-center">
                <div class="col-auto">
                  <div class="row bg-dark text-white rounded-2" style="max-width: 600px">
                    <div class="col-auto p-2">
                      <label for="startDateInput" class="form-label">{{ $t('labels.from') }}</label>
                      <input id="startDateInput" class="form-control" type="datetime-local" v-model="bookingData.startDate" required />
                    </div>
                    <div class="col-auto p-2">
                      <label for="endDateInput" class="form-label">{{ $t('labels.to') }}</label>
                      <input
                        id="endDateInput"
                        class="form-control"
                        type="datetime-local"
                        v-model="bookingData.endDate"
                        required
                        v-bind:min="bookingData.startDate"
                      />
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
              <label class="list-group-item d-flex gap-3 align-items-center" v-for="room of searchresult.available" v-bind:key="room.name">
                <input
                  class="form-check-input flex-shrink-0 my-auto"
                  type="checkbox"
                  v-bind:value="room.name"
                  style="font-size: 1.375em"
                  v-model="selectedRooms"
                />
                <img v-bind:src="room.img" width="45" height="45" class="rounded-circle flex-shrink-0" />
                <span class="pt-1 form-checked-content">
                  <h6>{{ room.name }}</h6>
                  <small class="d-none d-md-block text-muted"> {{ room.description }} - {{ $t('labels.size') }}: {{ room.size }} </small>
                </span>
              </label>
              <label class="list-group-item d-flex gap-3 bg-light" v-if="searchresult.unavailable.length > 0">
                <span class="pt-1">
                  <span class="w-100" v-if="searchresult.unavailable.length > 0 && searchresult.available.length === 0">{{
                    $t('comp.booking.allRoomsBooked')
                  }}</span>
                  <span class="w-100" v-else>{{ $t('comp.booking.roomsBooked', searchresult.unavailable.length) }}</span>
                </span>
              </label>
            </div>
          </div>
          <div v-if="selectedRooms.length > 0" class="container">
            <form @submit.prevent="book()">
              <div class="row justify-content-center">
                <div class="col-auto">
                  <div class="row bg-dark text-white rounded-2" style="max-width: 350px">
                    <div class="col p-2">
                      <label for="summary" class="form-label"> {{ $t('labels.summary') }} </label>
                      <input
                        type="text"
                        class="form-control"
                        id="summary"
                        :placeholder="$t('comp.booking.exampleSummary')"
                        v-model="bookingData.summary"
                        required
                      />
                    </div>
                    <div class="w-100"></div>
                    <div class="col p-2">
                      <div class="form-check">
                        <label for="roomService" class="form-check-label text-nowrap"> {{ $t('labels.roomService') }}</label>
                        <input class="form-check-input" type="checkbox" id="roomService" role="switch" v-model="bookingData.roomService" />
                      </div>
                    </div>
                    <div class="col-auto p-2">
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
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Modal } from 'bootstrap'
import jp from 'jsonpath'
export default {
  name: 'Booking',
  props: ['rooms'],
  data() {
    return {
      bookingData: {
        startDate: new Date().toISOString().split('T')[0] + 'T16:00',
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T12:00',
        summary: '',
        roomService: false,
      },
      searchresult: { available: [], unavailable: [] },
      selectedRooms: [],
      modal: undefined,
      booked: {
        startDate: undefined,
        endDate: undefined,
        roomNames: [],
      },
    }
  },
  methods: {
    clear(){
      this.searchresult = { available: [], unavailable: [] }
      this.selectedRooms = []
    },
    async search() {
      try {
        const res = await axios.get(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + '/api/room/search', {
          params: {
            startDate: new Date(this.bookingData.startDate),
            endDate: new Date(this.bookingData.endDate),
          },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.searchresult.available = res.data.available
          this.searchresult.unavailable = res.data.unavailable
          this.selectedRooms = []
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async book() {
      try {
        const data = {
          rooms: this.selectedRooms,
          summary: this.bookingData.summary,
          startDate: new Date(this.bookingData.startDate),
          endDate: new Date(this.bookingData.endDate),
          roomService: this.bookingData.roomService,
        }
        const res = await axios.post(process.env.VUE_APP_URL + ':' + process.env.VUE_APP_BACKEND_PORT + '/api/booking', data, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.clear()
          this.booked.startDate = res.data.startDate
          this.booked.endDate = res.data.endDate
          this.booked.roomNames = jp.query(res.data.rooms, '$..name')
          this.$emit('changed')
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
        this.booked = { startDate: undefined, endDate: undefined, roomNames: [] }
      }
      this.modal.show()
    },
  },
  mounted() {
    this.modal = new Modal(document.getElementById('bookingInfoModal'), {})
  },
}
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