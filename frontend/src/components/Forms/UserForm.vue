<template>
  <form class="container" @submit.prevent="this.mode === 'add' ? this.$emit('add', this.formUser) : this.$emit('edit', this.formUser)">
    <div class="mb-2">
      <label for="userFormUid" class="form-label">
        {{ $t('labels.uid') }}
      </label>
      <input type="text" class="form-control" id="userFormUid" v-model="formUser.uid" required :disabled="this.mode === 'edit'" />
    </div>

    <div class="row mb-2">
      <div class="col">
        <div class="form-check">
          <label for="userFormRoomService" class="form-check-label text-nowrap"> {{ $t('labels.roomService') }}</label>
          <input class="form-check-input" type="checkbox" id="userFormRoomService" role="switch" v-model="formUser.isRoomService" />
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
          uid: '',
          isAdmin: false,
          isRoomService: false,
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
        name: '',
        size: '',
        description: '',
        img: undefined,
        color: this.correctColorLuminance(this.generateRandomColorHex()),
      }
    },
  },
  beforeMount() {},
  watch: {
    room: function () {
      this.formUser = this.room
    },
  },
}
</script>

<style>
</style>