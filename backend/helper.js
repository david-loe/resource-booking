const Resource = require('./models/resource')
const User = require('./models/user')
const ICAL = require('ical.js')
const uid = require('uid')

/**
 * Return all bookings with service as a ICAL Component
 * @returns {ICAL.Component} ICAL Component
 */
async function getServiceIcal() {
    const resources = await Resource.find({})
    const serviceIcal = new ICAL.Component(['vcalendar', [], []])
    for (var resource of resources) {
        const comp = new ICAL.Component(resource.ical)
        for (const vevent of comp.getAllSubcomponents('vevent')) {
            if (vevent.getFirstPropertyValue('x-service')) {
                serviceIcal.addSubcomponent(vevent)
            }
        }
    }
    return serviceIcal
}

/**
 * 
 * @param {ICAL.Component} vevent 
 * @returns Simple Booking
 */
function icalEventToSimpleBooking(vevent) {
    const icalEvent = new ICAL.Event(vevent);

    return {
        startDate: icalEvent.startDate.toJSDate(),
        endDate: icalEvent.endDate.toJSDate(),
        summary: icalEvent.summary,
        organizer: icalEvent.organizer,
        resource: icalEvent.location,
        color: icalEvent.color,
        uid: icalEvent.uid,
        service: vevent.getFirstPropertyValue('x-service'),
        subresources: vevent.getFirstPropertyValue('x-subresources')
    }
}

function resourceToSimpleResource(resource, isPartlyBooked = false) {
    return {
        name: resource.name,
        description: resource.description,
        size: resource.size,
        img: resource.img,
        isDividable: resource.isDividable,
        subresources: resource.subresources,
        color: resource.color,
        isPartlyBooked: isPartlyBooked
    }
}

/**
 * @param {Array} conflictingBookings
 * @returns {Array} Array of free Subresources grouped by resource name
 */
async function getFreeSubresources(conflictingBookings) {
    const freeSubresources = {}
    for (const booking of conflictingBookings) {
        if (booking.subresources !== null) {
            if (!freeSubresources[booking.resource]) {
                const resource = await Resource.findOne({ name: booking.resource })
                freeSubresources[booking.resource] = resource.subresources
            }
            for (const subresource of booking.subresources) {
                const index = freeSubresources[booking.resource].indexOf(subresource)
                if (index !== -1) {
                    freeSubresources[booking.resource].splice(index, 1)
                }
            }

        }
    }
    return freeSubresources
}
/**
 * 
 * @param {string} csv 
 * @param {string} separator 
 * @returns Array of JS Objects
 */
function csvToObjekt(csv, separator = '\t', arraySeparator = ', ') {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(separator);
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        if (lines[i] === '') {
            break
        }
        var currentline = lines[i].split(separator);
        for (var j = 0; j < headers.length; j++) {
            // search for [] to identify arrays
            const match = currentline[j].match(/^\[(.*)\]$/)
            if (match === null) {
                obj[headers[j]] = currentline[j];
            } else {
                obj[headers[j]] = match[1].split(arraySeparator)
            }

        }
        result.push(obj);
    }
    return result
}

/**
 * @param {string} attribute    The attribute to update
 * @param {string} value        The new value of the attribute
 * @param {ICAL.Component} ical The calendar which holds the bookings to update
 * @returns 
 */
function updateAttributeInAllBookings(attribute, value, ical) {
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        vevent.updatePropertyWithValue(attribute, value)
    }
}

/**
 * @param {SimpleBooking} booking 
 * @param {Resource} optional a resource to use
 * @returns {Object} .success returns wether successful
 */
