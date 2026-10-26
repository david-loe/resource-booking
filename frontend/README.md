# Frontend development

Use Node.js 26 (`nvm use` from the repository root) and npm 12.2.1.

```sh
npm install --global npm@12.2.1
cd frontend
npm ci
npm run serve
```

Vite serves on port 80, matching Docker Compose. To use an unprivileged local
port, run `npm run serve -- --port 5000`.

The shared `../.env` provides the existing `VUE_APP_*` settings; no variable
renaming is needed. Only that prefix is exposed to browser code. Locale JSON
files come from `../locales`, or `src/locales` when mounted/copied by Docker.
Restart the dev server after changing environment settings.

```sh
npm run lint
npm test
npm run build
```

Build output remains in `dist`. Production containers compile at startup using
their supplied environment, then serve the result with nginx. The former Vue CLI
`i18n:report` command has been removed with its unsupported plugin.
