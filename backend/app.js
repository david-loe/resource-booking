const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const session = require("express-session")
const i18n = require('./i18n')
const cron = require('node-cron');
const User = require('./models/user')

const port = process.env.VUE_APP_BACKEND_PORT
const url = process.env.VUE_APP_URL

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
app.use(express.urlencoded({ limit: '2mb' }));
app.use(cors({
  credentials: true,
  origin: url + ':' + process.env.VUE_APP_FRONTEND_PORT
}))
app.use(cookierParser())

app.use(session({
  secret: Date(Math.random * 100000).toUpperCase(),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: false
  }
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
      const firstUser = new User({ uid: req.user.uid, isAdmin: true })
      firstUser.save()
    }
  }
  else {
    return res.status(401).send({ message: i18n.t("alerts.request.unauthorized") })
  }
})
const routes = require('./routes/routes')
app.use('/api', routes)

app.use('/api/admin', async (req, res, next) => {
  const user = await User.findOne({ uid: req.user.uid })
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

// Cron Job on 5:00 AM every day
cron.schedule('0 5 * * *', () => {
  const sendRoomServiceReminder = require('./mail/reminder')
  sendRoomServiceReminder()
})

app.listen(port, () => {
  console.log(`Backend listening at ${url}:${port}`)
})
