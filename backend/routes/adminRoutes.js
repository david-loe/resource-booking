const router = require('express').Router()
const Resource = require('../models/resource')
const User = require('../models/user')
const helper = require('../helper')

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
        const bookings = helper.csvToObjekt(req.body.csv, req.body.separator, req.body.arraySeparator)
        const failedBookings = []
        for (const booking of bookings) {
            if(process.env.VUE_APP_USE_SERVICE.toLowerCase() !== 'true'){
                booking.service = false
            }
            if(process.env.VUE_APP_USE_SUBRESOURCES.toLowerCase() !== 'true'){
                booking.subresources = null
            }
            const booking = await helper.book(booking)
            if (!booking.success) {
                failedBookings.push({ booking: booking, error: booking.error, conflictingBookings: booking.conflictingBookings })
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

module.exports = router;