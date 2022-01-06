const router = require('express').Router()
const Room = require('./models/room')
const ICAL = require('ical.js')

router.get('/ical/:name', async (req, res) => {
    if (req.query.token === process.env.VUE_APP_ICAL_TOKEN) {
        if (req.params.name.length > 0) {
            const room = await Room.findOne({ name: req.params.name })
            if(room){
                res.set({"Content-Disposition":"attachment; filename=\""+"calendar"+".ical\""})
                const comp = new ICAL.Component(room.ical)
                res.send(ICAL.stringify(room.ical))
            }else{
                res.status(400).send({ message: "Room with name: '" + req.params.name + "' not found." })
            }
        }else{
            res.status(400).send({ message: "Name Missing" })
        }
    }else{
        res.status(401).send({ message: "unauthorized" })
    }
})

module.exports = router;