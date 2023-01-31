<template>
  <form class="container" @submit.prevent="this.mode === 'add' ? this.$emit('add', this.formCategory) : this.$emit('edit', this.formCategory)">
    <div class="mb-2">
      <label for="categoryFormName" class="form-label">
        {{ $t('labels.name') }}
      </label>
      <input type="text" class="form-control" id="categoryFormName" v-model="formCategory.name" required :disabled="this.mode === 'edit'" />
    </div>

    <div class="mb-2">
      <label for="categoryFormHint" class="form-label">
        {{ $t('labels.hint') }}
      </label>
      <input type="text" class="form-control" id="categoryFormHint" v-model="formCategory.hint" required :disabled="this.mode === 'edit'" />
    </div>

    <div class="mb-2">
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'add'">
        {{ $t('labels.add') }}
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
  name: 'CategoryForm',
  props: {
    category: {
      type: Object,
      default: function () {
        return {
          name: '',
          hint: ''
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
      formCategory: this.category,
    }
  },
  methods: {
    clear() {
      this.formCategory = {
        name: '',
        hint: ''
      }
    },
  },
  beforeMount() {},
  watch: {
    category: function () {
      this.formCategory = this.category
    },
  },
}
</script>

<style>
</style>