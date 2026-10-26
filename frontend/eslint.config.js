import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'src/libs/icalendar/ical-expander/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    rules: { 'vue/multi-word-component-names': 'off' },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
]
