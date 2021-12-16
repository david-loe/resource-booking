const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    size: {type: Number},
    description: {type: String, default: 'A Room.'},
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Room', roomSchema)