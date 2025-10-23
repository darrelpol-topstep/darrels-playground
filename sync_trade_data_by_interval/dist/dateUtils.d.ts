import { TimeInterval } from './types';
export declare function parseDateTime(dateTimeString: string): Date;
export declare function formatDateTimeForApi(date: Date): string;
export declare function generateTwoHourIntervals(startDate: Date, endDate: Date): TimeInterval[];
export declare function validateDateRange(startDateString: string, endDateString: string): void;
//# sourceMappingURL=dateUtils.d.ts.map