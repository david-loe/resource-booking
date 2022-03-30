const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const session = require("express-session")
const MongoStore = require('connect-mongo');
const i18n = require('./i18n')
const cron = require('node-cron');
const User = require('./models/user')

const port = process.env.BACKEND_PORT
const url = process.env.VUE_APP_BACKEND_URL

mongoose.connect(process.env.MONGO_URL, {}, () => {
  console.log(i18n.t("alerts.db.success"))
})

// Get LDAP credentials from ENV
passport.use(new LdapStrategy({
  server: {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_BINDDN,
    bindCredentials: process.env.LDAP_BINDCREDENTIALS,
    searchBase: process.env.LDAP_SEARCHBASE,
    searchFilter: process.env.LDAP_SEARCHFILTER,
    tlsOptions: {
      requestCert: process.env.LDAP_TLS_REQUESTCERT.toLowerCase() === 'true',
      rejectUnauthorized: process.env.LDAP_TLS_REJECTUNAUTHORIZED.toLowerCase() === 'true'
    }
  },
}));

const app = express()

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cors({
  credentials: true,
  origin: process.env.VUE_APP_FRONTEND_URL
}))
app.use(cookierParser())

app.use(session({
  store: MongoStore.create(mongoose.connection),
  secret: new Date(Math.random * 100000).toString().toUpperCase(),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false
  },
  resave: false,
  saveUninitialized: true
}))

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize())
app.use(passport.session());

app.post('/login', passport.authenticate('ldapauth', { session: true }), async (req, res) => {
  res.send({ status: 'ok' })
});

app.use('/api', async (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    // Add user as admin if no admin exists
    if ((await User.find({ isAdmin: true })).length === 0) {
      const currentUser = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
      if(currentUser){
        currentUser.isAdmin = true
        currentUser.save()
      }else{
        const firstUser = new User({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE], isAdmin: true, mail: req.user[process.env.LDAP_MAIL_ATTRIBUTE] })
        firstUser.save()
      }
      
    }
  }
  else {
    return res.status(401).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const routes = require('./routes/routes')
app.use('/api', routes)

app.use('/api/admin', async (req, res, next) => {
  const user = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
  if (user && user.isAdmin) {
    next();
  }
  else {
    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

const icalRoute = require('./routes/icalRoute')
app.use(icalRoute)

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
