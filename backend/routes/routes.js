const router = require('express').Router()
const Room = require('../models/room')
const User = require('../models/user')
const ICAL = require('ical.js')
const uid = require('uid')
const i18n = require('../i18n')
const sendConformationMail = require('../mail/confirmation')

function icalEventToSimpleEvent(vevent) {
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

function getEventByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        if (event.uid === uid) {
            return icalEventToSimpleEvent(vevent)
        }
    }
    return false
}

function deleteVeventByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        if (event.uid === uid) {
            if (comp.removeSubcomponent(vevent)) {
                return vevent
            }
        }
    }
    return false
}

router.get('/user', async (req, res) => {
    var isAdmin = false;
    var isRoomService = false;
    const user = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
    if (user) {
        isAdmin = user.isAdmin
        isRoomService = user.isRoomService
    }
    res.send({
        email: req.user[process.env.LDAP_MAIL_ATTRIBUTE],
        name: req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE],
        isAdmin: isAdmin,
        isRoomService: isRoomService,
    })
})


router.get('/room', async (req, res) => {
    const rooms = await Room.find()
    res.send({ rooms: rooms })
})


router.get('/room/search', async (req, res) => {
    if (req.query.startDate && req.query.endDate) {
        const available = [];
        const unavailable = [];
        const rooms = await Room.find()
        for (const room of rooms) {
            const conflictingEvents = getConflictingEvents(room.ical, req.query.startDate, req.query.endDate)
            if (conflictingEvents.length == 0) {
                available.push(room)
            } else {
                unavailable.push({ room: room, conflictingEvents: conflictingEvents })
            }
        }
        res.send({ available: available, unavailable: unavailable })
    } else {
        res.status(400).send({ message: "Start or End Missing" })
    }
})

router.post('/booking', async (req, res) => {
    const bookedRooms = []
    const roomNames = []
    if (new Date(req.body.startDate) < new Date(req.body.endDate)) {
        const conflictingEvents = []
        await Promise.all(req.body.rooms.map(async roomName => {
            const room = await Room.findOne({ name: roomName })
            if (room) {
                roomNames.push(room.name)
                conflictingEvents.push(...getConflictingEvents(room.ical, req.body.startDate, req.body.endDate))
                const vevent = new ICAL.Component('vevent')
                const event = new ICAL.Event(vevent)
                event.summary = req.body.summary
                event.location = room.name
                event.organizer = req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE]
                event.uid = uid.uid()
                event.color = room.color
                event.startDate = ICAL.Time.fromJSDate(new Date(req.body.startDate))
                event.endDate = ICAL.Time.fromJSDate(new Date(req.body.endDate))
                if (req.body.roomService != undefined) {
                    vevent.addPropertyWithValue('x-room-service', req.body.roomService)
                }
                const comp = new ICAL.Component(room.ical)
                comp.addSubcomponent(vevent)
                room.markModified('ical');
                const result = await room.save()
                bookedRooms.push(result)
            }
        }))
        if (bookedRooms.length > 0) {
            if (conflictingEvents.length === 0) {
                res.send({ rooms: bookedRooms, startDate: req.body.startDate, endDate: req.body.endDate })
                sendConformationMail(req.body.startDate, req.body.endDate, roomNames, req.body.summary, req.body.roomService, req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE], req.user[process.env.LDAP_MAIL_ATTRIBUTE])
            } else {
                res.status(400).send({ message: "Conflict while booking", conflictingEvents: conflictingEvents })
            }
        } else {
            res.status(400).send({ message: "No Room Booked" })
        }
    } else {
        res.status(400).send({ message: "Start Date > End Date" })
    }
})

router.delete('/booking', async (req, res) => {
    if (req.query.location && req.query.uid) {
        const room = await Room.findOne({ name: req.query.location })
        if (room) {
            const eventComp = deleteVeventByUid(room.ical, req.query.uid)
            if (eventComp) {
                room.markModified('ical');
                res.send(await room.save())
            } else {
                res.status(400).send({ message: "No Event with uid: " + req.query.uid })
            }
        } else {
            res.status(400).send({ message: "No room found named: " + req.query.location })
        }
    } else {
        res.status(400).send({ message: "Please provide location and uid." })
    }
})

router.get('/booking', async (req, res) => {
    if (req.query.location && req.query.uid) {
        const room = await Room.findOne({ name: req.query.location })
        if (room) {
            const event = getEventByUid(room.ical, req.query.uid)
            if (event) {
                res.send(event)
            } else {
                res.status(400).send({ message: "No Event with uid: " + req.query.uid })
            }

        } else {
            res.status(400).send({ message: "No room found named: " + req.query.location })
        }
    } else {
        res.status(400).send({ message: "Please provide location and uid." })
    }
})

router.post('/booking/change', async (req, res) => {
    console.log(new Date(req.body.new.endDate).toString())
    console.log(new Date().getTimezoneOffset())
    if (req.body.old.location && req.body.old.uid && req.body.new.startDate && req.body.new.endDate && req.body.new.location) {
        const oldRoom = await Room.findOne({ name: req.body.old.location })
        var newRoom = oldRoom;
        if (req.body.old.location !== req.body.new.location) {
            newRoom = await Room.findOne({ name: req.body.new.location })
        }
        if (oldRoom && newRoom) {
            const eventComp = deleteVeventByUid(oldRoom.ical, req.body.old.uid)
            if (eventComp) {
                const conflictingEvents = getConflictingEvents(newRoom.ical, req.body.new.startDate, req.body.new.endDate)
                if (conflictingEvents.length == 0) {
                    if (req.body.new.roomService != undefined) {
                        eventComp.updatePropertyWithValue('x-room-service', req.body.new.roomService)
                    }
                    eventComp.updatePropertyWithValue
                    newEvent = new ICAL.Event(eventComp)
                    newEvent.startDate = ICAL.Time.fromJSDate(new Date(req.body.new.startDate))
                    newEvent.endDate = ICAL.Time.fromJSDate(new Date(req.body.new.endDate))
                    newEvent.location = req.body.new.location
                    newEvent.color = newRoom.color
                    if (req.body.new.summary) {
                        newEvent.summary = req.body.new.summary
                    }
                    const comp = new ICAL.Component(newRoom.ical)
                    comp.addSubcomponent(eventComp)
                    newRoom.markModified('ical');
                    res.send(await newRoom.save())
                    if (oldRoom.name !== newRoom.name) {
                        oldRoom.markModified('ical')
                        oldRoom.save()
                    }
                } else {
                    res.status(400).send({ message: "New Date generates conflicts.", conflictingEvents: conflictingEvents })
                }
            } else {
                res.status(400).send({ message: "No Event with uid: " + req.body.old.uid })
            }
        } else {
            res.status(400).send({ message: "No room found named: " + req.body.old.location })
        }
    } else {
        res.status(400).send({ message: "Please provide location, uid, startDate and endDate." })
    }
})

module.exports = router;