async function book(booking, resource = null) {
    if (!booking.resource || !booking.summary || !booking.organizer || !booking.startDate || !booking.endDate || booking.service === undefined || booking.subresources === undefined || (booking.startDate >= booking.endDate)) {
        return { success: false, bookedResource: [], conflictingBookings: [], error: 'The booking is missing parameters or startDate is behind endDate' }
    }
    try {
        new Date(booking.startDate)
        new Date(booking.endDate)
    } catch (error) {
        return { success: false, bookedResource: [], conflictingBookings: [], error: error }
    }
    if (typeof booking.service === 'string' || booking.service instanceof String) {
        booking.service = booking.service.toLowerCase() === 'true'
    }
    if (typeof booking.subresources === 'string' || booking.subresources instanceof String) {
        if (booking.subresources.toLowerCase() === 'null') {
            booking.subresources = null
        } else {
            return { success: false, bookedResource: [], conflictingBookings: [], error: 'Unvalid value in subresource: ' + booking.subresources }
        }
    }
    if (booking.organizer.match(/.* <.*>$/) === null) {
        return { success: false, bookedResource: [], conflictingBookings: [], error: 'Organizer does not match: /.* <.*>$/' }
    }
    if (resource === null) {
        resource = await Resource.findOne({ name: booking.resource })
        if (!resource) {
            return { success: false, bookedResource: [], conflictingBookings: [], error: 'No Resource found with name: ' + booking.resource }
        }
    } else {
        if (resource.name !== booking.resource) {
            return { success: false, bookedResource: [], conflictingBookings: [], error: 'Provided resource and booking resource are different' }
        }
    }
    if (!resource.isDividable && booking.subresources !== null) {
        return { success: false, bookedResource: [], conflictingBookings: [], error: 'Booking resource has no subresources' }
    }
    if (booking.subresources !== null) {
        if (booking.subresources.length === 0) {
            return { success: false, bookedResource: [], conflictingBookings: [], error: 'Unvalid value in subresource: empty Array' }
        }
        for (subresource of booking.subresources) {
            if (resource.subresources.indexOf(subresource) === -1) {
                return { success: false, bookedResource: [], conflictingBookings: [], error: 'Unknown subresource: ' + subresource }
            }
        }
    }
    const conflictingBookings = getConflictingBookings(resource.ical, booking.startDate, booking.endDate)
    const freeSubooms = await getFreeSubresources(conflictingBookings)
    var subresourcesFree = false
    if (booking.subresources !== null) {
        subresourcesFree = true
        for (subresource of booking.subresources) {
            if (!freeSubooms[booking.resource] || freeSubooms[booking.resource].indexOf(subresource) === -1) {
                subresourcesFree = false
            }
        }
        var bookedPartly = false
        for (const subresource of resource.subresources) {
            if (booking.subresources.indexOf(subresource) === -1) {
                bookedPartly = true
            }
        }
        if (!bookedPartly) {
            booking.subresources = null
        }
    }
    if (conflictingBookings.length > 0 && !subresourcesFree) {
        return { success: false, bookedResource: [], conflictingBookings: conflictingBookings, error: 'Conflicting Booking' }
    }
    const vevent = new ICAL.Component('vevent')
    const icalEvent = new ICAL.Event(vevent)
    icalEvent.summary = booking.summary
    icalEvent.location = booking.resource
    icalEvent.organizer = booking.organizer
    icalEvent.color = resource.color
    icalEvent.startDate = ICAL.Time.fromJSDate(new Date(booking.startDate))
    icalEvent.endDate = ICAL.Time.fromJSDate(new Date(booking.endDate))
    vevent.addPropertyWithValue('x-service', booking.service)
    if (booking.uid === undefined) {
        icalEvent.uid = uid.uid()
    } else {
        icalEvent.uid = booking.uid
    }
    if (booking.subresources !== null) {
        vevent.addPropertyWithValue('x-subresources', booking.subresources)
    }
    const comp = new ICAL.Component(resource.ical)
    comp.addSubcomponent(vevent)
    resource.markModified('ical');
    return { success: true, bookedResource: await resource.save(), conflictingBookings: [], error: '' }
}

function getConflictingBookings(ical, startDate, endDate) {
    const conflictingBookings = []
    const confStart = new Date(startDate)
    const confEnd = new Date(endDate)
    const comp = new ICAL.Component(ical)
    for (const vevent of comp.getAllSubcomponents('vevent')) {
        const icalEvent = new ICAL.Event(vevent);
        const bookingStart = icalEvent.startDate.toJSDate()
        const bookingEnd = icalEvent.endDate.toJSDate()
        if (confStart < bookingStart) {
            if (confEnd <= bookingStart) {
                continue
            } else {
                conflictingBookings.push(icalEventToSimpleBooking(vevent))
            }
        } else if (confStart < bookingEnd) {
            conflictingBookings.push(icalEventToSimpleBooking(vevent))
        } else {
            continue
        }
    }
    return conflictingBookings
}

async function isUserOrganizerOrAdmin(bookingOrganizer, reqUser) {
    const user = await User.findOne({ uid: reqUser[process.env.LDAP_UID_ATTRIBUTE] })
    var isAdmin = false;
    if (user) {
        isAdmin = user.isAdmin
    }
    return bookingOrganizer.indexOf(reqUser[process.env.LDAP_MAIL_ATTRIBUTE]) !== -1 || isAdmin
}

module.exports = {
    getServiceIcal: getServiceIcal,
    icalEventToSimpleBooking: icalEventToSimpleBooking,
    resourceToSimpleResource: resourceToSimpleResource,
    getFreeSubresources: getFreeSubresources,
    csvToObjekt: csvToObjekt,
    updateAttributeInAllBookings: updateAttributeInAllBookings,
    book: book,
    getConflictingBookings: getConflictingBookings,
    isUserOrganizerOrAdmin: isUserOrganizerOrAdmin,
}