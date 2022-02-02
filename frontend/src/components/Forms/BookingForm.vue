<template>
  <form class="container" @submit.prevent="send">
    <div class="row mb-3">
      <div class="col-auto">
        <label for="startDateInput" class="form-label">{{ $t('labels.from') }}</label>
        <input id="startDateInput" class="form-control" type="datetime-local" v-model="formEvent.startDate" required />
      </div>
      <div class="col-auto">
        <label for="endDateInput" class="form-label">{{ $t('labels.to') }}</label>
        <input
          id="endDateInput"
          class="form-control"
          type="datetime-local"
          v-model="formEvent.endDate"
          required
          v-bind:min="formEvent.startDate"
        />
      </div>
    </div>

    <div class="mb-3">
      <label for="summary" class="form-label"> {{ $t('labels.summary') }} </label>
      <input
        type="text"
        class="form-control"
        id="summary"
        :placeholder="$t('comp.booking.exampleSummary')"
        v-model="formEvent.summary"
        required
      />
    </div>
    <div class="mb-3">
      <label for="location" class="form-label"> {{ $t('labels.room') }} </label>
      <select class="form-select" aria-label="Default select example" id="location" v-model="formEvent.location">
        <option v-for="name in this.roomNames" :value="name" :key="name">{{ name }}</option>
      </select>
    </div>
    <div class="mb-3">
      <div class="form-check">
        <label for="roomService" class="form-check-label text-nowrap"> {{ $t('labels.roomService') }}</label>
        <input class="form-check-input" type="checkbox" id="roomService" role="switch" v-model="formEvent.roomService" />
      </div>
    </div>

    <div class="mb-3">
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'add'">
        {{ $t('labels.book') }}
      </button>
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'edit'">
        {{ $t('labels.save') }}
      </button>
      <button type="button" class="btn btn-light" v-on:click="this.$emit('cancel')">
        {{ $t('labels.cancel') }}
      </button>
    </div>
  </form>
</template>

<script>
export default {
  components: {},
  name: 'BookingForm',
  props: {
    event: {
      type: Object,
      default: function () {
        return {
          startDate: new Date().toISOString().split('T')[0] + 'T16:00',
          endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T12:00',
          summary: '',
          roomService: false,
          location: undefined,
          organizer: undefined,
        }
      },
    },
    mode: {
      type: String,
      required: true,
      validator: function (value) {
        return ['add', 'edit'].indexOf(value) !== -1
      },
    },
    roomNames: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      formEvent: this.event,
    }
  },
  methods: {
    setEvent(event) {
      const formEvent = event
      formEvent.startDate = new Date(new Date(event.startDate).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().slice(0, -8)
      formEvent.endDate = new Date(new Date(event.endDate).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().slice(0, -8)
      return formEvent
    },
    send() {
      const event = {};
      Object.assign(event, this.formEvent)
      event.startDate = new Date(this.formEvent.startDate)
      event.endDate = new Date(this.formEvent.endDate)
      this.$emit('done', event)
    },
    clear() {
      this.formEvent = {
        startDate: new Date().toISOString().split('T')[0] + 'T16:00',
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T12:00',
        summary: '',
        roomService: false,
        location: undefined,
        organizer: undefined,
      }
    },
  },
  mounted() {},
  watch: {
    event: function () {
      this.formEvent = this.setEvent(this.event)
    },
  },
}
</script>

<style>
</style>