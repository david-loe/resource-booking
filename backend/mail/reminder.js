const mailClient = require('./client')
const i18n = require('../i18n')
const helper = require('../helper')

async function sendRoomServiceReminder() {
    if(mailClient == undefined){
        return false
    }
    const roomServiceIcal = await helper.getRoomServiceIcal()
    console.log("Reminder Mail")
}

module.exports = sendRoomServiceReminder