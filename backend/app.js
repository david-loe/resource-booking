const express = require('express')
const mongoose = require('mongoose')
const routes = require('./routes')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const bodyParser = require('body-parser')
const session = require("express-session")

const port = process.env.BACKEND_PORT

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

app.use(express.json())
app.use(cors({
  credentials: true,
  origin: ['frontend:' + process.env.FRONTEND_PORT]
}))
app.use(cookierParser())
app.use(session({ secret: "cats" }))

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize())
app.use(passport.session());

app.post('/login', passport.authenticate('ldapauth', { session: true }), function (req, res) {
  console.log(req.user)
  res.send({ status: 'ok' })
});

app.use('/api', (req, res, next) => {
  if (req.isAuthenticated())
    next();
  else
    return res.status(400).send({message: "unauthorized"})
})

//app.use('/api', routes)


app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
