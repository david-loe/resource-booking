const mailClient = require('./client')
const i18n = require('../i18n')
const ejs = require('ejs')
const fs = require('fs')

function sendDeletionMail(deletedBooking, recipientName, recipientMail) {
    if (mailClient == undefined) {
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    deletedBooking.startDate = new Date(deletedBooking.startDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    deletedBooking.endDate = new Date(deletedBooking.endDate).toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions)
    
    if(deletedBooking.subresources !== null){
        deletedBooking.resource = deletedBooking.resource + ' (' + deletedBooking.subresources.join(', ') + ')'
    }
    

    if (deletedBooking.service) { deletedBooking.service = '✅' }
    else { deletedBooking.service = '❌' }
    const url = process.env.VUE_APP_FRONTEND_URL

    const template = fs.readFileSync('./mail/deletion_template.ejs', { encoding: 'utf-8' })
    const renderedHTML = ejs.render(template, { i18n: i18n, recipientName: recipientName, booking: deletedBooking, url: url })
    const plainText = i18n.t("mail.deletion.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.deletion.content") + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + deletedBooking.startDate + '\n' +
        i18n.t("labels.to") + ': ' + deletedBooking.endDate + '\n' +
        i18n.t("labels.resource") + ': ' + deletedBooking.resource + '\n' +
        i18n.t("labels.service") + ': ' + deletedBooking.service


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.resourceBooking") + ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.deletion.heading") + ": " + deletedBooking.summary, // Subject line
        text: plainText, // plain text body
        html: renderedHTML, // html body
    })
}

module.exports = sendDeletionMail