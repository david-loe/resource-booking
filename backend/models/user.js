const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    uid: { type: String, unique: true, required: true },
    isAdmin: {type: Boolean, default: false},
    isRoomService: {type: Boolean, default: false},
})

module.exports = mongoose.model('User', userSchema)