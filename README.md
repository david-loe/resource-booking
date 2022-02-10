# Room Booking 🏠
A Vue.js Project to easily manage room availablility.


Using [Fullcalendar](https://fullcalendar.io/) for visiulazing the Calendar (modified [icalendar plugin](https://github.com/fullcalendar/fullcalendar/tree/master/packages/icalendar)).

Using [OpenLDAP Docker Image](https://github.com/rroemhild/docker-test-openldap) for LDAP testing.

Using [ical.js](https://github.com/mozilla-comm/ical.js/) to generate and handle iCalendar.

## Install & Run
```
git clone https://github.com/david-loe/room-booking.git
cd room-booking
docker-compose up -d
```
frontend running on `localhost:5000` login with `professor:professor` (or any other user from [OpenLDAP Docker Image](https://github.com/rroemhild/docker-test-openldap))
First user to sign in gets admin rights (maybe refresh necessary).

change `.env` to individualize the apps settings

## Production
change `NODE_ENV` in `.env` to `production` and run:
```
docker-compose up --build -d
```