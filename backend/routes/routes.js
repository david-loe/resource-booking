const router = require('express').Router()
const Room = require('../models/room')
const User = require('../models/user')
const ICAL = require('ical.js')
const uid = require('uid')
const i18n = require('../i18n')
const helper = require('../helper')
const sendConformationMail = require('../mail/confirmation')
const sendChangeMail = require('../mail/change')
const sendDeletionMail = require('../mail/deletion')


function getFreeSpots(room, startDate, endDate, minDuration = 1) {
    const frameStart = new Date(startDate)
    frameStart.setMinutes(0, 0, 0)
    const frameEnd = new Date(endDate)
    frameEnd.setMinutes(0, 0, 0)
    const comp = new ICAL.Component(room.ical)
    const isDayFree = []
    var findEnd = frameStart
    findEnd.setHours(frameEnd.getHours())
    while (findEnd < frameEnd) {
        isDayFree.push({ free: true, subrooms: null })
        findEnd = new Date(findEnd.getTime() + 24 * 60 * 60 * 1000)
    }
    var nothingFree = false
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        const eventStart = event.startDate.toJSDate()
        eventStart.setMinutes(0, 0, 0)
        const eventEnd = event.endDate.toJSDate()
        eventEnd.setMinutes(0, 0, 0)
        if (frameStart < eventEnd && eventStart < frameEnd) {
            const subrooms = vevent.getFirstPropertyValue('x-subrooms')
            if (eventStart < frameStart && frameEnd < eventEnd) {
                if (subrooms === null) {
                    nothingFree = true
                    break
                } else {
                    for (const day of isDayFree) {
                        day.free = false
                        day.subrooms = subrooms
                    }
                }
            }
            var eventStartDay = Math.ceil((eventStart.getTime() - frameStart.getTime()) / (24 * 60 * 60 * 1000))
            if (frameStart.getHours() < eventStart.getHours()) {
                eventStartDay--
            }
            if (eventStart.getHours() < frameEnd.getHours()) {
                eventStartDay--
            }
            var eventEndDay = Math.ceil((eventEnd.getTime() - frameStart.getTime()) / (24 * 60 * 60 * 1000))
            if (frameStart.getHours() < eventEnd.getHours()) {
                eventEndDay--
            }
            if (eventEnd.getHours() < frameStart.getHours()) {
                eventEndDay--
            }
            if (eventStartDay < 0) {
                eventStartDay = 0
            }
            if (eventEndDay > isDayFree.length - 1) {
                eventEndDay = isDayFree.length - 1
            }
            for (var i = eventStartDay; i <= eventEndDay; i++) {
                if (isDayFree[i].free) {
                    isDayFree[i].free = false
                    isDayFree[i].subrooms = subrooms
                } else if (isDayFree[i].subrooms !== null && subrooms !== null) {
                    for (const subroom of subrooms) {
                        if (isDayFree[i].subrooms.indexOf(subroom) === -1) {
                            isDayFree[i].subrooms.push(subroom)
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
            if (isDayFree[day].free || isDayFree[day].subrooms !== null) {
                var allSubroomsFree = true
                var subrooms = room.subrooms.slice()
                free = true
                for (var forward = day; ((forward - day) < minDuration) && forward < isDayFree.length; forward++) {
                    if (isDayFree[forward].free) {
                        continue
                    } else if (isDayFree[forward].subrooms === null) {
                        free = false
                        break
                    } else {
                        for (const subroom of isDayFree[forward].subrooms) {
                            const index = subrooms.indexOf(subroom)
                            if (index !== -1) {
                                allSubroomsFree = false
                                subrooms.splice(index, 1)
                            }
                            if (subrooms.length === 0) {
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
            if (allSubroomsFree) {
                subrooms = null
            }
            if (free) {
                freeSpots.push({
                    startDate: freeSpotStartDate,
                    endDate: freeSpotEndDate,
                    subrooms: subrooms,
                })
            }

        }
    }
    return freeSpots
}

function getEventByUid(ical, uid) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const event = new ICAL.Event(vevent);
        if (event.uid === uid) {
            return helper.icalEventToSimpleEvent(vevent)
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
        isRoomService: isRoomService,
    })
})


router.get('/room', async (req, res) => {
    const rooms = await Room.find()
    res.send({ rooms: rooms })
})


router.get('/room/search', async (req, res) => {
    const endDate = new Date(req.query.endDate)
    const startDate = new Date(req.query.startDate)
    var bookingDurationInDays = 0
    if (req.query.bookingDurationInDays !== undefined) {
        bookingDurationInDays = Number(req.query.bookingDurationInDays)
    }
    const rooms = await Room.find()
    const available = []
    const unavailable = []
    if (req.query.startDate && req.query.endDate) {
        if (bookingDurationInDays > 0) {
            for (const room of rooms) {
                const freeSpots = getFreeSpots(room, startDate, endDate, bookingDurationInDays)
                if (freeSpots.length > 0) {
                    var allSubroomsFree = true
                    for (const freeSpot of freeSpots) {
                        if (freeSpot.subrooms !== null) {
                            allSubroomsFree = false
                        }
                    }
                    if (allSubroomsFree) {
                        available.push({ room: helper.roomToSimpleRoom(room), freeSpots: freeSpots })
                    } else {
                        available.push({ room: helper.roomToSimpleRoom(room, true), freeSpots: freeSpots })
                    }
                } else {
                    unavailable.push({ room: helper.roomToSimpleRoom(room), conflictingEvents: [] })
                }
            }
        } else {
            for (const room of rooms) {
                const conflictingEvents = helper.getConflictingEvents(room.ical, startDate, endDate)
                const freeSubrooms = await helper.getFreeSubrooms(conflictingEvents)
                if (conflictingEvents.length === 0) {
                    available.push(helper.roomToSimpleRoom(room))
                } else if (freeSubrooms[room.name] && freeSubrooms[room.name].length > 0) {
                    room.subrooms = freeSubrooms[room.name]
                    available.push(helper.roomToSimpleRoom(room, true))
                } else {
                    unavailable.push({ room: helper.roomToSimpleRoom(room), conflictingEvents: conflictingEvents })
                }
            }
        }
        res.send({ available: available, unavailable: unavailable })
    } else {
        res.status(400).send({ message: "Start or End Missing" })
    }

})

router.post('/booking', async (req, res) => {
    const bookedRooms = []
    const bookedEvents = []
    if (new Date(req.body.startDate) < new Date(req.body.endDate)) {
        const conflictingEvents = []
        await Promise.all(req.body.rooms.map(async roomName => {
            const event = {
                startDate: new Date(req.body.startDate),
                endDate: new Date(req.body.endDate),
                summary: req.body.summary,
                organizer: req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE] + ' <' + req.user[process.env.LDAP_MAIL_ATTRIBUTE] + '>',
                location: roomName,
                roomService: req.body.roomService,
                subrooms: null
            }
            const selectedSubrooms = []
            for (const subroom of req.body.subrooms) {
                if (subroom.room === roomName) {
                    selectedSubrooms.push(subroom.subroom)
                }
            }
            if (selectedSubrooms.length > 0) {
                event.subrooms = selectedSubrooms
            }
            const booking = await helper.book(event)
            if (booking.success) {
                bookedRooms.push(booking.bookedRoom)
                bookedEvents.push(event)
            } else {
                conflictingEvents.push(booking.conflictingEvents)
            }
        }))
        if (bookedRooms.length > 0) {
            if (conflictingEvents.length === 0) {
                res.send({ rooms: bookedRooms, startDate: req.body.startDate, endDate: req.body.endDate })
            } else {
                res.status(409).send({ message: "Some bookings had conflicts..", conflictingEvents: conflictingEvents, rooms: bookedRooms, startDate: req.body.startDate, endDate: req.body.endDate })
            }
            sendConformationMail(bookedEvents, req.user[process.env.LDAP_DISPLAYNAME_ATTRIBUTE], req.user[process.env.LDAP_MAIL_ATTRIBUTE])
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
                const user = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
                var isAdmin = false;
                if (user) {
                    isAdmin = user.isAdmin
                }
                const organizer = eventComp.getFirstPropertyValue('organizer')
                const organizerMail = organizer.match(/<([^<]*)>$/)[1]
                const organizerName = organizer.match(/^.*(?= <)/g)[0]
                if (organizer.indexOf(req.user[process.env.LDAP_MAIL_ATTRIBUTE]) === -1 && !isAdmin) {
                    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
                }
                room.markModified('ical');
                res.send(await room.save())
                sendDeletionMail(helper.icalEventToSimpleEvent(eventComp), organizerName, organizerMail)
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
    if (req.body.old.location && req.body.old.uid && req.body.new.startDate && req.body.new.endDate && req.body.new.location) {
        const oldRoom = await Room.findOne({ name: req.body.old.location })
        var newRoom = oldRoom;
        if (req.body.old.location !== req.body.new.location) {
            newRoom = await Room.findOne({ name: req.body.new.location })
        }
        if (oldRoom && newRoom) {
            const eventComp = deleteVeventByUid(oldRoom.ical, req.body.old.uid)
            const oldComp = ICAL.Component.fromString(eventComp.toString())
            if (eventComp) {
                const user = await User.findOne({ uid: req.user[process.env.LDAP_UID_ATTRIBUTE] })
                var isAdmin = false;
                if (user) {
                    isAdmin = user.isAdmin
                }
                const organizer = eventComp.getFirstPropertyValue('organizer')
                const organizerMail = organizer.match(/<([^<]*)>$/)[1]
                const organizerName = organizer.match(/^.*(?= <)/g)[0]
                if (organizer.indexOf(req.user[process.env.LDAP_MAIL_ATTRIBUTE]) === -1 && !isAdmin) {
                    return res.status(403).send({ message: i18n.t("alerts.request.unauthorized") })
                }
                const conflictingEvents = helper.getConflictingEvents(newRoom.ical, req.body.new.startDate, req.body.new.endDate)
                const freeSubooms = await helper.getFreeSubrooms(conflictingEvents)
                var subrooms = null
                if (req.body.new.subrooms !== undefined) {
                    subrooms = req.body.new.subrooms
                } else {
                    subrooms = eventComp.getFirstPropertyValue('x-subrooms')
                }
                var subroomsFree = false
                if (subrooms !== null) {
                    subroomsFree = true
                    for (subroom of subrooms) {
                        if (!freeSubooms[newRoom.name] || freeSubooms[newRoom.name].indexOf(subroom) === -1) {
                            subroomsFree = false
                        }
                    }
                }

                if (conflictingEvents.length === 0 || subroomsFree) {
                    if (req.body.new.roomService !== undefined) {
                        eventComp.updatePropertyWithValue('x-room-service', req.body.new.roomService)
                    }
                    if (subrooms !== null) {
                        eventComp.updatePropertyWithValue('x-subrooms', subrooms)
                    } else {
                        eventComp.removeProperty('x-subrooms')
                    }
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
                    sendChangeMail(helper.icalEventToSimpleEvent(oldComp), helper.icalEventToSimpleEvent(eventComp), organizerName, organizerMail)
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