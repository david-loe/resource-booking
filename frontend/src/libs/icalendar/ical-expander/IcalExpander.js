/* eslint-disable */
/*
from https://github.com/mifi/ical-expander
released under https://github.com/mifi/ical-expander/blob/master/LICENSE
operates entirely in UTC
*/
import * as ICAL from 'ical.js';
var IcalExpander = /** @class */ (function () {
    function IcalExpander(opts) {
        this.maxIterations = opts.maxIterations != null ? opts.maxIterations : 1000;
        this.skipInvalidDates = opts.skipInvalidDates != null ? opts.skipInvalidDates : false;
        this.jCalData = ICAL.parse(opts.ics);
        this.component = new ICAL.Component(this.jCalData);
        this.events = this.component.getAllSubcomponents('vevent').map(function (vevent) { return new ICAL.Event(vevent); });
        if (this.skipInvalidDates) {
            this.events = this.events.filter(function (evt) {
                try {
                    evt.startDate.toJSDate();
                    evt.endDate.toJSDate();
                    return true;
                }
                catch (err) {
                    // skipping events with invalid time
                    return false;
                }
            });
        }
    }
    IcalExpander.prototype.between = function (after, before) {
        var _this = this;
        function isEventWithinRange(startTime, endTime) {
            return (!after || endTime >= after.getTime()) &&
                (!before || startTime <= before.getTime());
        }
        function getTimes(eventOrOccurrence) {
            var startTime = eventOrOccurrence.startDate.toJSDate().getTime();
            var endTime = eventOrOccurrence.endDate.toJSDate().getTime();
            // If it is an all day event, the end date is set to 00:00 of the next day
            // So we need to make it be 23:59:59 to compare correctly with the given range
            if (eventOrOccurrence.endDate.isDate && (endTime > startTime)) {
                endTime -= 1;
            }
            return { startTime: startTime, endTime: endTime };
        }
        var exceptions = [];
        this.events.forEach(function (event) {
            if (event.isRecurrenceException())
                exceptions.push(event);
        });
        var ret = {
            events: [],
            occurrences: [],
        };
        this.events.filter(function (e) { return !e.isRecurrenceException(); }).forEach(function (event) {
            var exdates = [];
            event.component.getAllProperties('exdate').forEach(function (exdateProp) {
                var exdate = exdateProp.getFirstValue();
                exdates.push(exdate.toJSDate().getTime());
            });
            // Recurring event is handled differently
            if (event.isRecurring()) {
                var iterator = event.iterator();
                var next = void 0;
                var i = 0;
                var _loop_1 = function () {
                    i += 1;
                    next = iterator.next();
                    if (next) {
                        var occurrence_1 = event.getOccurrenceDetails(next);
                        var _b = getTimes(occurrence_1), startTime_1 = _b.startTime, endTime_1 = _b.endTime;
                        var isOccurrenceExcluded = exdates.indexOf(startTime_1) !== -1;
                        // TODO check that within same day?
                        var exception = exceptions.find(function (ex) { return ex.uid === event.uid && ex.recurrenceId.toJSDate().getTime() === occurrence_1.startDate.toJSDate().getTime(); });
                        // We have passed the max date, stop
                        if (before && startTime_1 > before.getTime())
                            return "break";
                        // Check that we are within our range
                        if (isEventWithinRange(startTime_1, endTime_1)) {
                            if (exception) {
                                ret.events.push(exception);
                            }
                            else if (!isOccurrenceExcluded) {
                                ret.occurrences.push(occurrence_1);
                            }
                        }
                    }
                };
                do {
                    var state_1 = _loop_1();
                    if (state_1 === "break")
                        break;
                } while (next && (!_this.maxIterations || i < _this.maxIterations));
                return;
            }
            // Non-recurring event:
            var _a = getTimes(event), startTime = _a.startTime, endTime = _a.endTime;
            if (isEventWithinRange(startTime, endTime))
                ret.events.push(event);
        });
        return ret;
    };
    IcalExpander.prototype.before = function (before) {
        return this.between(undefined, before);
    };
    IcalExpander.prototype.after = function (after) {
        return this.between(after);
    };
    IcalExpander.prototype.all = function () {
        return this.between();
    };
    return IcalExpander;
}());
export { IcalExpander };
//# sourceMappingURL=IcalExpander.js.map