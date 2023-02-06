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
                  <tr v-if="$root.categories.length > 0">
                    <th>{{ $t('labels.category') }}</th>
                    <td>{{ selectedBooking.category }}</td>
                  </tr>
                  <tr v-if="$root.useUtilization">
                    <th>{{ $t('labels.utilization') }}</th>
                    <td>{{ selectedBooking.utilization }}</td>
                  </tr>
                  <tr>
                    <th>{{ $t('labels.resource') }}</th>
                    <td>{{ selectedBooking.resource }}</td>
                  </tr>
                  <tr v-if="selectedBooking.subresources !== null">
                    <th>{{ $t('labels.subresources') }}</th>
                    <td>{{ selectedBooking.subresources.join(', ') }}</td>
                  </tr>
                  <tr>
                    <th>{{ $t('labels.organizer') }}</th>
                    <td>{{ selectedBooking.organizer }}</td>
                  </tr>
                </tbody>
              </table>
              <template v-if="selectedBooking.organizer.indexOf(this.$root.name) === 0 || this.$root.isAdmin">
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
    <div class="modal fade" id="bookingEditModal" tabindex="-1" aria-labelledby="bookingEditModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="bookingEditModalLabel">
              {{ selectedBooking.summary }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <BookingForm
              :booking="this.selectedBooking"
              mode="edit"
              v-on:cancel="this.editModal.hide()"
              v-on:done="editBooking"
            ></BookingForm>
          </div>
        </div>
      </div>
    </div>
    <FullCalendar ref="fullCalendar" :options="calendarOptions" />
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
    resourceNames: {
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
        fixedWeekCount: false,
        showNonCurrentDates: false,
        initialView: this.$root.settings.initialCalendarView,
        locales: allLocales,
        locale: process.env.VUE_APP_I18N_LOCALE,
        events: {},
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'next3weeks,dayGridMonth,listWeek',
        },
        views: {
          next3weeks: {
            type: 'dayGrid',
            duration: { weeks: 3 },
            buttonText: this.$t('comp.calendar.view.threeweeks')
          }
        },
        displayEventTime: false,
        height: 'auto',
        aspectRatio: 2.1,
        eventDrop: this.bookingCheck,
        eventClick: this.eventClick,
        select: this.select,
        datesSet: this.changedViewDates,
        viewClassNames: this.changedView
      },
      dateStringOptions: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      infoModal: undefined,
      editModal: undefined,
      modalIsInfo: true,
      selectedBooking: {},
    }
  },
  methods: {
    changedBookings() {
      this.calendarOptions.events = this.genEventSources(this.resourceNames)
      this.$emit('changed-bookings')
    },
    async editBooking(newBooking) {
      try {
        const res = await axios.post(
          process.env.VUE_APP_BACKEND_URL + '/api/booking/change',
          {
            old: {
              uid: this.selectedBooking.uid,
              resource: this.selectedBooking.resource,
            },
            new: {
              resource: newBooking.resource,
              startDate: newBooking.startDate,
              endDate: newBooking.endDate,
              summary: newBooking.summary,
              service: newBooking.service,
              subresources: newBooking.subresources,
            },
          },
          { withCredentials: true },
        )
        if (res.status === 200) {
          this.editModal.hide()
          this.changedBookings()
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
    async getBooking(booking) {
      if (!booking.id) {
        return {}
      }
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/booking', {
          params: {
            uid: booking.id,
            resource: booking.extendedProps.location,
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
    changedViewDates(dateInfo){
      this.$emit('changed-view-dates', dateInfo.start, dateInfo.end)
    },
    changedView(arg){
      if(this.$root.settings.initialCalendarView !== arg.view.type){
        this.$root.settings.initialCalendarView = arg.view.type
        this.$root.pushSettings()
      }
    },
    select(selectionInfo){
      if(selectionInfo.end - selectionInfo.start > 1000 * 60 * 60 * 24){
        this.$emit('selected-dates-in-calendar', new Date(selectionInfo.start.setHours(16,0,0,0)), new Date(new Date(selectionInfo.end.getTime() - 24 * 60 * 60 * 1000).setHours(12,0,0,0)))
      }else{
        this.$emit('selected-dates-in-calendar', new Date(selectionInfo.start.setHours(12,0,0,0)), new Date(new Date(selectionInfo.end.getTime() - 24 * 60 * 60 * 1000).setHours(16,0,0,0)))
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
              resource: booking.resource,
            },
            withCredentials: true,
          })
          if (res.status === 200) {
            this.changedBookings()
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
    async bookingCheck(eventDropInfo) {
      try {
        const res = await axios.post(
          process.env.VUE_APP_BACKEND_URL + '/api/booking/change',
          {
            old: {
              uid: eventDropInfo.event.id,
              resource: eventDropInfo.event.extendedProps.location,
            },
            new: {
              resource: eventDropInfo.event.extendedProps.location,
              startDate: eventDropInfo.event.start,
              endDate: eventDropInfo.event.end,
            },
          },
          { withCredentials: true },
        )
        if (res.status === 200) {
          this.changedBookings()
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
    genEventSources(resourceNames) {
      if (resourceNames.length === 0) {
        return ''
      }
      const urlParts = [process.env.VUE_APP_BACKEND_URL + '/public/ical', '?token=', process.env.VUE_APP_ACCESS_TOKEN]
      for (const name of resourceNames) {
        urlParts.push('&name=' + name)
      }
      return { url: urlParts.join(''), format: 'ics' }
    },
  },
  async beforeMount() {
    await this.$root.load()
    this.calendarOptions.events = this.genEventSources(this.resourceNames)
  },
  mounted() {
    this.infoModal = new Modal(document.getElementById('calendarInfoModal'), {})
    this.editModal = new Modal(document.getElementById('bookingEditModal'), {})
  },
  watch: {
    resourceNames: function () {
      this.calendarOptions.events = this.genEventSources(this.resourceNames)
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