const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')
const helper = require('../helper')

function sendChangeMail(oldBooking, newBooking, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const dateOld = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    newBooking.startDateStr = new Date(newBooking.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    newBooking.endDateStr = new Date(newBooking.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    oldBooking.startDateStr = new Date(oldBooking.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateOld)
    oldBooking.endDateStr = new Date(oldBooking.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateOld)

    if (newBooking.service) { newBooking.service = '✅' }
    else { newBooking.service = '❌' }
    if (oldBooking.service) { oldBooking.service = '✅' }
    else { oldBooking.service = '❌' }

    const template = fs.readFileSync('./mail/change_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, {
        i18n: i18n,
        oldBooking: oldBooking,
        newBooking: newBooking,
        recipientName: recipientName,
        url: process.env.VUE_APP_FRONTEND_URL,
        showService: process.env.VUE_APP_USE_SERVICE.toLowerCase() === 'true'
    })
    const plainText = 'Old Booking:\n' + JSON.stringify(oldBooking) + '\n\nNew Booking:\n' + JSON.stringify(newBooking)

    mailClient.sendMail({
        from: '"' + i18n.t("headlines.resourceBooking") + ' ' + i18n.t("resource.emoji") + '" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.change.heading") + ": " + oldBooking.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
        icalEvent: helper.icalEventForEmailAttachments(newBooking, 'REQUEST', recipientMail, recipientName)
    })

}
module.exports = sendChangeMail