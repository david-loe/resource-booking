const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const session = require("express-session")

const port = process.env.VUE_APP_BACKEND_PORT
const url = process.env.VUE_APP_URL

mongoose.connect(process.env.MONGO_URL, {}, () => {
  console.log('Successfully connected to the Database.')
})

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

app.use(express.json({limit: '2mb'}))
app.use(express.urlencoded({limit: '2mb'}));
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

app.post('/login', passport.authenticate('ldapauth', { session: true }), function (req, res) {
  res.send({ status: 'ok' })
});

app.use('/api', (req, res, next) => {
  if (req.isAuthenticated()){
    next();
  }
  else{
    return res.status(401).send({ message: "unauthorized" })
  } 
})

const routes = require('./routes')
app.use('/api', routes)

const icalRoute = require('./icalRoute')
app.use(icalRoute)

app.listen(port, () => {
  console.log(`Backend listening at ${url}:${port}`)
})
