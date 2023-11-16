const Resource = require('./models/resource')
const User = require('./models/user')
const ICAL = require('ical.js')
const uid = require('uid')
const i18n = require('./i18n')

/**
 * Return all bookings with service as a ICAL Component
 * @returns {ICAL.Component} ICAL Component
 */
async function getServiceIcal() {
    const resources = await Resource.find()
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
        category: vevent.getFirstPropertyValue('x-category'),
        utilization: vevent.getFirstPropertyValue('x-utilization'),
        subresources: vevent.getFirstPropertyValue('x-subresources')
    }
}

/**
 * 
 * @param booking Simple Booking
 * @returns {ICAL.Component} vevent
 */
function simpleBookingToIcalEvent(booking) {
    const vevent = new ICAL.Component('vevent')
    const icalEvent = new ICAL.Event(vevent)

    icalEvent.startDate = ICAL.Time.fromJSDate(new Date(booking.startDate))
    icalEvent.endDate = ICAL.Time.fromJSDate(new Date(booking.endDate))
    icalEvent.summary = booking.summary
    icalEvent.organizer = booking.organizer
    icalEvent.location = booking.resource
    if (booking.color) {
        icalEvent.color = booking.color
    }
    icalEvent.uid = booking.uid
    vevent.addPropertyWithValue('x-service', booking.service)
    vevent.addPropertyWithValue('x-category', booking.category)
    if (booking.utilization || booking.utilization === 0) {
        vevent.addPropertyWithValue('x-utilization', booking.utilization)
    }
    if (booking.subresources !== null) {
        vevent.addPropertyWithValue('x-subresources', booking.subresources)
    }

    return vevent
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
function csvToObjects(csv, separator = '\t', arraySeparator = ', ') {
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

function objectsToCSV(objects, separator = '\t', arraySeparator = ', ') {
    const array = [Object.keys(objects[0])].concat(objects)

    return array.map(it => {
        return Object.values(it).map(item => {
            if (Array.isArray(item)) {
                return '[' + item.join(arraySeparator) + ']'
            } else if (item === null) {
                return 'null'
            } else {
                return item
            }
        }).join(separator)
    }).join('\n')
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
        if (booking.subresources.toLowerCase() === 'null' || booking.subresources === '') {
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

    if (booking.uid === undefined) {
        booking.uid = uid.uid()
    }
    booking.color = resource.color
    const comp = new ICAL.Component(resource.ical)
    comp.addSubcomponent(simpleBookingToIcalEvent(booking))
    resource.markModified('ical');

    return { success: true, bookedResource: await resource.save(), conflictingBookings: [], error: '', booking: booking }
}

/**
 * Returns conflicting bookings and a conflict code
 * @param {ICAL.Component} ical 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns 
 */
function getConflictingBookings(ical, startDate, endDate) {
    const codes = {
        complete: 1,
        beginning: 2,
        inside: 3,
        end: 4,
    }
    const conflictingBookings = []
    const conflictCodes = []
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
                const booking = icalEventToSimpleBooking(vevent)
                if (confEnd <= bookingEnd) {
                    booking.conflictCode = codes.end
                } else {
                    booking.conflictCode = codes.inside
                }
                conflictingBookings.push(booking)
            }
        } else if (confStart < bookingEnd) {
            const booking = icalEventToSimpleBooking(vevent)
            if (confEnd <= bookingEnd) {
                booking.conflictCode = codes.complete
            } else {
                booking.conflictCode = codes.beginning
            }
            conflictingBookings.push(booking)
        } else {
            continue
        }
    }
    return conflictingBookings
}

async function isUserOrganizerOrAdmin(bookingOrganizer, reqUser) {
    return bookingOrganizer.indexOf(reqUser.mail) !== -1 || reqUser.isAdmin
}

/**
 * 
 * @param {ICAL.Component} vevent
 * @param {string} method
 * @returns attachment
 */
function icalEventForEmailAttachments(booking, method, recipientMail, recipientName) {

    var icalString = `BEGIN:VCALENDAR
METHOD:${method}
PRODID:${i18n.t("headlines.resourceBooking")}
VERSION:2.0
BEGIN:VEVENT
ORGANIZER;CN="${i18n.t("headlines.resourceBooking")} ${i18n.t("resource.emoji")}":mailto:${process.env.MAIL_SENDER_ADDRESS}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE;CN="${recipientName}":mailto:${recipientMail}
DESCRIPTION:\\n
UID:${booking.uid}
SUMMARY:${booking.summary}
DTSTART;TZID=${process.env.TZ}:${ICAL.Time.fromJSDate(new Date(booking.startDate)).toString().replaceAll(/[-:]/g, '')}
DTEND;TZID=${process.env.TZ}:${ICAL.Time.fromJSDate(new Date(booking.endDate)).toString().replaceAll(/[-:]/g, '')}
CLASS:PUBLIC
PRIORITY:5
DTSTAMP;TZID=${process.env.TZ}:${ICAL.Time.fromJSDate(new Date()).toString().replaceAll(/[-:]/g, '')}
TRANSP:OPAQUE
STATUS:${method.toUpperCase() !== 'CANCEL' ? 'CONFIRMED' : 'CANCELLED'}
SEQUENCE:0
LOCATION:${booking.resource}${method.toUpperCase() !== 'CANCEL' ? '\nX-MICROSOFT-CDO-BUSYSTATUS:FREE' : ''}
BEGIN:VALARM
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:-PT${process.env.MAIL_CALENDAR_EVENT_REMINDER_TIME}H
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`
    icalString = icalString.replaceAll('\n', '\r\n')
    console.log(icalString)
    const buf = Buffer.from(icalString.toString(), 'utf-8');
    const base64Cal = buf.toString('base64');
    return {
        content: base64Cal,
        method: method,
        encoding: 'base64'
    }
}

module.exports = {
    getServiceIcal: getServiceIcal,
    icalEventToSimpleBooking: icalEventToSimpleBooking,
    resourceToSimpleResource: resourceToSimpleResource,
    getFreeSubresources: getFreeSubresources,
    csvToObjects: csvToObjects,
    objectsToCSV: objectsToCSV,
    updateAttributeInAllBookings: updateAttributeInAllBookings,
    book: book,
    getConflictingBookings: getConflictingBookings,
    isUserOrganizerOrAdmin: isUserOrganizerOrAdmin,
    icalEventForEmailAttachments: icalEventForEmailAttachments,
}