const router = require('express').Router()
const Room = require('./models/room')
const User = require('./models/user')
const ICAL = require('ical.js')
const fs = require('fs')

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
        img: req.body.img
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
    const room = await Room.findOne({name: req.body.name})
    if(room){
        const vevent = new ICAL.Component('vevent')
        const event = new ICAL.Event(vevent)
        event.summary = req.body.summary
        event.startDate = ICAL.Time.fromDateString(req.body.startDate)
        event.endDate = ICAL.Time.fromDateString(req.body.endDate)
        const comp = new ICAL.Component(room.ical.jCal)
        comp.addSubcomponent(vevent)
        room.ical = comp.toJSON()
        room.save()
        res.send(room.ical)
    }
})

router.get('/room/find', async (req, res) => {
    if (req.query.start && req.query.end) {
        const rooms = await Room.find()
        rooms.forEach(room => {
            room.ical.getAllSubcomponents().forEach(element => {
                const events = []
                events.push(new ICAL.Event(element))
            })
            console.log(events.length)
        })
        res.send(vcalendar.getAllSubcomponents())

    } else {
        res.status(400).send({ message: "Start or End Missing" })
    }
})


module.exports = router;