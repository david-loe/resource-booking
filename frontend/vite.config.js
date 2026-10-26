import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'

const mountedLocales = fileURLToPath(new URL('./src/locales/', import.meta.url))
const locales = existsSync(mountedLocales) && readdirSync(mountedLocales).some(file => file.endsWith('.json'))
  ? mountedLocales
  : fileURLToPath(new URL('../locales/', import.meta.url))

export default defineConfig({
  plugins: [vue(), VueI18n({ include: `${locales}/*.json`, runtimeOnly: false })],
  envDir: '..',
  envPrefix: 'VUE_APP_',
  resolve: { alias: { '@locales': locales } },
})
