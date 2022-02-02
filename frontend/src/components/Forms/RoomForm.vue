<template>
  <form class="container" @submit.prevent="this.mode === 'add' ? this.$emit('add', this.formRoom) : this.$emit('edit', this.formRoom)">
    <div class="mb-2">
      <div class="row">
        <div class="col-sm">
          <label for="roomFormName" class="form-label">
            {{ $t('labels.name') }}
          </label>
          <input
            type="text"
            class="form-control"
            id="roomFormName"
            :placeholder="$t('comp.room.exampleName')"
            v-model="formRoom.name"
            required
            :disabled="this.mode === 'edit'"
            pattern='^(?!roomservice\b)[^<>\/\\\*\|":\?]*$'
            :title="$t('alerts.nameValidation')"
          />
        </div>
        <div class="col-sm">
          <div class="row">
            <div class="col">
              <label for="roomFormSize" class="form-label">
                {{ $t('labels.size') }}
              </label>
              <input type="text" class="form-control" id="roomFormSize" v-model="formRoom.size" />
            </div>
            <div class="col-auto">
              <label for="roomFormColor" class="form-label">
                {{ $t('labels.color') }}
              </label>
              <input
                style="min-height: 27px"
                type="color"
                class="form-control"
                id="roomFormColor"
                v-model="formRoom.color"
                @change="formRoom.color = correctColorLuminance(formRoom.color)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="row">
        <div class="col-sm">
          <label for="roomFormDes" class="form-label">
            {{ $t('labels.description') }}
          </label>
          <textarea class="form-control" id="roomFormDes" rows="3" v-model="formRoom.description"></textarea>
        </div>
        <div class="col-sm">
          <label for="roomFormImg" class="form-label"> Image (max 1MB)</label>
          <input class="form-control" type="file" id="roomFormImg" @change="changeFile" accept="image/*" />
        </div>
      </div>
    </div>
    <div class="mb-2">
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'add'">
        {{ $t('labels.addRoom') }}
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
  name: 'RoomForm',
  props: {
    room: {
      type: Object,
      default: function () {
        return {
          name: '',
          size: '',
          description: '',
          img: undefined,
          color: undefined,
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
      formRoom: this.room,
    }
  },
  methods: {
    clear() {
      this.formRoom = {
        name: '',
        size: '',
        description: '',
        img: undefined,
        color: this.correctColorLuminance(this.generateRandomColorHex()),
      }
    },
    changeFile(event) {
      const reader = new FileReader()
      if (event.target.files.length === 1 && event.target.files[0].size < 1000000) {
        reader.readAsDataURL(event.target.files[0])
        reader.onload = async () => {
          this.formRoom.img = await this.resizedataURL(reader.result, 50, 50)
        }
      } else {
        this.formRoom.img = undefined
      }
    },

    correctColorLuminance(hex) {
      if (hex) {
        // HEX to RGB
        var rgb = this.hexToRgb(hex)
        var luminance = this.calcRelativeLumiance(rgb)
        // setting 0.4 as border
        while (luminance > 0.4) {
          rgb = [rgb[0] >= 2 ? rgb[0] - 2 : 0, rgb[1] >= 7 ? rgb[1] - 7 : 0, rgb[2] >= 1 ? rgb[2] - 1 : 0]
          luminance = this.calcRelativeLumiance(rgb)
        }
        return this.rgbToHex(rgb[0], rgb[1], rgb[2])
      }
    },

    generateRandomColorHex() {
      const rgb = [255, 255, 255].map(function (v) {
        return Math.round(Math.random() * v)
      })
      return this.rgbToHex(rgb[0], rgb[1], rgb[2])
    },

    // From https://stackoverflow.com/a/52983833/13582326
    resizedataURL(datas, wantedWidth, wantedHeight) {
      return new Promise((resolve) => {
        // We create an image to receive the Data URI
        var img = document.createElement('img')

        // When the event "onload" is triggered we can resize the image.
        img.onload = function () {
          // We create a canvas and get its context.
          var canvas = document.createElement('canvas')
          var ctx = canvas.getContext('2d')

          // We set the dimensions at the wanted size.
          canvas.width = wantedWidth
          canvas.height = wantedHeight

          // We resize the image with the canvas method drawImage();
          ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight)

          var dataURI = canvas.toDataURL()

          // This is the return of the Promise
          resolve(dataURI)
        }
        // We put the Data URI in the image's src attribute
        img.src = datas
      })
    },
    calcRelativeLumiance(rgb) {
      // CALC relative Lumiance https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
      const copy = rgb.map(function (v) {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return copy[0] * 0.2126 + copy[1] * 0.7152 + copy[2] * 0.0722
    },

    rgbToHex(r, g, b) {
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    },

    hexToRgb(hex) {
      const result = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(hex)
      return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    },
  },
  beforeMount() {
    if (this.formRoom.color === undefined) {
      this.formRoom.color = this.correctColorLuminance(this.generateRandomColorHex())
    }
  },
  watch: {
    room: function() {
      this.formRoom = this.room
    }
  }
}
</script>

<style>
</style>