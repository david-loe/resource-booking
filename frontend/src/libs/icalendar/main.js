import { IcalExpander } from './ical-expander/IcalExpander.js'

// Use FullCalendar's public event-source API so recurrence expansion and the
// application's extra iCalendar properties do not depend on calendar internals.
export function expandICalendar(ics, { start, end }) {
  const expander = new IcalExpander({ ics, skipInvalidDates: true })
  const rangeStart = new Date(start)
  const rangeEnd = new Date(end)
  rangeStart.setDate(rangeStart.getDate() - 1)
  rangeEnd.setDate(rangeEnd.getDate() + 1)
  const { events, occurrences } = expander.between(rangeStart, rangeEnd)

  function toEvent(event, startDate = event.startDate, endDate = event.endDate) {
    const component = event.component
    return {
      id: event.uid,
      title: event.summary,
      url: component.getFirstPropertyValue('url') || '',
      color: component.getFirstPropertyValue('color'),
      start: startDate.toString(),
      end: component.hasProperty('dtend') || component.hasProperty('duration')
        ? endDate.toString()
        : null,
      extendedProps: {
        location: event.location,
        organizer: event.organizer,
        description: event.description,
      },
    }
  }

  return [
    ...events.map(event => toEvent(event)),
    ...occurrences.map(occurrence => toEvent(occurrence.item, occurrence.startDate, occurrence.endDate)),
  ]
}

export default function createICalendarSource(url) {
  return async function fetchEvents(range) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`)
    return expandICalendar(await response.text(), range)
  }
}
