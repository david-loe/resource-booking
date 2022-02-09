const mailClient = require('./client')
const i18n = require('../i18n')
const ICAL = require('ical.js')
const helper = require('../helper')
const User = require('../models/user')

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
            events.push(helper.icalEventToSimpleEvent(vevent))
        }
    }
    recipients = []
    const users = await User.find()
    for (const user of users) {
        if (user.isRoomService) {
            recipients.push(user.mail)
        }
    }
    var eventList = "<ul>"
    for (const event of events) {
        eventList = eventList + "<li><h3>" + event.location + "</h3><p>" + event.summary + "</p><p>" + event.startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) + "</p></li>"
    }
    eventList = eventList + "</ul>"
    
    const plainText = ``
    if (events.length > 0 && recipients.length > 0) {
        const htmlText = `
            <h1>` + i18n.t("mail.reminder.heading") + `</h1>
            <p>` + i18n.t("mail.reminder.content") + `</p>
            ` + eventList + `<br/>
            <p>` + i18n.t("mail.footer") + `<a href="`+ process.env.VUE_APP_URL + ':' + process.env.VUE_APP_FRONTEND_PORT +`"> ` + i18n.t("headlines.roomBooking") + ` 🏠</p>`
        mailClient.sendMail({
            from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
            to: recipients, // list of receivers
            subject: i18n.t("headlines.roomService") + ' ' + i18n.t("mail.reminder.heading"), // Subject line
            text: plainText, // plain text body
            html: htmlText, // html body
        })
    }
}

module.exports = sendRoomServiceReminder