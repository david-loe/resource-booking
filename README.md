# room-booking
A Vue.js Project to easily manage room availablility.


Using [Fullcalendar](https://fullcalendar.io/) for visiulazing the Calendar (modified [icalendar plugin](https://github.com/fullcalendar/fullcalendar/tree/master/packages/icalendar)).

Using [OpenLDAP Docker Image](https://github.com/rroemhild/docker-test-openldap) for LDAP testing.

Using [ical.js](https://github.com/mozilla-comm/ical.js/) to generate and handle iCalendar.

## Install
```
git clone https://github.com/david-loe/room-booking.git
cd room-booking
git submodule init
git submodule update
```

## Run
```
docker-compose up -d
```

backend: `localhost:8000`

frontend: `localhost:5000`

First user to sign in gets admin rights (maybe refresh necessary).
