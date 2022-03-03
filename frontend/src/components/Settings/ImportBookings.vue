<template>
  <div class="container">
    <p>{{$t('comp.import.description')}}</p>
    <div class="row mb-2">
      <div class="col-auto">
        <label for="separatorCSVImport" class="form-label"> {{ $t('labels.separator') }} </label>
        <select class="form-select" id="separatorCSVImport" v-model="separator">
          <option v-for="sep of this.separatorList" :value="sep.value" :key="sep.name">{{ sep.name }}</option>
        </select>
      </div>
      <div class="col-auto">
        <label for="arraySeparatorCSVImport" class="form-label"> {{ $t('labels.arraySeparator') }}: 1{{arraySeparator}}2{{arraySeparator}}3 </label>
        <select class="form-select" id="arraySeparatorCSVImport" v-model="arraySeparator">
          <option v-for="sep of this.separatorList" :value="sep.value" :key="sep.name">{{ sep.name }}</option>
        </select>
      </div>
    </div>
    <div class="mb-2">
      <label for="csvCSVImport" class="form-label">{{ $t('labels.csv') }}</label>
    <textarea class="form-control" id="csvCSVImport" rows="10" v-model="csv"></textarea>
    </div>
    
    <button type="button" class="btn btn-light" v-on:click="this.import()">
      {{ $t('labels.import') }}
    </button>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  components: {},
  name: 'ImportBookings',
  data() {
    return {
      colums: ['summary', 'startDate', 'endDate', 'location', 'organizer', 'roomService', 'subrooms'],
      separatorList: [
        { name: 'Tab', value: '\t' },
        { name: 'Komma', value: ', ' },
        { name: 'Semikolon', value: '; ' },
        { name: 'Doppelpunkt', value: ': ' },
      ],
      separator: '\t',
      arraySeparator: ', ',
      csv: '',
      roomToEdit: undefined,
    }
  },
  methods: {
    async import() {
      try {
        const res = await axios.post(
          process.env.VUE_APP_BACKEND_URL + '/api/admin/csv/booking',
          { csv: this.csv, separator: this.separator, arraySeparator: this.arraySeparator },
          {
            withCredentials: true,
          },
        )
        if (res.status === 200) {
          alert('Success')
          this.clean()
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          alert('Look into the console Log')
          console.log(error.response.data)
        }
      }
    },
    clean() {
      this.csv = this.colums.join(this.separator) + '\n'
    },
  },
  beforeMount() {
    this.csv = this.colums.join(this.separator) + '\n'
  },
  watch: {
    separator: function () {
      this.csv = this.colums.join(this.separator) + '\n'
    },
  },
}
</script>

<style>
</style>