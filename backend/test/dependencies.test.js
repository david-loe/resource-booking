const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const ICAL = require('ical.js')
const ejs = require('ejs')
const helper = require('../helper')
const i18n = require('../i18n')

const booking = {
  uid: 'booking-1', summary: 'Team <meeting>', resource: 'Room A',
  organizer: 'Alex <alex@example.com>', color: '#123456',
  startDate: new Date('2026-11-05T10:00:00Z'), endDate: new Date('2026-11-05T11:00:00Z'),
  service: true, category: 'Meeting', utilization: 0, subresources: ['A', 'B'],
}

test('persisted jCal round-trip preserves dates and typed custom properties', () => {
  const component = helper.simpleBookingToIcalEvent(booking)
  const parsed = new ICAL.Component(JSON.parse(JSON.stringify(component.toJSON())))
  assert.deepEqual(helper.icalEventToSimpleBooking(parsed), booking)
})

test('exported iCalendar preserves standard booking metadata', () => {
  const component = helper.simpleBookingToIcalEvent(booking)
  const parsed = helper.icalEventToSimpleBooking(new ICAL.Component(ICAL.parse(component.toString())))
  for (const key of ['uid', 'summary', 'resource', 'organizer', 'color', 'startDate', 'endDate']) {
    assert.deepEqual(parsed[key], booking[key], key)
  }
})

test('overlap detection distinguishes overlapping and adjacent bookings', () => {
  const calendar = new ICAL.Component('vcalendar')
  calendar.addSubcomponent(helper.simpleBookingToIcalEvent(booking))
  assert.equal(helper.getConflictingBookings(calendar.toJSON(), new Date('2026-11-05T10:30:00Z'), new Date('2026-11-05T12:00:00Z')).length, 1)
  assert.equal(helper.getConflictingBookings(calendar.toJSON(), booking.endDate, new Date('2026-11-05T12:00:00Z')).length, 0)
})

for (const locale of ['en', 'de']) {
  test(`all mail templates render translated and escaped booking content (${locale})`, async () => {
    await i18n.changeLanguage(locale)
    const displayBooking = { ...booking, startDateStr: '5 November 2026', endDateStr: '5 November 2026' }
    const locals = {
      i18n, booking: displayBooking, oldBooking: displayBooking, newBooking: displayBooking,
      bookings: [displayBooking], recipientName: 'Alex <script>',
      url: 'https://example.com', showService: true,
    }
    const directory = path.join(__dirname, '../mail')
    for (const file of fs.readdirSync(directory).filter(file => file.endsWith('_template.ejs'))) {
      const html = ejs.render(fs.readFileSync(path.join(directory, file), 'utf8'), locals)
      assert.match(html, /Team &lt;meeting&gt;/, file)
      assert.ok(!html.includes('<%'), file)
      assert.ok(!html.includes('mail.footer'), file)
      assert.ok(html.includes(i18n.t('mail.footer')), file)
    }
  })
}
