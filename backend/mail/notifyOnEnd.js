const mailClient = require('./client')
const i18n = require('../i18n')
const ICAL = require('ical.js')
const helper = require('../helper')
const Resource = require('../models/resource')
const User = require('../models/user')
const ejs = require('ejs')
const fs = require('fs')

async function sendBookingEndNotification() {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const bookings = []
    const notifyMinThreshold = new Date().setHours(0, 0, 0, 0) // start of today
    const notifyMaxThreshold = new Date().setHours(23, 59, 59, 999) // end of today

    const resources = await Resource.find()
    for (const resource of resources) {
        const ical = new ICAL.Component(resource.ical)
        for (const vevent of ical.getAllSubcomponents('vevent')) {
            const icalEvent = new ICAL.Event(vevent);
            if (icalEvent.endDate.toJSDate() > notifyMinThreshold && icalEvent.endDate.toJSDate() < notifyMaxThreshold) {
                const simpleBooking = helper.icalEventToSimpleBooking(vevent)
                simpleBooking.startDate = simpleBooking.startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
                simpleBooking.endDate = simpleBooking.endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
                bookings.push(simpleBooking)
            }
        }
    }
    recipients = []
    const users = await User.find()
    for (const user of users) {
        if (user.isService) {
            recipients.push(user.mail)
        }
    }
    const url = process.env.VUE_APP_FRONTEND_URL

    if (bookings.length > 0 && recipients.length > 0) {
        const template = fs.readFileSync('./mail/notifyOnEnd_template.ejs', { encoding: 'utf-8' })
        const renderedHTML = ejs.render(template, { i18n: i18n, bookings: bookings, url: url })
        const plainText = bookings.toString()

        mailClient.sendMail({
            from: '"' + i18n.t("headlines.resourceBooking") + ' ' + i18n.t("resource.emoji") + '" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
            to: recipients, // list of receivers
            subject: i18n.t("mail.notifyOnEnd.heading"), // Subject line
            text: plainText, // plain text body
            html: renderedHTML, // html body
        })
    }
}

module.exports = sendBookingEndNotification