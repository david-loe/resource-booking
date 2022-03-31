const mailClient = require('./client')
const i18n = require('../i18n')
const ICAL = require('ical.js')
const helper = require('../helper')
const User = require('../models/user')
const ejs = require('ejs')
const fs = require('fs')

async function sendServiceReminder() {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const serviceIcal = await helper.getServiceIcal()
    const bookings = []
    const reminderMinThreshold = new Date(Date.now() + (3600 * 1000 * (parseInt(process.env.MAIL_REMINDER_TIME) - 1)))
    const reminderMaxThreshold = new Date(Date.now() + (3600 * 1000 * parseInt(process.env.MAIL_REMINDER_TIME)))
    for (const vevent of serviceIcal.getAllSubcomponents('vevent')) {
        const icalEvent = new ICAL.Event(vevent);
        if (icalEvent.startDate.toJSDate() > reminderMinThreshold && icalEvent.startDate.toJSDate() < reminderMaxThreshold) {
            const simpleBooking = helper.icalEventToSimpleBooking(vevent)
            simpleBooking.startDate = simpleBooking.startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
            simpleBooking.endDate = simpleBooking.endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
            bookings.push(simpleBooking)
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
        const template = fs.readFileSync('./mail/reminder_template.ejs', { encoding: 'utf-8' })
        const renderedHTML = ejs.render(template, { i18n: i18n, bookings: bookings, url: url })
        const plainText = bookings.toString()

        mailClient.sendMail({
            from: '"' + i18n.t("headlines.resourceBooking") + ' ' + i18n.t("resource.emoji") + '" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
            to: recipients, // list of receivers
            subject: i18n.t("mail.reminder.heading"), // Subject line
            text: plainText, // plain text body
            html: renderedHTML, // html body
        })
    }
}

module.exports = sendServiceReminder