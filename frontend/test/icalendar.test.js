import assert from 'node:assert/strict'
import { test } from 'node:test'
import createICalendarSource, { expandICalendar } from '../src/libs/icalendar/main.js'

const range = { start: new Date('2026-11-01T00:00:00Z'), end: new Date('2026-12-01T00:00:00Z') }
const calendar = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n')
const event = (properties) => ['BEGIN:VEVENT', ...properties, 'END:VEVENT'].join('\r\n')
const booking = event([
  'UID:booking-1', 'DTSTART:20261105T100000Z', 'DTEND:20261105T110000Z',
  'SUMMARY:Team meeting', 'LOCATION:Room A', 'ORGANIZER:Alex <alex@example.com>',
  'DESCRIPTION:Planning', 'COLOR:#123456', 'URL:https://example.com/booking',
])

test('preserves booking dates, color, UID, and custom metadata', () => {
  assert.deepEqual(expandICalendar(calendar(booking), range), [{
    id: 'booking-1', title: 'Team meeting', url: 'https://example.com/booking',
    color: '#123456', start: '2026-11-05T10:00:00Z', end: '2026-11-05T11:00:00Z',
    extendedProps: { location: 'Room A', organizer: 'Alex <alex@example.com>', description: 'Planning' },
  }])
})

test('expands recurring events, skips EXDATE, and uses recurrence exceptions', () => {
  const recurring = event([
    'UID:series-1', 'DTSTART:20261105T100000Z', 'DTEND:20261105T110000Z',
    'SUMMARY:Original', 'RRULE:FREQ=DAILY;COUNT=4', 'EXDATE:20261106T100000Z',
  ])
  const exception = event([
    'UID:series-1', 'RECURRENCE-ID:20261107T100000Z', 'DTSTART:20261107T120000Z',
    'DTEND:20261107T130000Z', 'SUMMARY:Moved',
  ])
  const expanded = expandICalendar(calendar(recurring, exception), range)
    .sort((a, b) => a.start.localeCompare(b.start))
  assert.deepEqual(expanded.map(({ start, title }) => [start, title]), [
    ['2026-11-05T10:00:00Z', 'Original'],
    ['2026-11-07T12:00:00Z', 'Moved'],
    ['2026-11-08T10:00:00Z', 'Original'],
  ])
})

test('keeps all-day events as date strings with exclusive end dates', () => {
  const allDay = event(['UID:all-day', 'DTSTART;VALUE=DATE:20261109', 'DTEND;VALUE=DATE:20261111', 'SUMMARY:Away'])
  const [expanded] = expandICalendar(calendar(allDay), range)
  assert.equal(expanded.start, '2026-11-09')
  assert.equal(expanded.end, '2026-11-11')
})

test('refetches updated calendar data and propagates request failures', async (t) => {
  const responses = [calendar(booking), calendar()]
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, '/public/ical?token=test')
    return new Response(responses.shift())
  })
  const source = createICalendarSource('/public/ical?token=test')
  assert.equal((await source(range)).length, 1)
  assert.deepEqual(await source(range), [])
  t.mock.method(globalThis, 'fetch', async () => new Response('Unauthorized', { status: 401 }))
  await assert.rejects(source(range), /Calendar request failed: 401/)
})

test('rejects malformed calendar feeds', () => {
  assert.throws(() => expandICalendar('invalid calendar', range))
})
