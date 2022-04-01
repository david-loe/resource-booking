const router = require('express').Router()
const Resource = require('../models/resource')
const User = require('../models/user')
const ICAL = require('ical.js')
const uid = require('uid')
const i18n = require('../i18n')
const helper = require('../helper')
const sendConformationMail = require('../mail/confirmation')
const sendChangeMail = require('../mail/change')
const sendDeletionMail = require('../mail/deletion')


function getFreeSpots(resource, startDate, endDate, minDuration = 1) {
    const frameStart = new Date(startDate)
    frameStart.setMinutes(0, 0, 0)
    const frameEnd = new Date(endDate)
    frameEnd.setMinutes(0, 0, 0)
    const comp = new ICAL.Component(resource.ical)
    const isDayFree = []
    var findEnd = frameStart
    findEnd.setHours(frameEnd.getHours())
    while (findEnd < frameEnd) {
        isDayFree.push({ free: true, subresources: null })
        findEnd = new Date(findEnd.getTime() + 24 * 60 * 60 * 1000)
    }
    var nothingFree = false
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const icalEvent = new ICAL.Event(vevent);
        const bookingStart = icalEvent.startDate.toJSDate()
        bookingStart.setMinutes(0, 0, 0)
        const bookingEnd = icalEvent.endDate.toJSDate()
        bookingEnd.setMinutes(0, 0, 0)
        if (frameStart < bookingEnd && bookingStart < frameEnd) {
            const subresources = vevent.getFirstPropertyValue('x-subresources')
            if (bookingStart < frameStart && frameEnd < bookingEnd) {
                if (subresources === null) {
                    nothingFree = true
                    break
                } else {
                    for (const day of isDayFree) {
                        day.free = false
                        day.subresources = subresources
                    }
                }
            }
            var bookingStartDay = Math.ceil((bookingStart.getTime() - frameStart.getTime()) / (24 * 60 * 60 * 1000))
            if (frameStart.getHours() < bookingStart.getHours()) {
                bookingStartDay--
            }
            if (bookingStart.getHours() < frameEnd.getHours()) {
                bookingStartDay--
            }
            var bookingEndDay = Math.ceil((bookingEnd.getTime() - frameStart.getTime()) / (24 * 60 * 60 * 1000))
            if (frameStart.getHours() < bookingEnd.getHours()) {
                bookingEndDay--
            }
            if (bookingEnd.getHours() < frameStart.getHours()) {
                bookingEndDay--
            }
            if (bookingStartDay < 0) {
                bookingStartDay = 0
            }
            if (bookingEndDay > isDayFree.length - 1) {
                bookingEndDay = isDayFree.length - 1
            }
            for (var i = bookingStartDay; i <= bookingEndDay; i++) {
                if (isDayFree[i].free) {
                    isDayFree[i].free = false
                    isDayFree[i].subresources = subresources
                } else if (isDayFree[i].subresources !== null && subresources !== null) {
                    for (const subresource of subresources) {
                        if (isDayFree[i].subresources.indexOf(subresource) === -1) {
                            isDayFree[i].subresources.push(subresource)
                        }
                    }
                }
            }
        }
    }
    const freeSpots = []
    if (!nothingFree) {
        for (var day = 0; day < isDayFree.length; day++) {
            var free = false
            if (isDayFree[day].free || isDayFree[day].subresources !== null) {
                var allSubresourcesFree = true
                var subresources = resource.subresources.slice()
                free = true
                for (var forward = day; ((forward - day) < minDuration) && forward < isDayFree.length; forward++) {
                    if (isDayFree[forward].free) {
                        continue
                    } else if (isDayFree[forward].subresources === null) {
                        free = false
                        break
                    } else {
                        for (const subresource of isDayFree[forward].subresources) {
                            const index = subresources.indexOf(subresource)
                            if (index !== -1) {
                                allSubresourcesFree = false
                                subresources.splice(index, 1)
                            }
                            if (subresources.length === 0) {
                                free = false
                                break
                            }
                        }
                    }
                }
            }
            const freeSpotStartDate = new Date(frameStart.getTime() + day * 24 * 60 * 60 * 1000)
            const freeSpotEndDate = new Date(frameStart.getTime() + (day + minDuration) * 24 * 60 * 60 * 1000)
            freeSpotEndDate.setHours(frameEnd.getHours())
            if (allSubresourcesFree) {
                subresources = null
            }
            if (free) {
                freeSpots.push({
                    startDate: freeSpotStartDate,
                    endDate: freeSpotEndDate,
                    subresources: subresources,
                })
            }

        }
    }
    return freeSpots
}

function getBookingByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const icalEvent = new ICAL.Event(vevent);
        if (icalEvent.uid === uid) {
            return helper.icalEventToSimpleBooking(vevent)
        }
    }
    return false
}

function deleteVeventByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const icalEvent = new ICAL.Event(vevent);
        if (icalEvent.uid === uid) {
            if (comp.removeSubcomponent(vevent)) {
                return vevent
            }
        }
    }
    return false
}

router.get('/user', async (req, res) => {
    var isAdmin = false;
    var isService = false;
    const user = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
    if (user) {
        isAdmin = user.isAdmin
        isService = user.isService
    } else {
        var mail = req.user[process.env.LDAP_MAIL_ATTRIBUTE]
        if (Array.isArray(mail)) {
            if (mail.length > 0) {
                mail = mail[0]
            } else {
                mail = ""
            }
        }
        const newUser = new User({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE], mail: mail })
        try {
            await newUser.save()
        } catch (error) {
            return res.status(400).send({ message: "Error while creating User" })
        }
    }
    res.send({
        name: req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE],
        isAdmin: isAdmin,
        isService: isService,
    })
})


router.get('/resource', async (req, res) => {
    const resources = await Resource.find()
    res.send({ resources: resources })
})


router.get('/resource/search', async (req, res) => {
    const endDate = new Date(req.query.endDate)
    const startDate = new Date(req.query.startDate)
    var bookingDurationInDays = 0
    if (req.query.bookingDurationInDays !== undefined) {
        bookingDurationInDays = Number(req.query.bookingDurationInDays)
    }
    const resources = await Resource.find()
    const available = []
    const unavailable = []
    if (req.query.startDate && req.query.endDate) {
        if (bookingDurationInDays > 0) {
            for (const resource of resources) {
                const freeSpots = getFreeSpots(resource, startDate, endDate, bookingDurationInDays)
                if (freeSpots.length > 0) {
                    var allSubresourcesFree = true
                    for (const freeSpot of freeSpots) {
                        if (freeSpot.subresources !== null) {
                            allSubresourcesFree = false
                        }
                    }
                    if (allSubresourcesFree) {
                        available.push({ resource: helper.resourceToSimpleResource(resource), freeSpots: freeSpots })
                    } else {
                        available.push({ resource: helper.resourceToSimpleResource(resource, true), freeSpots: freeSpots })
                    }
                } else {
                    unavailable.push({ resource: helper.resourceToSimpleResource(resource), conflictingBookings: [] })
                }
            }
        } else {
            for (const resource of resources) {
                const conflictingBookings = helper.getConflictingBookings(resource.ical, startDate, endDate)
                const freeSubresources = await helper.getFreeSubresources(conflictingBookings)
                if (conflictingBookings.length === 0) {
                    available.push(helper.resourceToSimpleResource(resource))
                } else if (freeSubresources[resource.name] && freeSubresources[resource.name].length > 0) {
                    resource.subresources = freeSubresources[resource.name]
                    available.push(helper.resourceToSimpleResource(resource, true))
                } else {
                    unavailable.push({ resource: helper.resourceToSimpleResource(resource), conflictingBookings: conflictingBookings })
                }
            }
        }
        res.send({ available: available, unavailable: unavailable })
    } else {
        res.status(400).send({ message: "Start or End Missing" })
    }
})

router.post('/booking', async (req, res) => {
    const bookedResources = []
    const bookedBookings = []
    const conflictingBookings = []
    const errors = []
    if (new Date(req.body.startDate) < new Date(req.body.endDate)) {

        await Promise.all(req.body.resources.map(async resourceName => {
            const booking = {
                startDate: new Date(req.body.startDate),
                endDate: new Date(req.body.endDate),
                summary: req.body.summary,
                organizer: req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE] + ' <' + req.user[process.env.LDAP_MAIL_ATTRIBUTE] + '>',
                resource: resourceName,
                service: req.body.service,
                subresources: null
            }
            const selectedSubresources = []
            for (const subresource of req.body.subresources) {
                if (subresource.resource === resourceName) {
                    selectedSubresources.push(subresource.subresource)
                }
            }
            if (selectedSubresources.length > 0) {
                booking.subresources = selectedSubresources
            }
            const bookingResult = await helper.book(booking)
            if (bookingResult.success) {
                bookedResources.push(bookingResult.bookedResource)
                bookedBookings.push(booking)
            } else {
                conflictingBookings.push(bookingResult.conflictingBookings)
                errors.push(bookingResult.error)
            }
        }))
        if (bookedResources.length > 0) {
            if (conflictingBookings.length === 0) {
                res.send({ resources: bookedResources, startDate: req.body.startDate, endDate: req.body.endDate })
            } else {
                res.status(409).send({ message: "Some bookings had conflicts..", errors: errors, conflictingBookings: conflictingBookings, resources: bookedResources, startDate: req.body.startDate, endDate: req.body.endDate })
            }
            sendConformationMail(bookedBookings, req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE], req.user[process.env.LDAP_MAIL_ATTRIBUTE])
        } else {
            res.status(400).send({ message: "No Resource Booked", errors: errors, conflictingBookings: conflictingBookings })
        }
    } else {
        res.status(400).send({ message: "Start Date > End Date" })
    }
})

