const router = require('express').Router()
const Resource = require('../models/resource')
const User = require('../models/user')
const Category = require('../models/category')
const helper = require('../helper')
const ICAL = require('ical.js')

router.post('/resource', async (req, res) => {
    const resource = new Resource({
        name: req.body.name,
        size: req.body.size,
        description: req.body.description,
        img: req.body.img,
        color: req.body.color,
        isDividable: req.body.isDividable,
        subresources: req.body.subresources
    })
    try {
        res.send(await resource.save())
    } catch (error) {
        res.status(400).send({ message: 'Unable to save resource', error: error })
    }
})

router.post('/resource/change', async (req, res) => {
    if (req.body.name) {
        const resource = await Resource.findOne({ name: req.body.name })
        if (resource) {
            resource.size = req.body.size
            resource.description = req.body.description
            resource.img = req.body.img
            resource.color = req.body.color
            helper.updateAttributeInAllBookings('color', req.body.color, resource.ical)
            resource.markModified('ical')
            try {
                res.send(await resource.save())
            } catch (error) {
                res.status(400).send({ message: 'Unable to save resource', error: error })
            }
        } else {
            res.status(400).send({ message: 'No resource found named: ' + req.body.name })
        }
    } else {
        res.status(400).send({ message: 'Name Missing' })
    }
})

router.delete('/resource', async (req, res) => {
    if (req.query.name) {
        try {
            await Resource.deleteOne({ name: req.query.name })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: 'Unable to delete resource ' + req.query.name, error: error })
        }
    } else {
        res.status(400).send({ message: 'Name Missing' })
    }
})

router.post('/category', async (req, res) => {
    const category = new Category({
        name: req.body.name,
        hint: req.body.hint
    })
    try {
        res.send(await category.save())
    } catch (error) {
        res.status(400).send({ message: 'Unable to save category', error: error })
    }
})

router.delete('/category', async (req, res) => {
    if (req.query.id) {
        try {
            await Category.deleteOne({ _id: req.query.id })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: 'Unable to delete category ' + req.query.id, error: error })
        }
    } else {
        res.status(400).send({ message: 'ID Missing' })
    }
})


router.get('/user', async (req, res) => {
    const users = await User.find()
    res.send({ users: users })
})

router.post('/user', async (req, res) => {
    const user = new User({
        uid: req.body.uid,
        isAdmin: req.body.isAdmin,
        isService: req.body.isService,
        mail: req.body.mail
    })
    try {
        res.send(await user.save())
    } catch (error) {
        res.status(400).send({ message: 'Unable to save user', error: error })
    }
})

router.post('/user/change', async (req, res) => {
    if (req.body.uid != undefined && req.body.isAdmin != undefined && req.body.isService != undefined) {
        const user = await User.findOne({ uid: req.body.uid })
        if (user) {
            user.isAdmin = req.body.isAdmin
            user.isService = req.body.isService
            res.send(await user.save())
        } else {
            res.status(400).send({ message: 'No user found with uid:' + req.body.uid })
        }
    } else {
        res.status(400).send({ message: 'Please provide a uid, isAdmin and isService.' })
    }
})

router.delete('/user', async (req, res) => {
    if (req.query.uid) {
        try {
            await User.deleteOne({ uid: req.query.uid })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: 'Unable to delete user ' + req.query.uid, error: error })
        }
    } else {
        res.status(400).send({ message: 'UID Missing' })
    }
})

router.post('/csv/booking', async (req, res) => {
    if (req.body.csv && req.body.separator && req.body.arraySeparator && (req.body.separator !== req.body.arraySeparator)) {
        const bookings = helper.csvToObjects(req.body.csv, req.body.separator, req.body.arraySeparator)
        const failedBookings = []
        for (const booking of bookings) {
            if(process.env.VUE_APP_USE_SERVICE.toLowerCase() !== 'true'){
                booking.service = false
            }
            if(process.env.VUE_APP_USE_SUBRESOURCES.toLowerCase() !== 'true'){
                booking.subresources = null
            }
            const bookingResult = await helper.book(booking)
            if (!bookingResult.success) {
                failedBookings.push({ booking: booking, error: bookingResult.error, conflictingBookings: bookingResult.conflictingBookings })
            }
        }
        if (failedBookings.length === 0) {
            res.send({ message: 'ok' })
        } else {
            res.status(406).send({ message: failedBookings.length + ' Bookings failed', failedBookings: failedBookings })
        }

    } else {
        res.status(400).send({ message: 'Please provide csv, a separator and a different array separator.' })
    }
})

router.get('/csv/booking', async (req, res) => {
    var separator = "\t"
    var arraySeparator = ", "
    if(req.query.arraySeparator && req.query.separator && (req.query.separator !== req.query.arraySeparator)){
        separator = req.query.separator
        arraySeparator = req.query.arraySeparator
    }
    const bookings = []
    const resources = await Resource.find()
    for (const resource of resources){
        const comp = new ICAL.Component(resource.ical)
        for (const vevent of comp.getAllSubcomponents('vevent')) {
            bookings.push(helper.icalEventToSimpleBooking(vevent))
        }
    }
    if(bookings.length > 0){
        res.send({csv: helper.objectsToCSV(bookings, separator, arraySeparator), separator: separator, arraySeparator: arraySeparator})
    }else {
        res.send({message: "No booking", csv: ''})
    }
})

module.exports = router;