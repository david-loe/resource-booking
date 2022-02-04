const Room = require('./models/room')
const ICAL = require('ical.js')

module.exports = {

    getRoomServiceIcal: async function () {
        const rooms = await Room.find({})
        var icals = []
        for (var room of rooms) {
            icals.push(room.ical)
        }
        const roomServiceIcal = new ICAL.Component(['vcalendar', [], []])
        for (const ical of icals) {
            const comp = new ICAL.Component(ical)
            const subcomps = comp.getAllSubcomponents()
            for (const subcomp of subcomps) {
                if (subcomp.getFirstPropertyValue('x-room-service')) {
                    roomServiceIcal.addSubcomponent(subcomp)
                }
            }
        }
        return roomServiceIcal
    }
}