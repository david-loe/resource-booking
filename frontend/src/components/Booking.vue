<template>
  <div class="container">
    <h1>Booking</h1>
    <div class="container">
      <form @submit.prevent="search()">
        <div class="row justify-content-center">
          <div class="col-md-auto bg-light p-2">
            <label for="startDateInput" class="form-label">From</label>
            <input
              id="startDateInput"
              class="form-control"
              type="date"
              v-model="searchInterval.startDate"
            />
          </div>
          <div class="col-md-auto bg-light p-2">
            <label for="endDateInput" class="form-label">To</label>
            <input
              id="endDateInput"
              class="form-control"
              type="date"
              v-model="searchInterval.endDate"
            />
          </div>
          <div class="col-md-auto bg-light p-2 d-flex align-items-end">
            <button type="submit" class="btn btn-primary">Search</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "Booking",
  data() {
    return {
      searchInterval: {
        startDate: null,
        endDate: null,
      },
    };
  },
  methods: {
    search() {

    }
  },
};
</script>

<style>
</style>