<template>
  <div class="container">
    <!-- Modal -->
    <div class="modal fade" id="calendarInfoModal" tabindex="-1" aria-labelledby="calendarInfoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="calendarInfoModalLabel">
              {{ selectedBooking.summary }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <template v-if="selectedBooking.startDate">
              <table class="table">
                <tbody>
                  <tr>
                    <th>{{ $t('labels.from') }}</th>
                    <td>{{ new Date(selectedBooking.startDate).toLocaleDateString(undefined, dateStringOptions) }}</td>
                  </tr>
                  <tr>
                    <th>{{ $t('labels.to') }}</th>
                    <td>{{ new Date(selectedBooking.endDate).toLocaleDateString(undefined, dateStringOptions) }}</td>
                  </tr>
                  <tr>
                    <th>{{ $t('labels.room') }}</th>
                    <td>{{ selectedBooking.location }}</td>
                  </tr>
                  <tr v-if="selectedBooking.subrooms !== null">
                    <th>{{ $t('labels.subrooms') }}</th>
                    <td>{{ selectedBooking.subrooms.join(', ') }}</td>
                  </tr>
                  <tr>
                    <th>{{ $t('labels.organizer') }}</th>
                    <td>{{ selectedBooking.organizer }}</td>
                  </tr>
                </tbody>
              </table>
              <template v-if="selectedBooking.organizer === this.$root.name || this.$root.isAdmin">
                <button
                  type="button"
                  class="btn btn-secondary me-2"
                  v-on:click="
                    infoModal.hide();
                    editModal.show()
                  ">
                  {{ $t('labels.edit') }}
                </button>
                <button type="button" class="btn btn-danger" v-on:click="deleteBooking(selectedBooking)">
                  {{ $t('labels.delete') }}
                </button>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="modal fade" id="eventEditModal" tabindex="-1" aria-labelledby="eventEditModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="eventEditModalLabel">
              {{ selectedBooking.summary }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <BookingForm
              :roomNames="this.roomNames"
              :event="this.selectedBooking"
              mode="edit"
              v-on:cancel="this.editModal.hide()"
              v-on:done="editBooking"
            ></BookingForm>
          </div>
        </div>
      </div>
    </div>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script>
import '@fullcalendar/core/vdom'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import iCalendarPlugin from '../libs/icalendar/main'
import allLocales from '@fullcalendar/core/locales-all'
import { Modal } from 'bootstrap'
import BookingForm from './Forms/BookingForm.vue'
import axios from 'axios'
export default {
  name: 'Calendar',
  props: {
    roomNames: {
      type: Array,
      required: true,
    },
    tab: {
      type: String,
      default: 'month',
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    FullCalendar,
    BookingForm,
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, listPlugin, interactionPlugin, iCalendarPlugin],
        editable: this.editable,
        selectable: true,
        selectConstraint: { start: new Date().setHours(0, 0, 0, 0) },
        selectMinDistance: 5,
        initialView: 'dayGridMonth',
        locales: allLocales,
        locale: process.env.VUE_APP_I18N_LOCALE,
        events: {},
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek',
        },
        displayEventTime: false,
        height: 'auto',
        aspectRatio: 2.1,
        eventDrop: this.eventCheck,
        eventClick: this.eventClick,
      },
      dateStringOptions: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      infoModal: undefined,
      editModal: undefined,
      modalIsInfo: true,
      selectedBooking: {},
    }
  },
  methods: {
    changedEvents() {
      this.calendarOptions.events = this.genEventSources(this.roomNames)
      this.$emit('changed-events')
    },
    async editBooking(newBooking) {
      try {
        const res = await axios.post(
          process.env.VUE_APP_BACKEND_URL + '/api/booking/change',
          {
            old: {
              uid: this.selectedBooking.uid,
              location: this.selectedBooking.location,
            },
            new: {
              location: newBooking.location,
              startDate: newBooking.startDate,
              endDate: newBooking.endDate,
              summary: newBooking.summary,
              roomService: newBooking.roomService,
              subrooms: newBooking.subrooms,
            },
          },
          { withCredentials: true },
        )
        if (res.status === 200) {
          this.editModal.hide()
          this.changedEvents()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
          alert(this.$t('alerts.bookingconflict'))
        }
      }
    },
    async getBooking(event) {
      if (!event.id) {
        return {}
      }
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/booking', {
          params: {
            uid: event.id,
            location: event.extendedProps.location,
          },
          withCredentials: true,
        })
        return res.data
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
    async eventClick(eventClickInfo) {
      this.selectedBooking = await this.getBooking(eventClickInfo.event)
      this.infoModal.show()
    },
    async deleteBooking(booking) {
      if (confirm('Do you realy wont to delete this booking?')) {
        try {
          const res = await axios.delete(process.env.VUE_APP_BACKEND_URL + '/api/booking', {
            params: {
              uid: booking.uid,
              location: booking.location,
            },
            withCredentials: true,
          })
          if (res.status === 200) {
            this.changedEvents()
          }
        } catch (error) {
          if (error.response.status === 401) {
            this.$router.push('login')
          } else {
            console.log(error.response.data)
          }
        }
      }
      this.infoModal.hide()
    },
    async eventCheck(eventDropInfo) {
      try {
        const res = await axios.post(
          process.env.VUE_APP_BACKEND_URL + '/api/booking/change',
          {
            old: {
              uid: eventDropInfo.event.id,
              location: eventDropInfo.event.extendedProps.location,
            },
            new: {
              location: eventDropInfo.event.extendedProps.location,
              startDate: eventDropInfo.event.start,
              endDate: eventDropInfo.event.end,
            },
          },
          { withCredentials: true },
        )
        if (res.status === 200) {
          this.changedEvents()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
        eventDropInfo.revert()
      }
    },
    genEventSources(roomNames) {
      if (roomNames.length === 0) {
        return ''
      }
      const urlParts = [process.env.VUE_APP_BACKEND_URL + '/ical', '?token=', process.env.VUE_APP_ICAL_TOKEN]
      for (const name of roomNames) {
        urlParts.push('&name=' + name)
      }
      return { url: urlParts.join(''), format: 'ics' }
    },
  },
  beforeMount() {
    this.calendarOptions.events = this.genEventSources(this.roomNames)
  },
  mounted() {
    this.infoModal = new Modal(document.getElementById('calendarInfoModal'), {})
    this.editModal = new Modal(document.getElementById('eventEditModal'), {})
  },
  watch: {
    roomNames: function () {
      this.calendarOptions.events = this.genEventSources(this.roomNames)
    },
  },
}
</script>

<style>
td.fc-daygrid-day.fc-day-past {
  background-color: var(--bs-gray-200);
}
td.fc-daygrid-day.fc-day-other {
  background-color: var(--bs-gray-400);
}
a.fc-daygrid-day-number {
  color: var(--bs-dark);
  text-decoration: none;
}
a.fc-col-header-cell-cushion {
  color: var(--bs-dark);
  text-decoration: none;
}
div.fc-event-title {
  font-weight: 500;
}
.fc .fc-daygrid-day.fc-day-today {
  background-color: rgba(var(--bs-primary-rgb), 0.25);
  font-weight: 600;
}
.fc-h-event {
  border: none;
  padding-left: 5px;
  padding-right: 5px;
}
</style>