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
    url: 'ldaps://ldap:10636',
    bindDN: 'cn=admin,dc=planetexpress,dc=com',
    bindCredentials: 'GoodNewsEveryone',
    searchBase: 'ou=people,dc=planetexpress,dc=com',
    searchFilter: '(uid={{username}})',
    tlsOptions: {
      rejectUnauthorized: false
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
    maxAge: 600000,
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
  // console.log(req.user.uid)
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
