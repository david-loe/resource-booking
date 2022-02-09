const router = require('express').Router()
const Room = require('../models/room')
const User = require('../models/user')

router.post('/room', async (req, res) => {
    const room = new Room({
        name: req.body.name,
        size: req.body.size,
        description: req.body.description,
        img: req.body.img,
        color: req.body.color
    })
    try {
        res.send(await room.save())
    } catch (error) {
        res.status(400).send({ message: "Unable to save room", error: error })
    }
})

router.post('/room/change', async (req, res) => {
    if(req.body.name){
        const room = await Room.findOne({ name: req.body.name })
        if(room){
            room.size = req.body.size,
            room.description = req.body.description,
            room.img = req.body.img,
            room.color = req.body.color
            try {
                res.send(await room.save())
            } catch (error) {
                res.status(400).send({ message: "Unable to save room", error: error })
            }
        }else{
            res.status(400).send({message: "No room found named: " + req.body.name})
        }
    }else{
        res.status(400).send({message: "Name Missing"})
    }
})

router.delete('/room', async (req, res) => {
    if (req.query.name) {
        try {
            await Room.deleteOne({ name: req.query.name })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: "Unable to delete room " + req.query.name, error: error })
        }
    } else {
        res.status(400).send({ message: "Name Missing" })
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
        isRoomService: req.body.isRoomService
    })
    try {
        res.send(await user.save())
    } catch (error) {
        res.status(400).send({ message: "Unable to save user", error: error })
    }
})

router.post('/user/change', async (req, res) => {
    if(req.body.uid != undefined && req.body.isAdmin != undefined && req.body.isRoomService != undefined){
        const user = await User.findOne({uid: req.body.uid})
        if(user){
            user.isAdmin = req.body.isAdmin
            user.isRoomService = req.body.isRoomService
            res.send(await user.save())
        }else {
            res.status(400).send({ message: "No user found with uid:" +  req.body.uid})
        }
    }else{
        res.status(400).send({ message: "Please provide a uid, isAdmin and isRoomService." })
    }
})

router.delete('/user', async (req, res) => {
    if (req.query.uid) {
        try {
            await User.deleteOne({ uid: req.query.uid })
            res.send({ message: 'ok' })
        } catch (error) {
            res.status(400).send({ message: "Unable to delete user " + req.query.uid, error: error })
        }
    } else {
        res.status(400).send({ message: "UID Missing" })
    }
})

module.exports = router;