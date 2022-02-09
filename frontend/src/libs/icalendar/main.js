import { __assign } from "tslib";
import { createPlugin, addDays } from '@fullcalendar/common';
import { IcalExpander } from './ical-expander/IcalExpander';
var eventSourceDef = {
    parseMeta: function (refined) {
        if (refined.url && refined.format === 'ics') {
            return {
                url: refined.url,
                format: 'ics',
            };
        }
        return null;
    },
    fetch: function (arg, onSuccess, onFailure) {
        var meta = arg.eventSource.meta;
        var internalState = meta.internalState;
        function handleICalEvents(errorMessage, iCalExpander, xhr) {
            if (errorMessage) {
                onFailure({ message: errorMessage, xhr: xhr });
            }
            else {
                onSuccess({ rawEvents: expandICalEvents(iCalExpander, arg.range), xhr: xhr });
            }
        }
        /*
        NOTE: isRefetch is a HACK. we would do the recurring-expanding in a separate plugin hook,
        but we couldn't leverage built-in allDay-guessing, among other things.
        */
        if (!internalState || arg.isRefetch) {
            internalState = meta.internalState = {
                completed: false,
                callbacks: [handleICalEvents],
                errorMessage: '',
                iCalExpander: null,
                xhr: null,
            };
            requestICal(meta.url, function (rawFeed, xhr) {
                var iCalExpander = new IcalExpander({
                    ics: rawFeed,
                    skipInvalidDates: true,
                });
                for (var _i = 0, _a = internalState.callbacks; _i < _a.length; _i++) {
                    var callback = _a[_i];
                    callback('', iCalExpander, xhr);
                }
                internalState.completed = true;
                internalState.callbacks = [];
                internalState.iCalExpander = iCalExpander;
                internalState.xhr = xhr;
            }, function (errorMessage, xhr) {
                for (var _i = 0, _a = internalState.callbacks; _i < _a.length; _i++) {
                    var callback = _a[_i];
                    callback(errorMessage, null, xhr);
                }
                internalState.completed = true;
                internalState.callbacks = [];
                internalState.errorMessage = errorMessage;
                internalState.xhr = xhr;
            });
        }
        else if (!internalState.completed) {
            internalState.callbacks.push(handleICalEvents);
        }
        else {
            handleICalEvents(internalState.errorMessage, internalState.iCalExpander, internalState.xhr);
        }
    },
};
function requestICal(url, successCallback, failureCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 400) {
            successCallback(xhr.responseText, xhr);
        }
        else {
            failureCallback('Request failed', xhr);
        }
    };
    xhr.onerror = function () { return failureCallback('Request failed', xhr); };
    xhr.send(null);
}
function expandICalEvents(iCalExpander, range) {
    // expand the range. because our `range` is timeZone-agnostic UTC
    // or maybe because ical.js always produces dates in local time? i forget
    var rangeStart = addDays(range.start, -1);
    var rangeEnd = addDays(range.end, 1);
    var iCalRes = iCalExpander.between(rangeStart, rangeEnd); // end inclusive. will give extra results
    var expanded = [];
    // TODO: instead of using startDate/endDate.toString to communicate allDay,
    // we can query startDate/endDate.isDate. More efficient to avoid formatting/reparsing.
    // single events
    for (var _i = 0, _a = iCalRes.events; _i < _a.length; _i++) {
        var iCalEvent = _a[_i];
        expanded.push(__assign(__assign({}, buildNonDateProps(iCalEvent)), { start: iCalEvent.startDate.toString(), end: (specifiesEnd(iCalEvent) && iCalEvent.endDate)
                ? iCalEvent.endDate.toString()
                : null }));
    }
    // recurring event instances
    for (var _b = 0, _c = iCalRes.occurrences; _b < _c.length; _b++) {
        var iCalOccurence = _c[_b];
        var iCalEventq = iCalOccurence.item;
        expanded.push(__assign(__assign({}, buildNonDateProps(iCalEventq)), { start: iCalOccurence.startDate.toString(), end: (specifiesEnd(iCalEventq) && iCalOccurence.endDate)
                ? iCalOccurence.endDate.toString()
                : null }));
    }
    return expanded;
}
function buildNonDateProps(iCalEvent) {
    return {
        id: iCalEvent.uid,
        title: iCalEvent.summary,
        url: extractEventUrl(iCalEvent),
        backgroundColor: iCalEvent.color,
        extendedProps: {
            location: iCalEvent.location,
            organizer: iCalEvent.organizer,
            description: iCalEvent.description,
        },
    };
}
function extractEventUrl(iCalEvent) {
    var urlProp = iCalEvent.component.getFirstProperty('url');
    return urlProp ? urlProp.getFirstValue() : '';
}
function specifiesEnd(iCalEvent) {
    return Boolean(iCalEvent.component.getFirstProperty('dtend')) ||
        Boolean(iCalEvent.component.getFirstProperty('duration'));
}
export default createPlugin({
    eventSourceDefs: [eventSourceDef],
});
//# sourceMappingURL=main.js.map