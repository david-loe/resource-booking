const router = require('express').Router()
const Room = require('./models/room')
const User = require('./models/user')
const Ical = require('ical.js')
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
        description: req.body.description
    })
    try {
        const result = await room.save()
        const content = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR"
        fs.writeFile('rooms/' + result.name + '.ical', content, err => {
            if (err) {
                console.error(err)
            }
        })
        res.send(result)
    } catch (error) {
        res.status(400).send({ message: "Unable to save room", error: error })
    }
})

router.delete('/room', async (req, res) => {
    if (req.query.name) {
        try {
            await Room.deleteOne({ name: req.query.name })
            fs.unlink('rooms/' + req.query.name + '.ical', (err) =>{
                if (err) console.log(err);
                else console.log("deleted " + req.query.name)
            })
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
    res.send({rooms: rooms})
})

module.exports = router;