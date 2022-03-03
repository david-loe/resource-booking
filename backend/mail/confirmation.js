const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendConformationMail(bookedEvents, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const event = bookedEvents[0]
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    event.startDate = new Date(event.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    event.endDate = new Date(event.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)

    var roomStr = ""
    for (const oneEvent of bookedEvents) {
        var temp = oneEvent.location
        if(oneEvent.subrooms !== null){
            temp = temp + ' (' + oneEvent.subrooms.join(', ') + ')'
        }
        roomStr = roomStr + temp + ', '
    }
    event.location = roomStr.slice(0, -2)

    if (event.roomService) { event.roomService = '✅' }
    else { event.roomService = '❌' }
    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/confirmation_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, recipientName: recipientName, event: event, url: url })
    const plainText = i18n.t("mail.confirmation.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.confirmation.content") + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + event.startDate + '\n' +
        i18n.t("labels.to") + ': ' + event.endDate + '\n' +
        i18n.t("labels.room") + ': ' + event.room + '\n' +
        i18n.t("labels.roomService") + ': ' + event.roomService


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.confirmation.heading") + ": " + event.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
}

module.exports = sendConformationMail