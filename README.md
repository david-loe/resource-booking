# Resource Booking 🏠
A Vue.js Project to easily manage resource availablility.


Using [Fullcalendar](https://fullcalendar.io/) for visiulazing the Calendar (modified [icalendar plugin](https://github.com/fullcalendar/fullcalendar/tree/master/packages/icalendar)).

Using [OpenLDAP Docker Image](https://github.com/rroemhild/docker-test-openldap) for LDAP testing.

Using [ical.js](https://github.com/mozilla-comm/ical.js/) to generate and handle iCalendar.

## Requirements
- [docker](https://docs.docker.com/engine/install/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Install & Run
```
git clone https://github.com/david-loe/resource-booking.git
cd resource-booking
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

## Customization

1. in `.env` many customizations can be done.
2. change *resource* into your custom resource name in `/locales/*.json`
3. change the banner image by replacing `frontend/src/assets/banner.jpg`

