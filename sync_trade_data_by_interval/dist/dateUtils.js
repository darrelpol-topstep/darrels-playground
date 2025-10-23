"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDateTime = parseDateTime;
exports.formatDateTimeForApi = formatDateTimeForApi;
exports.generateTwoHourIntervals = generateTwoHourIntervals;
exports.validateDateRange = validateDateRange;
const date_fns_tz_1 = require("date-fns-tz");
const date_fns_1 = require("date-fns");
const CST_TIMEZONE = 'America/Chicago';
function parseDateTime(dateTimeString) {
    const parsedDate = (0, date_fns_1.parseISO)(dateTimeString.replace(' ', 'T'));
    return (0, date_fns_tz_1.fromZonedTime)(parsedDate, CST_TIMEZONE);
}
function formatDateTimeForApi(date) {
    const cstDate = (0, date_fns_tz_1.toZonedTime)(date, CST_TIMEZONE);
    return (0, date_fns_1.format)(cstDate, 'yyyy-MM-dd HH:mm:ss');
}
function generateTwoHourIntervals(startDate, endDate) {
    if ((0, date_fns_1.isAfter)(startDate, endDate)) {
        throw new Error('Start date must be before end date');
    }
    const intervals = [];
    let currentStart = startDate;
    while ((0, date_fns_1.isBefore)(currentStart, endDate)) {
        const currentEnd = (0, date_fns_1.addHours)(currentStart, 2);
        const intervalEnd = (0, date_fns_1.isAfter)(currentEnd, endDate) ? endDate : currentEnd;
        intervals.push({
            start: currentStart,
            end: intervalEnd,
            startFormatted: formatDateTimeForApi(currentStart),
            endFormatted: formatDateTimeForApi(intervalEnd)
        });
        currentStart = currentEnd;
    }
    return intervals;
}
function validateDateRange(startDateString, endDateString) {
    try {
        const startDate = parseDateTime(startDateString);
        const endDate = parseDateTime(endDateString);
        if ((0, date_fns_1.isAfter)(startDate, endDate)) {
            throw new Error('START_DATE must be before END_DATE');
        }
    }
    catch (error) {
        throw new Error(`Invalid date format. Expected format: YYYY-MM-DD HH:mm:ss. Error: ${error}`);
    }
}
//# sourceMappingURL=dateUtils.js.map