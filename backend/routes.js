const router = require('express').Router()
const Room = require('./models/room')
const User = require('./models/user')
const ICAL = require('ical.js')

function hasConflict(ical, startDate, endDate) {
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
                return true
            }
        } else if (confStart < eventEnd) {
            return true
        } else {
            continue
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
            res.send({ status: 'ok' })
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

router.post('/booking', async (req, res) => {
    const bookedRooms = []
    if (new Date(req.body.startDate) < new Date(req.body.endDate)) {
        await Promise.all(req.body.rooms.map(async roomName => {
            const room = await Room.findOne({ name: roomName })
            if (room) {
                const vevent = new ICAL.Component('vevent')
                const event = new ICAL.Event(vevent)
                event.summary = req.body.summary
                event.location = room.name;
                event.startDate = ICAL.Time.fromDateTimeString(req.body.startDate)
                event.endDate = ICAL.Time.fromDateTimeString(req.body.endDate)
                if(room.color){
                    vevent.addPropertyWithValue('color', room.color)
                }
                const comp = new ICAL.Component(room.ical)
                comp.addSubcomponent(vevent)
                room.markModified('ical');
                const result = await room.save()
                bookedRooms.push(result)
            }
        }))
        if (bookedRooms.length > 0) {
            res.send(bookedRooms)
        } else {
            res.status(400).send({ message: "No Room Booked" })
        }
    } else {
        res.status(400).send({ message: "Start Date > End Date" })
    }
})

router.get('/room/search', async (req, res) => {
    if (req.query.startDate && req.query.endDate) {
        const available = [];
        const unavailable = [];
        const rooms = await Room.find()
        rooms.forEach(room => {
            if (hasConflict(room.ical, req.query.startDate, req.query.endDate)) {
                unavailable.push(room)
            } else {
                available.push(room)
            }
        })
        res.send({ available: available, unavailable: unavailable })
    } else {
        res.status(400).send({ message: "Start or End Missing" })
    }
})


module.exports = router;