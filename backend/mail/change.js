const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendChangeMail(oldEvent, newEvent, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const dateOld = {year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    newEvent.startDate = new Date(newEvent.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    newEvent.endDate = new Date(newEvent.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    oldEvent.startDate = new Date(oldEvent.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateOld)
    oldEvent.endDate = new Date(oldEvent.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateOld)

    if (newEvent.roomService) { newEvent.roomService = '✅' }
    else {newEvent.roomService = '❌'}
    if(oldEvent.roomService) { oldEvent.roomService = '✅' }
    else {oldEvent.roomService = '❌'}

    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/change_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, oldEvent: oldEvent, newEvent: newEvent, recipientName: recipientName, url: url})
    const plainText = 'Old Event:\n' + JSON.stringify(oldEvent) + '\n\nNew Event:\n' + JSON.stringify(newEvent)

    mailClient.sendMail({
        from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.change.heading") + ": " + oldEvent.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
    
}
module.exports = sendChangeMail