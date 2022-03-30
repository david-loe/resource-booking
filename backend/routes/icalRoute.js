const router = require('express').Router()
const Resource = require('../models/resource')
const ICAL = require('ical.js')
const helper = require('../helper')
const i18n = require('../i18n')

router.get('/ical', async (req, res) => {
    if (req.query.token === process.env.VUE_APP_ICAL_TOKEN) {
        if (req.query.name) {
            if (req.query.name === "service") {
                const serviceIcal = await helper.getServiceIcal()
                res.set({ "Content-Disposition": "attachment; filename=\"" + "calendar" + ".ics\"" })
                res.send(serviceIcal.toString())

            } else {
                var resourceNames = []
                if (typeof req.query.name === 'string' || req.query.name instanceof String){
                    resourceNames = [req.query.name]
                } else {
                    resourceNames = req.query.name
                }
                var ical = 'BEGIN:VCALENDAR'
                for(const name of resourceNames){
                    const resource = await Resource.findOne({ name: name })
                    var tempString = ICAL.stringify(resource.ical)
                    if(resource){
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
        res.status(401).send({ message: i18n.t("alerts.request.unauthorized") })
    }
})

module.exports = router;