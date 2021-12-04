const express = require('express')
const mongoose = require('mongoose')
const routes = require('./routes')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const bodyParser = require('body-parser')

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize())

app.post('/login', passport.authenticate('ldapauth', { session: false }), function (req, res) {
  res.send({ status: 'ok' })
});

//app.use('/api', routes)


app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
