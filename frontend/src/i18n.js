import { createI18n } from 'vue-i18n'

const locales = import.meta.glob('@locales/*.json', { eager: true, import: 'default' })
const messages = Object.fromEntries(
  Object.entries(locales).map(([path, messages]) => [path.split('/').pop().replace(/\.json$/, ''), messages]),
)

export default createI18n({
  legacy: false,
  locale: import.meta.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages,
  globalInjection: true
})
