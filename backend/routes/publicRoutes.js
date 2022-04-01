const router = require('express').Router()
const Resource = require('../models/resource')
const ICAL = require('ical.js')
const helper = require('../helper')
const i18n = require('../i18n')

router.get('/ical', async (req, res) => {
    if (req.query.name) {
        if (req.query.name === "service") {
            const serviceIcal = await helper.getServiceIcal()
            res.set({ "Content-Disposition": "attachment; filename=\"" + "calendar" + ".ics\"" })
            res.send(serviceIcal.toString())
        } else {
            var resourceNames = []
            if (typeof req.query.name === 'string' || req.query.name instanceof String) {
                resourceNames = [req.query.name]
            } else {
                resourceNames = req.query.name
            }
            var ical = 'BEGIN:VCALENDAR'
            for (const name of resourceNames) {
                const resource = await Resource.findOne({ name: name })
                var tempString = ICAL.stringify(resource.ical)
                if (resource) {
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
})

router.get('/availability', async (req, res) => {
    var resources = []
    if (!req.query.resource) {
        resources = await Resource.find()
    } else if (typeof req.query.resource === 'string' || req.query.resource instanceof String) {
        resources = await Resource.findOne({ name: req.query.resource })
    } else {
        resources = await Resource.find({ name: { $in: req.query.resource } })
    }
    const startDate = new Date()
    const endDate = new Date().setHours(23, 59, 59, 999) // end of today
    const partlyAvailable = []
    const available = []
    const unavailable = []
    for (const resource of resources) {
        const conflictingBookings = helper.getConflictingBookings(resource.ical, startDate, endDate)
        const freeSubresources = await helper.getFreeSubresources(conflictingBookings)
        if (conflictingBookings.length === 0) {
            available.push(helper.resourceToSimpleResource(resource))
        } else if (freeSubresources[resource.name] && freeSubresources[resource.name].length > 0) {
            resource.subresources = freeSubresources[resource.name]
            available.push(helper.resourceToSimpleResource(resource, true))
        } else if (conflictingBookings.length === 1) {
            if(conflictingBookings[0].conflictCode !== 1){
                partlyAvailable.push({ resource: helper.resourceToSimpleResource(resource), conflictingBookings: conflictingBookings })
            }else{
                unavailable.push({ resource: helper.resourceToSimpleResource(resource), conflictingBookings: conflictingBookings })
            }
        }else {
            partlyAvailable.push({ resource: helper.resourceToSimpleResource(resource), conflictingBookings: conflictingBookings })
        }
    }
    res.send({ available: available, partlyAvailable: partlyAvailable, unavailable: unavailable })
})

module.exports = router;