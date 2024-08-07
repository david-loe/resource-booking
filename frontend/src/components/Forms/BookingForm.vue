<template>
  <form class="container" @submit.prevent="send">
    <div class="row mb-3">
      <div class="col-auto">
        <label for="startDateInput" class="form-label">{{ $t('labels.from') }}</label>
        <input id="startDateInput" class="form-control" type="datetime-local" v-model="formBooking.startDate" required />
      </div>
      <div class="col-auto">
        <label for="endDateInput" class="form-label">{{ $t('labels.to') }}</label>
        <input
          id="endDateInput"
          class="form-control"
          type="datetime-local"
          v-model="formBooking.endDate"
          required
          v-bind:min="formBooking.startDate"
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
        v-model="formBooking.summary"
        required
      />
    </div>

    <div v-if="this.$root.categories.length > 0" class="mb-3">
      <label for="category" class="form-label"> {{ $t('labels.category') }} </label>
      <select
        class="form-select"
        id="category"
        v-model="formBooking.category"
        required>
          <option disabled value="">{{$t('labels.chooseCategory')}}</option>
          <option v-for="category of $root.categories" :value="category.name"  :title="category.hint" :key="category._id">{{category.name}}</option>
        </select>
    </div>

    <div v-if="$root.useUtilization" class="mb-3">
      <label for="utilization" class="form-label"> {{ $t('labels.utilization') }} </label>
      <input
        type="number"
        class="form-control"
        id="utilization"
        v-model="formBooking.utilization"
        required
      />
    </div>

    <div class="mb-3">
      <label for="resource" class="form-label"> {{ $t('labels.resource') }} </label>
      <select class="form-select" id="resource" v-model="formBooking.resource">
        <option v-for="name in this.$root.resourceNames" :value="name" :key="name">{{ name }}</option>
      </select>
    </div>

    <div class="mb-3" v-if="this.$root.useSubresources && this.$root.getResourceByName(formBooking.resource) && this.$root.getResourceByName(formBooking.resource).isDividable">
      <label for="subresources" class="form-label"> {{ $t('labels.subresources') }} </label>
      <ul id="subresources">
        <li class="ms-2 form-check" v-for="subresource of this.$root.getResourceByName(formBooking.resource).subresources" :key="subresource">
          <label :for="'bookingFormSubresource' + subresource" class="form-check-label text-nowrap" style="width: 100%"> {{ subresource }}</label>
          <input
            class="form-check-input"
            type="checkbox"
            :id="'bookingFormSubresource' + subresource"
            role="switch"
            :value="subresource"
            v-model="formBooking.subresources"
          />
        </li>
      </ul>
    </div>

    <div class="mb-3" v-if="this.$root.useService">
      <div class="form-check">
        <label for="service" class="form-check-label text-nowrap"> {{ $t('labels.service') }}</label>
        <input class="form-check-input" type="checkbox" id="service" role="switch" v-model="formBooking.service" />
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
    booking: {
      type: Object,
      default: function (props) {
        return {
          startDate: props.$root.dateToHTMLInputString(new Date().setHours(16,0,0,0)),
          endDate: props.$root.dateToHTMLInputString(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).setHours(12,0,0,0)),
          summary: '',
          utilization: null,
          category: '',
          service: false,
          resource: undefined,
          organizer: undefined,
          subresources: undefined,
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
  },
  data() {
    return {
      formBooking: this.booking,
      isNewOpened: true,
    }
  },
  methods: {
    setBooking(booking) {
      const formBooking = {}
      Object.assign(formBooking, booking)
      formBooking.startDate = this.$root.dateToHTMLInputString(booking.startDate)
      formBooking.endDate = this.$root.dateToHTMLInputString(booking.endDate)
      const resource = this.$root.getResourceByName(formBooking.resource)
      if (formBooking.subresources === null && resource.isDividable) {
        formBooking.subresources = resource.subresources
      }
      return formBooking
    },
    send() {
      const booking = {}
      Object.assign(booking, this.formBooking)
      booking.startDate = new Date(this.formBooking.startDate)
      booking.endDate = new Date(this.formBooking.endDate)
      if (booking.subresources !== null) {
        if (booking.subresources.length === this.$root.getResourceByName(this.formBooking.resource).subresources.length) {
          booking.subresources = null
        }
      }
      this.$emit('done', booking)
    },
    clear() {
      this.formBooking = {
        startDate: this.$root.dateToHTMLInputString(new Date().setHours(16,0,0,0)),
        endDate: this.$root.dateToHTMLInputString(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).setHours(12,0,0,0)),
        summary: '',
        utilization: null,
        category: '',
        service: false,
        resource: undefined,
        organizer: undefined,
        subresources: undefined,
      }
    },
  },
  mounted() {},
  watch: {
    booking: function () {
      this.formBooking = this.setBooking(this.booking)
      this.isNewOpened = true
    },
    'formBooking.resource': function () {
      if (this.$root.getResourceByName(this.formBooking.resource).isDividable) {
        if (!this.isNewOpened) {
          this.formBooking.subresources = this.$root.getResourceByName(this.formBooking.resource).subresources
        }
      } else {
        this.formBooking.subresources = null
      }
      this.isNewOpened = false
    },
  },
}
</script>

<style>
</style>
