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
            uid: icalEvent.uid,
            roomService: vevent.getFirstPropertyValue('x-room-service'),
            subrooms: vevent.getFirstPropertyValue('x-subrooms')
        }
    },

    roomToSimpleRoom: function (room, isPartlyBooked = false) {
        return {
            name: room.name,
            description: room.description,
            size: room.size,
            img: room.img,
            isDividable: room.isDividable,
            subrooms: room.subrooms,
            color: room.color,
            isPartlyBooked: isPartlyBooked
        }
    },

    /**
     * 
     * @param {Array} conflictingEvents
     * @returns Array of free Subrooms grouped by room name
     */
    getFreeSubrooms: async function (conflictingEvents) {
        const freeSubrooms = {}
        for (const event of conflictingEvents) {
            if (event.subrooms !== null) {
                if (!freeSubrooms[event.location]) {
                    const room = await Room.findOne({ name: event.location })
                    freeSubrooms[event.location] = room.subrooms
                }
                for (const subroom of event.subrooms) {
                    const index = freeSubrooms[event.location].indexOf(subroom)
                    if (index !== -1) {
                        freeSubrooms[event.location].splice(index, 1)
                    }
                }

            }
        }
        return freeSubrooms
    }
}