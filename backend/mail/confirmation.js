const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendConformationMail(startDate, endDate, roomNames, summary, roomService, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    startDate = new Date(startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    endDate = new Date(endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)

    var roomStr = ""
    for (const room of roomNames) {
        roomStr = roomStr + room + ', '
    }
    roomStr = roomStr.slice(0, -2)

    var roomServiceStr = '❌'
    if (roomService) { roomServiceStr = '✅' }
    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/confirmation_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, recipientName: recipientName, roomStr: roomStr, roomNames: roomNames, startDate: startDate, endDate: endDate, summary: summary, roomServiceStr: roomServiceStr, url: url })
    const plainText = i18n.t("mail.confirmation.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.confirmation.content", { roomNames: roomNames, count: roomNames.length }) + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + startDate + '\n' +
        i18n.t("labels.to") + ': ' + endDate + '\n' +
        i18n.t("labels.room") + ': ' + roomStr + '\n' +
        i18n.t("labels.roomService") + ': ' + roomServiceStr


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.confirmation.heading") + ": " + summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
}

module.exports = sendConformationMail