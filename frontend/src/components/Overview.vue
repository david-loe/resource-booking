<template>
  <div class="container">
    <h2>{{ $t('headlines.overview') }}</h2>
    <div v-if="resources.length > 0">
      <div class="container my-3">
        <div class="row justify-content-center">
          <div class="col-9">
            <div class="bg-light">
              <div class="px-2 pt-2 pb-1 row justify-content-between">
                <div class="col-auto">Filter:</div>
                <div class="form-check form-check-inline col-auto">
                  <label for="onlyShowAvailableResources" class="form-check-label">
                    <i class="bi bi-funnel d-block d-md-none" :title="$t('labels.onlyShowAvailableResources')"></i>
                    <template class="d-none d-md-block">{{ $t('labels.onlyShowAvailableResources') }}</template>
                    </label>
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="onlyShowAvailableResources"
                    role="switch"
                    v-model="this.onlyShowAvailableResources"
                  />
                </div>
              </div>
              <div class="list-group list-group-checkable d-flex flex-wrap flex-row justify-content-center bg-light px-2 pb-2">
                <div v-for="(resource, index) of overviewResources" v-bind:key="resource.name" class="ps-2">
                  <input
                    class="list-group-item-check"
                    type="checkbox"
                    name="filter"
                    v-bind:id="index"
                    v-bind:value="resource.name"
                    v-model="selectedResources"
                    @change="changeSelection"
                  />
                  <label class="list-group-item py-1 small" v-bind:for="index">
                    <img v-bind:src="resource.img" width="24" height="24" class="rounded-circle flex-shrink-0 border me-1" />
                    <span class="align-middle" :style="{ color: resource.color }">{{ resource.name }}</span>
                    <span
                      class="position-absolute top-50 start-0 translate-middle p-2 border border-light rounded-circle"
                      :style="{ backgroundColor: resource.color }"
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Calendar
        :resourceNames="this.resourceNames"
        tab="month"
        v-on:changed-bookings="this.$emit('changed-bookings')"
        v-on:changed-view-dates="this.setAvailableResources"
      ></Calendar>
    </div>

    <div v-else class="alert alert-primary" role="alert">
      <h4 class="alert-heading">{{ $t('alerts.noResource.heading') }}</h4>
      {{ $t('alerts.noResource.text') }}
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
    resources: {
      type: Array,
      default: function () {
        return []
      },
    },
  },
  data() {
    return {
      overviewResources: [],
      selectedResources: [],
      resourceNames: [],
      onlyShowAvailableResources: true,
      availableResources: [],
      calendarViewStartDate: new Date(),
      calendarViewEndDate: new Date(),
    }
  },
  methods: {
    async setAvailableResources(startDate, endDate, force = false) {
      if (this.onlyShowAvailableResources && (startDate.getTime() !== this.calendarViewStartDate.getTime() || endDate.getTime() !== this.calendarViewEndDate.getTime() || force)) {
        const result = await this.$root.getResourcesAvailability(startDate, endDate, 1)
        this.availableResources = jp.query(result.available, '$..resource')
        const availableResourceNames = jp.query(this.availableResources, '$..name')
        const newSelection = []
        for(const resource of this.selectedResources){
          if(availableResourceNames.indexOf(resource) !== -1){
            newSelection.push(resource)
          }
        }
        this.selectedResources = newSelection
        this.calendarViewStartDate = startDate
        this.calendarViewEndDate = endDate
      }
    },
    changeSelection() {
      if (this.selectedResources.length === 0) {
        this.resourceNames = jp.query(this.overviewResources, '$..name')
      } else {
        this.resourceNames = this.selectedResources
      }
    },
  },
  beforeMount() {
    this.resourceNames = this.$root.resourceNames
  },
  watch: {
    resources: function () {
      if(this.onlyShowAvailableResources){
        this.setAvailableResources(this.calendarViewStartDate, this.calendarViewEndDate, true)
      }else{
        this.overviewResources = this.resources
      }
    },
    availableResources: function () {
      if (this.onlyShowAvailableResources) {
        this.overviewResources = this.availableResources
        this.changeSelection()
      }
    },
    onlyShowAvailableResources: function () {
      if (this.onlyShowAvailableResources) {
        this.setAvailableResources(this.calendarViewStartDate, this.calendarViewEndDate, true)
        this.overviewResources = this.availableResources
      } else {
        this.overviewResources = this.$root.resources
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