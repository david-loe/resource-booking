<template>
  <div class="container">
    <p>{{ $t('comp.export.description') }}</p>
    <div class="row mb-2">
      <div class="col-auto">
        <label for="separatorCSVImport" class="form-label"> {{ $t('labels.separator') }} </label>
        <select class="form-select" id="separatorCSVImport" v-model="separator">
          <option v-for="sep of this.separatorList" :value="sep.value" :key="sep.name">{{ sep.name }}</option>
        </select>
      </div>
      <div class="col-auto" v-if="this.$root.useSubresources">
        <label for="arraySeparatorCSVImport" class="form-label">
          {{ $t('labels.arraySeparator') }}: [1{{ arraySeparator }}2{{ arraySeparator }}3]
        </label>
        <select class="form-select" id="arraySeparatorCSVImport" v-model="arraySeparator">
          <option v-for="sep of this.separatorList" :value="sep.value" :key="sep.name">{{ sep.name }}</option>
        </select>
      </div>
    </div>
    <button type="button" class="btn btn-light mb-2" v-on:click="this.export()">
      {{ $t('labels.export') }}
    </button>
    <div v-if="csv !== ''">
      <label for="csvCSVExport" class="form-label">{{ $t('labels.csv') }}</label>
      <textarea class="form-control" id="csvCSVExport" rows="10" v-model="csv" readonly></textarea>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  components: {},
  name: 'ExportBookings',
  data() {
    return {
      separatorList: [
        { name: 'Tab', value: '\t' },
        { name: 'Komma', value: ', ' },
        { name: 'Semikolon', value: '; ' },
        { name: 'Doppelpunkt', value: ': ' },
      ],
      separator: '\t',
      arraySeparator: ', ',
      csv: '',
    }
  },
  methods: {
    async export() {
      try {
        const res = await axios.get(process.env.VUE_APP_BACKEND_URL + '/api/admin/csv/booking', {
          params: { separator: this.separator, arraySeparator: this.arraySeparator },
          withCredentials: true,
        })
        if (res.status === 200) {
          this.csv = res.data.csv
          this.separator = res.data.separator
          this.arraySeparator = res.data.arraySeparator
        }
      } catch (error) {
        if (error.response.status === 401) {
          this.$router.push('login')
        } else {
          console.log(error.response.data)
        }
      }
    },
  },
}
</script>

<style>
</style>