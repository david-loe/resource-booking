const router = require('express').Router()
const User = require('./models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    })
    try {
        const result = await user.save()
        const { password, ...saveResult } = result.toJSON()
        res.send(saveResult)
    } catch (error) {
        res.status(400).send({ message: "Unable to save user", error: error })
    }

})

router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        res.status(404).send({ message: "User not found" })

    } else if (!await bcrypt.compare(req.body.password, user.password)) {
        res.status(400).send({ message: "Invalid credentials" })

    } else {

        const token = jwt.sign({ _id: user._id }, "secret")
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        })
        const { password, ...saveUser } = user.toJSON()
        res.send(saveUser)
    }
})

router.get('/user', async (req, res) => {
    var claims
    try {
        const cookie = req.cookies['jwt']
        claims = jwt.verify(cookie, "secret")

    } catch (error) {
    }

    if (!claims) {
        res.status(401).send({ message: "Unauthenticated" })
    } else {
        const user = await User.findOne({ _id: claims._id })
        if (!user) {
            res.status(404).send({ message: "User not found" })

        } else {
            const { password, ...saveUser } = user.toJSON()
            res.send(saveUser)
        }

    }
})

router.post('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 0 })
    res.send({ message: 'success' })
})

module.exports = router;