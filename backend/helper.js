const Room = require('./models/room')
const ICAL = require('ical.js')
const uid = require('uid')

/**
     * Return all bookings with roomservice as a ICAL Component
     * @returns {ICAL.Component} ICAL Component
     */
async function getRoomServiceIcal() {
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
}

/**
 * 
 * @param {ICAL.Component} vevent 
 * @returns Simple Event
 */
function icalEventToSimpleEvent(vevent) {
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
}

function roomToSimpleRoom(room, isPartlyBooked = false) {
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
}

/**
 * 
 * @param {Array} conflictingEvents
 * @returns Array of free Subrooms grouped by room name
 */
async function getFreeSubrooms(conflictingEvents) {
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
/**
 * 
 * @param {string} csv 
 * @param {string} separator 
 * @returns Array of JS Objects
 */
function csvToObjekt(csv, separator = '\t', arraySeparator = ', ') {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(separator);
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        if(lines[i] === ''){
            break
        }
        var currentline = lines[i].split(separator);
        for (var j = 0; j < headers.length; j++) {
            if(currentline[j].indexOf(arraySeparator) === -1){
                obj[headers[j]] = currentline[j];
            }else {
                obj[headers[j]] = currentline[j].split(arraySeparator)
            }
            
        }
        result.push(obj);
    }
    return result
}
/**
 * 
 * @param {SimpleEvent} event 
 * @returns {Object} .success returns wether successful
 */
async function book(event) {
    if (!event.location || !event.summary || !event.organizer || !event.startDate || !event.endDate || event.roomService === undefined || event.subrooms === undefined || (event.startDate >= event.endDate)) {
        return { success: false, bookedRoom: [], conflictingEvents: [] }
    }
    try {
        new Date(event.startDate)
        new Date(event.endDate)
    } catch (error) {
        return { success: false, bookedRoom: [], conflictingEvents: [], error: error}
    }
    if (typeof event.roomService === 'string' || event.roomService instanceof String){
        event.roomService = event.roomService.toLowerCase() === 'true'
    }
    if (typeof event.subrooms === 'string' || event.subrooms instanceof String){
        if(event.subrooms.toLowerCase() === 'null'){
            event.subrooms = null
        }else{
            return { success: false, bookedRoom: [], conflictingEvents: []}
        }
    }
    const room = await Room.findOne({ name: event.location })
    if (!room) {
        return { success: false, bookedRoom: [], conflictingEvents: [] }
    }
    const conflictingEvents = getConflictingEvents(room.ical, event.startDate, event.endDate)
    const freeSubooms = await getFreeSubrooms(conflictingEvents)
    var subroomsFree = false
    if (event.subrooms !== null) {
        subroomsFree = true
        for (subroom of event.subrooms) {
            if (!freeSubooms[event.location] || freeSubooms[event.location].indexOf(subroom) === -1) {
                subroomsFree = false
            }
        }
        var bookedPartly = false
        for (const subroom of room.subrooms) {
            if (event.subrooms.indexOf(subroom) === -1) {
                bookedPartly = true
            }
        }
        if (!bookedPartly) {
            event.subrooms = null
        }
    }
    if (conflictingEvents.length > 0 && !subroomsFree) {
        return { success: false, bookedRoom: [], conflictingEvents: conflictingEvents }
    }
    const vevent = new ICAL.Component('vevent')
    const icalEvent = new ICAL.Event(vevent)
    icalEvent.summary = event.summary
    icalEvent.location = event.location
    icalEvent.organizer = event.organizer
    icalEvent.color = room.color
    icalEvent.startDate = ICAL.Time.fromJSDate(new Date(event.startDate))
    icalEvent.endDate = ICAL.Time.fromJSDate(new Date(event.endDate))
    vevent.addPropertyWithValue('x-room-service', event.roomService)
    if (event.uid === undefined) {
        icalEvent.uid = uid.uid()
    } else {
        icalEvent.uid = event.uid
    }
    if (event.subrooms !== null) {
        vevent.addPropertyWithValue('x-subrooms', event.subrooms)
    }
    const comp = new ICAL.Component(room.ical)
    comp.addSubcomponent(vevent)
    room.markModified('ical');
    return { success: true, bookedRoom: await room.save(), conflictingEvents: [] }
}

function getConflictingEvents(ical, startDate, endDate) {
    const conflictingEvents = []
    const confStart = new Date(startDate)
    const confEnd = new Date(endDate)
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        const eventStart = event.startDate.toJSDate()
        const eventEnd = event.endDate.toJSDate()
        if (confStart < eventStart) {
            if (confEnd <= eventStart) {
                continue
            } else {
                conflictingEvents.push(icalEventToSimpleEvent(vevent))
            }
        } else if (confStart < eventEnd) {
            conflictingEvents.push(icalEventToSimpleEvent(vevent))
        } else {
            continue
        }
    }
    return conflictingEvents
}

module.exports = {
    getRoomServiceIcal: getRoomServiceIcal,
    icalEventToSimpleEvent: icalEventToSimpleEvent,
    roomToSimpleRoom: roomToSimpleRoom,
    getFreeSubrooms: getFreeSubrooms,
    csvToObjekt: csvToObjekt,
    book: book,
    getConflictingEvents: getConflictingEvents,
}