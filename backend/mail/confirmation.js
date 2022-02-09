const mailClient = require('./client')
const i18n = require('../i18n')

function sendConformationMail(startDate, endDate, roomNames, summary, roomService, recipientName, recipientMail) {
    if(mailClient == undefined){
        return false
    }
    const dateStringOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    startDate = new Date(startDate)
    endDate = new Date(endDate)

    var roomStr = ""
    for(const room of roomNames){
        roomStr = roomStr + room + ', '
    }
    roomStr = roomStr.slice(0, -2)

    var roomServiceStr = '❌'
    if(roomService){roomServiceStr = '✅'}
    const htmlText = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <style type="text/css"> th, td { padding: 7px; text-align: left; } body { background-color: #698996; text-align: center; padding-left: 20px; padding-right: 20px; } #heading { text-align: center; color: #FBFBFB; } #content { text-align: left; width: 100%; max-width: 600px; margin: auto; padding: 10px; background-color: #FBFBFB; } #details { margin-left: 10px; margin-right: 10px; background-color: #F7F4E5; padding: 10px; } #footer { margin-top: 40px; text-align: center; } a { text-decoration: none; font-weight: 600; color: #2A324B; } </style> </head>
        <body> <table style="width: 100%;"> <tr> <td id="heading"> <h1>` + i18n.t("mail.confirmation.heading") + `
        </h1> </td> </tr> <tr> <td> <table id="content"> <tr> <td> <p>` + i18n.t("mail.salutation", { recipient: recipientName }) + `
        </p> <p>` + i18n.t("mail.confirmation.content", { room: roomStr, count: roomNames.length }) + `
        </p> </td> </tr> <tr> <td id="details"> <h3>` + i18n.t("labels.details") + `:
        </h3> <table> <tr> <th> ` + i18n.t("labels.from") + `
        </th> <td> `+ startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) + `
        </td> </tr> <tr> <th> ` + i18n.t("labels.to") + `
        </th> <td> `+ endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) + `
        </td> </tr> <tr> <th> ` + i18n.t("labels.room") + `
        </th> <td> ` + roomStr + `
        </td> </tr> <tr> <th> ` + i18n.t("labels.summary") + `
        </th> <td> ` + summary + `
        </td> </tr> <tr> <th> ` + i18n.t("labels.roomService") + `
        </th> <td> ` + roomServiceStr + `
        </td> </tr> </table> </td> </tr> <tr> <td id="footer"> ` + i18n.t("mail.footer") + `
        <br /> <a href="`+ process.env.VUE_APP_URL + ':' + process.env.VUE_APP_FRONTEND_PORT +`"> ` + i18n.t("headlines.roomBooking") + ` 🏠
        </a> </td> </tr> </table> </td> </tr> </table> </body> </html>`
    const plainText = i18n.t("mail.confirmation.heading") + '\n\n' +
        i18n.t("mail.salutation", { recipient: recipientName }) + '\n' +
        i18n.t("mail.confirmation.content", { roomNames: roomNames, count: roomNames.length }) + '\n\n' +
        i18n.t("labels.details") + ':\n' +
        i18n.t("labels.from") + ': ' + startDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) + '\n'
        i18n.t("labels.to") + ': ' + endDate.toLocaleDateString(process.env.VUE_APP_I18N_LOCALE, dateStringOptions) + '\n'
        i18n.t("labels.room") + ': ' + roomStr + '\n'
        i18n.t("labels.roomService") + ': ' + roomServiceStr


    mailClient.sendMail({
        from: '"' + i18n.t("headlines.roomBooking") +  ' 🏠" <' + process.env.MAIL_SENDER_ADDRESS + '>', // sender address
        to: recipientMail, // list of receivers
        subject: i18n.t("mail.confirmation.heading") + ": " + summary, // Subject line
        text: plainText, // plain text body
        html: htmlText, // html body
    })
}

module.exports = sendConformationMail