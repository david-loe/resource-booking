const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: String,
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('User', userSchema)