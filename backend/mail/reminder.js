const mailClient = require('./client')
const i18n = require('../i18n')
const ICAL = require('ical.js')
const helper = require('../helper')
const User = require('../models/user')
const ejs = require('ejs')
const fs = require('fs')

async function sendRoomServiceReminder() {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const roomServiceIcal = await helper.getRoomServiceIcal()
    const events = []
    const reminderMinThreshold = new Date(Date.now() + (3600 * 1000 * (parseInt(process.env.MAIL_REMINDER_TIME) - 1)))
    const reminderMaxThreshold = new Date(Date.now() + (3600 * 1000 * parseInt(process.env.MAIL_REMINDER_TIME)))
    for (const vevent of roomServiceIcal.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        if (event.startDate.toJSDate() > reminderMinThreshold && event.startDate.toJSDate() < reminderMaxThreshold) {
            const simpleEvent = helper.icalEventToSimpleEvent(vevent)
            simpleEvent.startDate = simpleEvent.startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
            simpleEvent.endDate = simpleEvent.endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
            events.push(simpleEvent)
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
        const template = fs.readFileSync('./mail/reminder_template.ejs', { encoding: 'utf-8' })
        const renderedHTML = ejs.render(template, { i18n: i18n, events: events, url: url })
        const plainText = events.toString()

        mailClient.sendMail({
            from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
            to: recipients, // list of receivers
            subject: i18n.t("headlines.roomService") + ' ' + i18n.t("mail.reminder.heading"), // Subject line
            text: plainText, // plain text body
            html: renderedHTML, // html body
        })
    }
}

module.exports = sendRoomServiceReminder