<template>
  <form class="container" @submit.prevent="this.mode === 'add' ? this.$emit('add', this.formResource) : this.$emit('edit', this.formResource)">
    <div class="mb-2">
      <div class="row">
        <div class="col-sm">
          <label for="resourceFormName" class="form-label">
            {{ $t('labels.name') }}
          </label>
          <input
            type="text"
            class="form-control"
            id="resourceFormName"
            :placeholder="$t('comp.resource.exampleName')"
            v-model="formResource.name"
            required
            :disabled="this.mode === 'edit'"
            pattern='^(?!service\b)[^<>\/\\\*\|":\?]*$'
            :title="$t('alerts.nameValidation')"
          />
        </div>
        <div class="col-sm">
          <div class="row">
            <div class="col">
              <label for="resourceFormSize" class="form-label">
                {{ $t('labels.size') }}
              </label>
              <input type="text" class="form-control" id="resourceFormSize" v-model="formResource.size" />
            </div>
            <div class="col-auto">
              <label for="resourceFormColor" class="form-label">
                {{ $t('labels.color') }}
              </label>
              <input
                style="min-height: 27px"
                type="color"
                class="form-control"
                id="resourceFormColor"
                v-model="formResource.color"
                @change="formResource.color = correctColorLuminance(formResource.color)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="row">
        <div class="col-sm">
          <label for="resourceFormDes" class="form-label">
            {{ $t('labels.description') }}
          </label>
          <textarea class="form-control" id="resourceFormDes" rows="3" v-model="formResource.description"></textarea>
        </div>
        <div class="col-sm">
          <div class="mb-2">
            <label for="resourceFormImg" class="form-label"> {{ $t('labels.image') }} (max 1MB)</label>
            <input class="form-control" type="file" id="resourceFormImg" @change="changeFile" accept="image/*" />
          </div>

          <div v-if="this.$root.useSubresources" class="form-check">
            <label for="resourceFormDividable" class="form-check-label text-nowrap"> {{ $t('labels.isDividable') }}</label>
            <input
              class="form-check-input"
              type="checkbox"
              id="resourceFormDividable"
              role="switch"
              v-model="formResource.isDividable"
              :disabled="this.mode === 'edit'"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <template v-if="formResource.isDividable">
        <label for="resourceFormSubresourceAdd" class="form-label">
          {{ $t('labels.subresources') }}
        </label>
        <div class="input-group mb-1" v-if="this.mode !== 'edit'">
          <input type="text" class="form-control" id="resourceFormSubresourceAdd" :placeholder="$t('labels.addSubresource')" v-model="subresourceAdd" />
          <button v-on:click="addSubresource(this.subresourceAdd)" type="button" class="btn btn-outline-secondary">
            <i class="bi bi-plus"></i>
          </button>
        </div>
        <br v-if="this.mode === 'edit'" />
        <div v-for="subresource of formResource.subresources" :key="subresource" class="badge bg-secondary me-2 mb-1">
          {{ subresource }}
          <button v-on:click="deleteSubresource(subresource)" type="button" class="btn text-light p-0" v-if="this.mode !== 'edit'">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </template>
    </div>
    <div class="mb-2">
      <button type="submit" class="btn btn-primary me-2" v-if="this.mode === 'add'">
        {{ $t('labels.addResource') }}
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
  name: 'ResourceForm',
  props: {
    resource: {
      type: Object,
      default: function () {
        return {
          name: '',
          size: '',
          description: '',
          img: undefined,
          color: undefined,
          isDividable: false,
          subresources: [],
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
      formResource: this.resource,
      subresourceAdd: '',
    }
  },
  methods: {
    addSubresource(subresource) {
      const index = this.formResource.subresources.indexOf(subresource)
      if (index === -1 && subresource.length > 0) {
        this.formResource.subresources.push(subresource)
        this.subresourceAdd = ''
      }
    },
    deleteSubresource(subresource) {
      const index = this.formResource.subresources.indexOf(subresource)
      if (index !== -1) {
        this.formResource.subresources.splice(index, 1)
      }
    },
    clear() {
      this.formResource = {
        name: '',
        size: '',
        description: '',
        img: undefined,
        color: this.correctColorLuminance(this.generateRandomColorHex()),
        isDividable: false,
        subresources: [],
      }
    },
    changeFile(booking) {
      const reader = new FileReader()
      if (booking.target.files.length === 1 && booking.target.files[0].size < 1000000) {
        reader.readAsDataURL(booking.target.files[0])
        reader.onload = async () => {
          this.formResource.img = await this.resizedataURL(reader.result, 50, 50)
        }
      } else {
        this.formResource.img = undefined
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

        // When the booking "onload" is triggered we can resize the image.
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
    if (this.formResource.color === undefined) {
      this.formResource.color = this.correctColorLuminance(this.generateRandomColorHex())
    }
  },
  watch: {
    resource: function () {
      this.formResource = this.resource
    },
  },
}
</script>

<style>
</style>