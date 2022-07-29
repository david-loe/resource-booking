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
                resources: booked.resourceNames.join(', '),
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
        <div v-if="resources.length > 0">
          <div class="container mb-3">
            <form @submit.prevent="search(bookingData.startDate, bookingData.endDate)">
              <div class="row justify-content-center">
                <div class="col-auto">
                  <div class="row bg-dark text-white rounded-2">
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
              <label
                class="list-group-item d-flex gap-3 align-items-center flex-wrap"
                v-for="resource of searchresult.available"
                v-bind:key="resource.name"
              >
                <input
                  class="form-check-input flex-shrink-0 my-auto"
                  type="checkbox"
                  v-bind:value="resource.name"
                  style="font-size: 1.375em"
                  v-model="selectedResources"
                />
                <img v-bind:src="resource.img" width="45" height="45" class="rounded-circle flex-shrink-0" />
                <span class="pt-1 form-checked-content me-auto">
                  <h6>{{ resource.name }}</h6>
                  <small class="d-none d-md-block text-muted"> {{ resource.description }} - {{ $t('labels.size') }}: {{ resource.size }} </small>
                </span>
                <template v-if="this.$root.useSubresources">
                  <div class="dropdown" v-if="selectedResources.indexOf(resource.name) !== -1 && resource.isDividable">
                    <button
                      :class="'btn dropdown-toggle btn-' + (resource.isPartlyBooked ? 'danger' : 'light')"
                      type="button"
                      id="dropdownMenuButton1"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                      aria-expanded="false"
                    >
                      {{ $t('labels.selectSubresources') }}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                      <li class="ms-2 form-check" v-for="subresource of resource.subresources" :key="subresource">
                        <label :for="'resourceFormSubresource' + resource.name + subresource" class="form-check-label text-nowrap" style="width: 100%">
                          {{ subresource }}</label
                        >
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="'resourceFormSubresource' + resource.name + subresource"
                          role="switch"
                          :value="{ resource: resource.name, subresource: subresource }"
                          v-model="selectedSubresources"
                          :selected="true"
                        />
                      </li>
                    </ul>
                  </div>
                </template>
              </label>
              <label class="list-group-item d-flex gap-3 bg-light" v-if="searchresult.unavailable.length > 0">
                <span class="pt-1">
                  <span class="w-100" v-if="searchresult.unavailable.length > 0 && searchresult.available.length === 0">{{
                    $t('comp.booking.allResourcesBooked')
                  }}</span>
                  <span class="w-100" v-else>{{ $t('comp.booking.resourcesBooked', searchresult.unavailable.length) }}</span>
                </span>
              </label>
            </div>
          </div>
          <div v-if="selectedResources.length > 0" class="container">
            <form @submit.prevent="book()">
              <div class="row justify-content-center">
                <div class="col-auto">
                  <div class="row bg-dark text-white rounded-2" style="max-width: 400px">
                    <div class="col p-2" style="width: 300px">
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
                    <template v-if="this.$root.useService">
                      <div class="w-100"></div>
                      <div class="col p-2">
                        <div class="form-check form-check-inline">
                          <label for="service" class="form-check-label text-nowrap"> {{ $t('labels.service') }}</label>
                          <input
                            class="form-check-input"
                            type="checkbox"
                            id="service"
                            role="switch"
                            v-model="bookingData.service"
                          />
                        </div>
                      </div>
                    </template>

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
          <h4 class="alert-heading">{{ $t('alerts.noResource.heading') }}</h4>
          {{ $t('alerts.noResource.text') }}
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
  props: ['resources'],
  data() {
    return {
      bookingData: {
        startDate: this.$root.dateToHTMLInputString(new Date().setHours(16,0,0,0)),
        endDate: this.$root.dateToHTMLInputString(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).setHours(12,0,0,0)),
        summary: '',
        service: false,
      },
      searchresult: { available: [], unavailable: [] },
      selectedResources: [],
      selectedSubresources: [],
      modal: undefined,
      booked: {
        startDate: undefined,
        endDate: undefined,
        resourceNames: [],
      },
    }
  },
  methods: {
    clear() {
      this.searchresult = { available: [], unavailable: [] }
      this.selectedResources = []
      this.selectedSubresources = []
    },
    async search(startDate, endDate) {
      this.searchresult = await this.$root.getResourcesAvailability(new Date(startDate), new Date(endDate))
      this.selectedResources = []
    },
    async book() {
      try {
        const data = {
          resources: this.selectedResources,
          summary: this.bookingData.summary,
          startDate: new Date(this.bookingData.startDate),
          endDate: new Date(this.bookingData.endDate),
          service: this.bookingData.service,
          subresources: this.selectedSubresources,
        }
        const res = await axios.post(process.env.VUE_APP_BACKEND_URL + '/api/booking', data, {
          withCredentials: true,
        })
        if (res.status === 200) {
          this.clear()
          this.booked.startDate = res.data.startDate
          this.booked.endDate = res.data.endDate
          this.booked.resourceNames = jp.query(res.data.resources, '$..name')
          this.$emit('changed')
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
        this.booked = { startDate: undefined, endDate: undefined, resourceNames: [] }
      }
      this.modal.show()
    },
  },
  mounted() {
    this.modal = new Modal(document.getElementById('bookingInfoModal'), {})
  },
  watch: {
    selectedResources: {
      handler: function (newVal, oldVal) {
        const added = newVal.filter((x) => !oldVal.includes(x))
        if (added.length > 0) {
          for (const resource of this.searchresult.available) {
            for (const newResource of added) {
              if (resource.name === newResource && resource.isDividable) {
                for (const subresource of resource.subresources) {
                  this.selectedSubresources.push({ resource: resource.name, subresource: subresource })
                }
              }
            }
          }
        }
        if (Array.isArray(oldVal)) {
          const removed = oldVal.filter((x) => !newVal.includes(x))
          if (removed.length > 0) {
            for (const removedResource of removed) {
              const indices = []
              for (const subresource of this.selectedSubresources) {
                if (subresource.resource === removedResource) {
                  const index = this.selectedSubresources.findIndex((sb) => sb.resource === subresource.resource && sb.subresource === subresource.subresource)
                  if (index !== -1) {
                    indices.push(index)
                  }
                }
              }
              indices.sort(function (a, b) {
                return b - a
              })
              for (const index of indices) {
                this.selectedSubresources.splice(index, 1)
              }
            }
          }
        }
      },
    },
    selectedSubresources: {
      handler: function (newVal, oldVal) {
        if (Array.isArray(oldVal)) {
          const removed = oldVal.filter((x) => !newVal.includes(x))
          for (const removedSubresource of removed) {
            var lastSubresourceOfResource = true
            for (const subresource of newVal) {
              if (subresource.resource === removedSubresource.resource) {
                lastSubresourceOfResource = false
              }
            }
            if (lastSubresourceOfResource) {
              const index = this.selectedResources.indexOf(removedSubresource.resource)
              if (index !== -1) {
                this.selectedResources.splice(index, 1)
              }
            }
          }
        }
      },
    },
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