router.delete('/booking', async (req, res) => {
    if (req.query.resource && req.query.uid) {
        const resource = await Resource.findOne({ name: req.query.resource })
        if (resource) {
            const eventComp = deleteVeventByUid(resource.ical, req.query.uid)
            if (eventComp) {
                const organizer = eventComp.getFirstPropertyValue('organizer')
                const organizerMail = organizer.match(/<([^<]*)>$/)[1]
                const organizerName = organizer.match(/^.*(?= <)/g)[0]
                if (!await helper.isUserOrganizerOrAdmin(organizer, req.user)) {
                    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
                }
                resource.markModified('ical');
                res.send(await resource.save())
                sendDeletionMail(helper.icalEventToSimpleBooking(eventComp), organizerName, organizerMail)
            } else {
                res.status(400).send({ message: "No Booking with uid: " + req.query.uid })
            }
        } else {
            res.status(400).send({ message: "No resource found named: " + req.query.resource })
        }
    } else {
        res.status(400).send({ message: "Please provide resource and uid." })
    }
})

router.get('/booking', async (req, res) => {
    if (req.query.resource && req.query.uid) {
        const resource = await Resource.findOne({ name: req.query.resource })
        if (resource) {
            const booking = getBookingByUid(resource.ical, req.query.uid)
            if (booking) {
                res.send(booking)
            } else {
                res.status(400).send({ message: "No Booking with uid: " + req.query.uid })
            }

        } else {
            res.status(400).send({ message: "No resource found named: " + req.query.resource })
        }
    } else {
        res.status(400).send({ message: "Please provide resource and uid." })
    }
})

router.post('/booking/change', async (req, res) => {
    if (req.body.old.resource && req.body.old.uid && req.body.new.startDate && req.body.new.endDate && req.body.new.resource) {
        const oldResource = await Resource.findOne({ name: req.body.old.resource })
        var newResource = oldResource;
        if (req.body.old.resource !== req.body.new.resource) {
            newResource = await Resource.findOne({ name: req.body.new.resource })
        }
        if (oldResource && newResource) {
            const eventComp = deleteVeventByUid(oldResource.ical, req.body.old.uid)
            const oldBooking = helper.icalEventToSimpleBooking(eventComp)
            if (eventComp) {
                const organizer = eventComp.getFirstPropertyValue('organizer')
                const organizerMail = organizer.match(/<([^<]*)>$/)[1]
                const organizerName = organizer.match(/^.*(?= <)/g)[0]
                if (!await helper.isUserOrganizerOrAdmin(organizer, req.user)) {
                    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
                }
                const newBooking = helper.icalEventToSimpleBooking(eventComp)
                newBooking.startDate = ICAL.Time.fromJSDate(new Date(req.body.new.startDate))
                newBooking.endDate = ICAL.Time.fromJSDate(new Date(req.body.new.endDate))
                newBooking.resource = req.body.new.resource
                if (req.body.new.summary) {
                    newBooking.summary = req.body.new.summary
                }
                if (req.body.new.service !== undefined) {
                    newBooking.service = req.body.new.service
                }
                if (req.body.new.subresources !== undefined) {
                    newBooking.subresources = req.body.new.subresources
                } else {
                    if (!newResource.isDividable) {
                        newBooking.subresources = null
                    }
                }
                const booking = await helper.book(newBooking, newResource)
                if (booking.success) {
                    res.send({ message: 'ok' })
                    sendChangeMail(oldBooking, newBooking, organizerName, organizerMail)
                    if (oldResource.name !== newResource.name) {
                        oldResource.markModified('ical')
                        oldResource.save()
                    }
                } else {
                    res.status(400).send({ message: "New Date generates conflicts.", conflictingBookings: booking.conflictingBookings, error: booking.error })
                }
            } else {
                res.status(400).send({ message: "No Booking with uid: " + req.body.old.uid })
            }
        } else {
            res.status(400).send({ message: "No resource found named: " + req.body.old.resource })
        }
    } else {
        res.status(400).send({ message: "Please provide resource, uid, startDate and endDate." })
    }
})

module.exports = router;