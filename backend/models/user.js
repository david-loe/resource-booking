const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fk: {
        microsoft: { type: String, index: true, unique: true, sparse: true },
        ldapauth: { type: String, index: true, unique: true, sparse: true }
    },
    name: { type: String },
    isAdmin: { type: Boolean, default: false },
    isService: { type: Boolean, default: false },
    mail: { type: String, index: true },
    settings: {
        initialCalendarView: { type: String, enum: ['next3weeks', 'dayGridMonth', 'listWeek'], default: 'next3weeks' },
        onlyShowAvailableResourcesInOverview: { type: Boolean, default: true }
    }
})

module.exports = mongoose.model('User', userSchema)