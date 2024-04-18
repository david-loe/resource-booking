const passport = require('passport')
const LdapStrategy = require('passport-ldapauth')
const MicrosoftStrategy = require('passport-microsoft').Strategy
const User = require('./models/user.js')
const express = require('express')
const router = express.Router()

const useLDAP = process.env.VUE_APP_AUTH_USE_LDAP.toLocaleLowerCase() === 'true'
const useMicrosoft = process.env.VUE_APP_AUTH_USE_MS_AZURE.toLocaleLowerCase() === 'true'


function addAdminIfNone(user) {
  User.find({ isAdmin: true }).then((docs) => {
    if (docs.length == 0) {
      user.isAdmin = true
      user.save()
    }
  })
}
// Get LDAP credentials from ENV
if (useLDAP) {
  passport.use(
    new LdapStrategy(
      {
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
        }
      },
      async function (ldapUser, cb) {
        var user = await User.findOne({ 'fk.ldapauth': ldapUser[process.env.LDAP_UID_ATTRIBUTE] })
        var mail = ldapUser[process.env.LDAP_MAIL_ATTRIBUTE]
        if (Array.isArray(mail)) {
          if (mail.length > 0) {
            mail = mail[0]
          } else {
            mail = undefined
          }
        }
        if (!user && mail) {
          user = await User.findOne({ mail: mail })
        }
        const newUser = {
          fk: { ldapauth: ldapUser[process.env.LDAP_UID_ATTRIBUTE] },
          mail: mail,
          name: ldapUser[process.env.LDAP_GIVENNAME_ATTRIBUTE] + ' ' + ldapUser[process.env.LDAP_SURNAME_ATTRIBUTE]
        }
        if (!user) {
          user = new User(newUser)
        } else {
          Object.assign(user.fk, newUser.fk)
          delete newUser.fk
          Object.assign(user, newUser)
        }
        try {
          await user.save()
          addAdminIfNone(user)
          cb(null, user)
        } catch (error) {
          cb(error)
        }
      }
    )
  )
}

if (useMicrosoft) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MS_AZURE_CLIENT_ID,
        clientSecret: process.env.MS_AZURE_CLIENT_SECRET,
        callbackURL: process.env.VUE_APP_BACKEND_URL + '/auth/microsoft/callback',
        tenant: process.env.MS_AZURE_TENANT,
        scope: ['user.read']
      },
      async function (accessToken, refreshToken, profile, verified) {
        var user = await User.findOne({ 'fk.microsoft': profile._json.id })
        var mail = profile._json.mail
        if (!user && mail) {
          user = await User.findOne({ mail: mail })
        }
        const newUser = {
          fk: { microsoft: profile._json.id },
          mail: mail,
          name: profile._json.givenName ? (profile._json.givenName + ' ' + profile._json.surname) : profile._json.displayName
        }
        if (!user) {
          user = new User(newUser)
        } else {
          Object.assign(user.fk, newUser.fk)
          delete newUser.fk
          Object.assign(user, newUser)
        }
        try {
          await user.save()
          verified(null, user)
          addAdminIfNone(user)
        } catch (error) {
          verified(error)
        }
      }
    )
  )
}

passport.serializeUser(async (user, cb) => {
  cb(null, { _id: user._id })
})

passport.deserializeUser(async (sessionUser, cb) => {
  const user = await User.findOne({ _id: sessionUser._id })
  if (user) {
    cb(null, user)
  } else {
    cb(new Error('No User found with id: ' + sessionUser._id))
  }
})

router.use(passport.initialize())
router.use(passport.session())

if (useLDAP) {
  router.post('/auth/ldapauth', passport.authenticate('ldapauth', { session: true }), async (req, res) => {
    res.send({ status: 'ok' })
  })
}

if (useMicrosoft) {
  router.get('/auth/microsoft', (req, res, next) => {
    const redirect = req.query.redirect
    const state = req.query.redirect ? Buffer.from(JSON.stringify({ redirect })).toString('base64') : undefined
    passport.authenticate('microsoft', { state: state })(req, res, next)
  })
  router.get('/auth/microsoft/callback', passport.authenticate('microsoft'), (req, res) => {
    try {
      const state = req.query.state
      const { redirect } = JSON.parse(Buffer.from(state, 'base64').toString())
      if (typeof redirect === 'string' && redirect.startsWith('/')) {
        return res.redirect(process.env.VUE_APP_FRONTEND_URL + redirect)
      }
    } catch {
      // just redirect normally below
    }
    res.redirect(process.env.VUE_APP_FRONTEND_URL)
  })
}

module.exports = router
