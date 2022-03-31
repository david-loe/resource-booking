const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendConformationMail(bookedBookings, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const booking = bookedBookings[0]
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    booking.startDate = new Date(booking.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    booking.endDate = new Date(booking.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)

    var resourceStr = ""
    for (const oneBooking of bookedBookings) {
        var temp = oneBooking.resource
        if(oneBooking.subresources !== null){
            temp = temp + ' (' + oneBooking.subresources.join(', ') + ')'
        }
        resourceStr = resourceStr + temp + ', '
    }
    booking.resource = resourceStr.slice(0, -2)

    if (booking.service) { booking.service = '✅' }
    else { booking.service = '❌' }
    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/confirmation_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, recipientName: recipientName, booking: booking, url: url })
    const plainText = i18n.t("mail.confirmation.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.confirmation.content") + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + booking.startDate + '\n' +
        i18n.t("labels.to") + ': ' + booking.endDate + '\n' +
        i18n.t("labels.resource") + ': ' + booking.resource + '\n' +
        i18n.t("labels.service") + ': ' + booking.service


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.resourceBooking") + ' ' + i18n.t("resource.emoji") + '" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.confirmation.heading") + ": " + booking.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
}

module.exports = sendConformationMail