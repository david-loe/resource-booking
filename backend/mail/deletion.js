const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendDeletionMail(deletedEvent, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    deletedEvent.startDate = new Date(deletedEvent.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    deletedEvent.endDate = new Date(deletedEvent.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    
    if(deletedEvent.subrooms !== null){
        deletedEvent.location = deletedEvent.location + ' (' + deletedEvent.subrooms.join(', ') + ')'
    }
    

    if (deletedEvent.roomService) { deletedEvent.roomService = '✅' }
    else { deletedEvent.roomService = '❌' }
    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/deletion_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, recipientName: recipientName, event: deletedEvent, url: url })
    const plainText = i18n.t("mail.deletion.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.deletion.content") + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + deletedEvent.startDate + '\n' +
        i18n.t("labels.to") + ': ' + deletedEvent.endDate + '\n' +
        i18n.t("labels.room") + ': ' + deletedEvent.room + '\n' +
        i18n.t("labels.roomService") + ': ' + deletedEvent.roomService


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.roomBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.deletion.heading") + ": " + deletedEvent.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
}

module.exports = sendDeletionMail