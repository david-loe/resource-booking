const mailClient = require('./client')
const i18n = require('../i18n')
const ICAL = require('ical.js')
const helper = require('../helper')
const Room = require('../models/room')
const User = require('../models/user')
const ejs = require('ejs')
const fs = require('fs')

async function sendBookingEndNotification() {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const events = []
    const notifyMinThreshold = new Date().setHours(0, 0, 0, 0) // start of today
    const notifyMaxThreshold = new Date().setHours(23, 59, 59, 999) // end of today

    const rooms = await Room.find()
    for (const room of rooms) {
        const ical = new ICAL.Component(room.ical)
        for (const vevent of ical.getAllSubcomponents('vevent')) {
            const event = new ICAL.Event(vevent);
            if (event.endDate.toJSDate() > notifyMinThreshold && event.endDate.toJSDate() < notifyMaxThreshold) {
                const simpleEvent = helper.icalEventToSimpleEvent(vevent)
                simpleEvent.startDate = simpleEvent.startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
                simpleEvent.endDate = simpleEvent.endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
                events.push(simpleEvent)
            }
        }
    }
    recipients = []
    const users = await User.find()
    for (const user of users) {
        if (user.isRoomService) {
            recipients.push(user.mail)
        }
    }
    const url = process.env.VUE_APP_FRONTEND_URL

    if (events.length > 0 && recipients.length > 0) {
        const template = fs.readFileSync('./mail/notifyOnEnd_template.ejs', { encoding: 'utf-8' })
        const renderedHTML = ejs.render(template, { i18n: i18n, events: events, url: url })
        const plainText = events.toString()

        mailClient.sendMail({
            from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
            to: recipients, // list of receivers
            subject: i18n.t("mail.notifyOnEnd.heading"), // Subject line
            text: plainText, // plain text body
            html: renderedHTML, // html body
        })
    }
}

module.exports = sendBookingEndNotification