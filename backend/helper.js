const Room = require('./models/room')
const ICAL = require('ical.js')

module.exports = {
    /**
     * Return all bookings with roomservice as a ICAL Component
     * @returns {ICAL.Component} ICAL Component
     */
    getRoomServiceIcal: async function () {
        const rooms = await Room.find({})
        const roomServiceIcal = new ICAL.Component(['vcalendar', [], []])
        for (var room of rooms) {
            const comp = new ICAL.Component(room.ical)
            for (const vevent of comp.getAllSubcomponents('vevent')) {
                if (vevent.getFirstPropertyValue('x-room-service')) {
                    roomServiceIcal.addSubcomponent(vevent)
                }
            }
        }
        return roomServiceIcal
    },

    /**
     * 
     * @param {ICAL.Component} vevent 
     * @returns Simple Event
     */
    icalEventToSimpleEvent: function (vevent) {
        const icalEvent = new ICAL.Event(vevent);
        return {
            startDate: icalEvent.startDate.toJSDate(),
            endDate: icalEvent.endDate.toJSDate(),
            summary: icalEvent.summary,
            organizer: icalEvent.organizer,
            location: icalEvent.location,
            color: icalEvent.color,
            roomService: vevent.getFirstPropertyValue('x-room-service')
        }
    }
}