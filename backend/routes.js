const router = require('express').Router()
const Room = require('./models/room')
const User = require('./models/user')
const ICAL = require('ical.js')
const uid = require('uid')

function icalEventToSimpleEvent(icalEvent) {
    return {
        startDate: icalEvent.startDate.toJSDate(),
        endDate: icalEvent.endDate.toJSDate(),
        summary: icalEvent.summary,
        organizer: icalEvent.organizer,
        location: icalEvent.location,
        color: icalEvent.color
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
                conflictingEvents.push(icalEventToSimpleEvent(event))
            }
        } else if (confStart < eventEnd) {
            conflictingEvents.push(icalEventToSimpleEvent(event))
        } else {
            continue
        }
    }
    return conflictingEvents
}

function deleteEventByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        if (event.uid === uid) {
            comp.removeSubcomponent(vevent)
            return vevent
        }
    }
    return false
}


router.get('/user', async (req, res) => {
    res.send({
        email: req.user.uid,
        name: req.user.displayName
    })
})

router.post('/room', async (req, res) => {
    const room = new Room({
        name: req.body.name,
        size: req.body.size,
        description: req.body.description,
        img: req.body.img,
        color: req.body.color
    })
    try {
        const result = await room.save()
        res.send(result)
    } catch (error) {
        res.status(400).send({ message: "Unable to save room", error: error })
    }
})

router.delete('/room', async (req, res) => {
    if (req.query.name) {
        try {
            await Room.deleteOne({ name: req.query.name })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: "Unable to delete room " + req.query.name, error: error })
        }
    } else {
        res.status(400).send({ message: "Name Missing" })
    }
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
    if (new Date(req.body.startDate) < new Date(req.body.endDate)) {
        await Promise.all(req.body.rooms.map(async roomName => {
            const room = await Room.findOne({ name: roomName })
            if (room) {
                const vevent = new ICAL.Component('vevent')
                const event = new ICAL.Event(vevent)
                event.summary = req.body.summary
                event.location = room.name
                event.organizer = req.user.displayName
                event.uid = uid.uid()
                event.color = room.color
                event.startDate = ICAL.Time.fromJSDate(new Date(req.body.startDate))
                event.endDate = ICAL.Time.fromJSDate(new Date(req.body.endDate))
                if (req.body.roomService != undefined) {
                    vevent.addPropertyWithValue('x-room-service', req.body.roomService.toString().toUpperCase())
                }
                const comp = new ICAL.Component(room.ical)
                comp.addSubcomponent(vevent)
                room.markModified('ical');
                const result = await room.save()
                bookedRooms.push(result)
            }
        }))
        if (bookedRooms.length > 0) {
            res.send({ rooms: bookedRooms, startDate: req.body.startDate, endDate: req.body.endDate })
        } else {
            res.status(400).send({ message: "No Room Booked" })
        }
    } else {
        res.status(400).send({ message: "Start Date > End Date" })
    }
})

router.post('/booking/change', async (req, res) => {
    if (req.body.roomName && req.body.uid && req.body.startDate && req.body.endDate) {
        const room = await Room.findOne({ name: req.body.roomName })
        if (room) {
            const eventComp = deleteEventByUid(room.ical, req.body.uid)
            if (eventComp) {
                const conflictingEvents = getConflictingEvents(room.ical, req.body.startDate, req.body.endDate)
                if (conflictingEvents.length == 0) {
                    newEvent = new ICAL.Event(eventComp)
                    newEvent.startDate = ICAL.Time.fromJSDate(new Date(req.body.startDate))
                    newEvent.endDate = ICAL.Time.fromJSDate(new Date(req.body.endDate))
                    const comp = new ICAL.Component(room.ical)
                    comp.addSubcomponent(eventComp)
                    room.markModified('ical');
                    res.send(await room.save())
                } else {
                    res.status(400).send({message: "New Date generates conflicts.", conflictingEvents: conflictingEvents})
                }
            } else {
                res.status(400).send({ message: "No Event with uid: " + req.body.uid })
            }
        } else {
            res.status(400).send({ message: "No room found named: " + req.body.roomName })
        }
    }else{
        res.status(400).send({message: "Please provide roomName, uid, startDate and endDate."})
    }
})

router.delete('/booking/change', async (req, res) => {
    if (req.query.roomName && req.query.uid) {
        const room = await Room.findOne({ name: req.query.roomName })
        if (room) {
            const eventComp = deleteEventByUid(room.ical, req.query.uid)
            if (eventComp) {
                room.markModified('ical');
                res.send(await room.save())
            } else {
                res.status(400).send({ message: "No Event with uid: " + req.query.uid })
            }
        } else {
            res.status(400).send({ message: "No room found named: " + req.query.roomName })
        }
    }else{
        res.status(400).send({message: "Please provide roomName and uid."})
    }
})

module.exports = router;