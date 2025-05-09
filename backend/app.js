const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const session = require("express-session")
const MongoStore = require('connect-mongo');
const i18n = require('./i18n')
const cron = require('node-cron');
const auth = require('./auth')

const port = process.env.BACKEND_PORT
const url = process.env.VUE_APP_BACKEND_URL

mongoose.connect(process.env.MONGO_URL)

const app = express()

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cors({
  credentials: true,
  origin: process.env.VUE_APP_FRONTEND_URL
}))
app.use(cookierParser())

app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
  secret: new Date(Math.random * 100000).toString().toUpperCase(),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false
  },
  resave: false,
  saveUninitialized: true
}))

app.use(auth)


app.use('/api', async (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.status(401).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const routes = require('./routes/routes')
app.use('/api', routes)

app.use('/api/admin', async (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

app.use('/public', async (req, res, next) => {
  if (req.query.token === process.env.VUE_APP_ACCESS_TOKEN) {
    next();
  } else {
    return res.status(401).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const publicRoutes = require('./routes/publicRoutes')
app.use('/public', publicRoutes)

const sendServiceReminder = require('./mail/reminder')
const sendBookingEndNotification = require('./mail/notifyOnEnd')
// Cron Job every hour on the first minute
cron.schedule('1 * * * *', () => {
  sendServiceReminder()
})
// Cron Job every day at 01:00 am
cron.schedule('0 1 * * *', () => {
  sendBookingEndNotification()
})

app.listen(port, () => {
  console.log(`Backend listening at ${url}`)
})
