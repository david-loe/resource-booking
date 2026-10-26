const i18next = require("i18next")
const fs = require('fs');
const path = require('node:path')

// Docker mounts translations locally; direct Node runs use the shared directory.
const mountedLocales = path.join(__dirname, 'locales')
const locales = fs.existsSync(mountedLocales) && fs.readdirSync(mountedLocales).some(file => file.endsWith('.json'))
  ? mountedLocales
  : path.join(__dirname, '../locales')
function loadLocaleMessages() {
  const messages = {}
  fs.readdirSync(locales).forEach(file => {
      const matched = file.match(/([A-Za-z0-9-_]+)\./i)
      if (matched && matched.length > 1) {
        const rawdata = fs.readFileSync(path.join(locales, file))
        const locale = matched[1]
        messages[locale] = {translation: JSON.parse(rawdata)}
      }
    });
    return messages
}

i18next.init({
    legacy: false,
    lng: process.env.VUE_APP_I18N_LOCALE || 'en',
    fallbackLng: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
    resources: loadLocaleMessages(),
    globalInjection: true,
    interpolation: {
      prefix: "{",
      suffix: "}",
      nestingPrefix: "@:{'",
      nestingSuffix: "'}"
    }
  })

module.exports = i18next

