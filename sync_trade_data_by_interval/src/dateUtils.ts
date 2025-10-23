import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours, parseISO, isAfter, isBefore, format } from 'date-fns';
import { TimeInterval } from './types';

const CST_TIMEZONE = 'America/Chicago';

export function parseDateTime(dateTimeString: string): Date {
  const parsedDate = parseISO(dateTimeString.replace(' ', 'T'));
  return fromZonedTime(parsedDate, CST_TIMEZONE);
}

export function formatDateTimeForApi(date: Date): string {
  const cstDate = toZonedTime(date, CST_TIMEZONE);
  return format(cstDate, 'yyyy-MM-dd HH:mm:ss');
}

export function generateTwoHourIntervals(startDate: Date, endDate: Date): TimeInterval[] {
  if (isAfter(startDate, endDate)) {
    throw new Error('Start date must be before end date');
  }

  const intervals: TimeInterval[] = [];
  let currentStart = startDate;

  while (isBefore(currentStart, endDate)) {
    const currentEnd = addHours(currentStart, 2);
    
    const intervalEnd = isAfter(currentEnd, endDate) ? endDate : currentEnd;

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

export function validateDateRange(startDateString: string, endDateString: string): void {
  try {
    const startDate = parseDateTime(startDateString);
    const endDate = parseDateTime(endDateString);
    
    if (isAfter(startDate, endDate)) {
      throw new Error('START_DATE must be before END_DATE');
    }
  } catch (error) {
    throw new Error(`Invalid date format. Expected format: YYYY-MM-DD HH:mm:ss. Error: ${error}`);
  }
}