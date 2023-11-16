<template>
  <form class="container" @submit.prevent="this.mode === 'add' ? this.$emit('add', this.formUser) : this.$emit('edit', this.formUser)">
    <div class="row mb-2">
      <div class="col">
        <label for="userFormMail" class="form-label">
          {{ $t('labels.email') }}
        </label>
        <input type="text" class="form-control" id="userFormMail" v-model="formUser.mail" required :disabled="this.mode === 'edit'" />
      </div>
    </div>

    <div class="row mb-2">
      <div class="col" v-if="this.$root.useService">
        <div class="form-check">
          <label for="userFormService" class="form-check-label text-nowrap"> {{ $t('headlines.service') }}</label>
          <input class="form-check-input" type="checkbox" id="userFormService" role="switch" v-model="formUser.isService" />
        </div>
      </div>
      <div class="col">
        <div class="form-check">
          <label for="userFormAdmin" class="form-check-label text-nowrap"> {{ $t('labels.admin') }}</label>
          <input class="form-check-input" type="checkbox" id="userFormAdmin" role="switch" v-model="formUser.isAdmin" />
        </div>
      </div>
    </div>

    <div class="mb-2">
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'add'">
        {{ $t('labels.addUser') }}
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
  name: 'UserForm',
  props: {
    user: {
      type: Object,
      default: function () {
        return {
          isAdmin: false,
          isService: false,
          mail: '',
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
      formUser: this.user,
    }
  },
  methods: {
    clear() {
      this.formUser = {
        isAdmin: false,
        isService: false,
        mail: '',
      }
    },
  },
  beforeMount() {},
  watch: {
    user: function () {
      this.formUser = this.user
    },
  },
}
</script>

<style></style>
