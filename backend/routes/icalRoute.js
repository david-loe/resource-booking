const router = require('express').Router()
const Room = require('../models/room')
const ICAL = require('ical.js')

router.get('/ical', async (req, res) => {
    if (req.query.token === process.env.VUE_APP_ICAL_TOKEN) {
        if (req.query.name) {
            if (req.query.name === "roomservice") {
                const rooms = await Room.find({})
                var icals = []
                for(var room of rooms){
                    icals.push(room.ical)
                }
                const roomServiceIcal = new ICAL.Component(['vcalendar', [], []])
                for(const ical of icals){
                    const comp = new ICAL.Component(ical)
                    const subcomps = comp.getAllSubcomponents()
                    for(const subcomp of subcomps){
                        if(subcomp.getFirstPropertyValue('x-room-service')){
                            roomServiceIcal.addSubcomponent(subcomp)
                        }
                    }
                }
                res.set({ "Content-Disposition": "attachment; filename=\"" + "calendar" + ".ics\"" })
                res.send(roomServiceIcal.toString())

            } else {
                var roomNames = []
                if (typeof req.query.name === 'string' || req.query.name instanceof String){
                    roomNames = [req.query.name]
                } else {
                    roomNames = req.query.name
                }
                var ical = 'BEGIN:VCALENDAR'
                for(const name of roomNames){
                    const room = await Room.findOne({ name: name })
                    var tempString = ICAL.stringify(room.ical)
                    if(room){
                        ical = ical + '\n' + tempString.substring(15, tempString.length - 15)
                    }
                }
                ical = ical + 'END:VCALENDAR'
                res.set({ "Content-Disposition": "attachment; filename=\"" + "calendar" + ".ics\"" })
                res.send(ical)
                
            }

        } else {
            res.status(400).send({ message: "Name Missing" })
        }
    } else {
        res.status(401).send({ message: "unauthorized" })
    }
})

module.exports = router;