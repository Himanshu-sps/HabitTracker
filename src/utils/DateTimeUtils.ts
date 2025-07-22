export const DATE_FORMAT_DISPLAY = 'DD-MMM-YYYY';
export const DATE_FORMAT_DISPLAY_DAY_MONTH_DATE = 'dddd, MMMM D';
export const TIME_FORMAT_DISPLAY = 'hh:mm A';
export const DATE_FORMAT_ZERO = 'YYYY-MM-DD[T]00:00:00.000[Z]';

import moment from 'moment';

/**
 * Format a date string or Date object to a desired display format.
 * @param date - The date to format (string or Date)
 * @param outputFormat - The format to output (default: DATE_FORMAT_DISPLAY)
 * @param inputFormat - The format of the input string (optional)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  outputFormat: string = DATE_FORMAT_DISPLAY,
  inputFormat?: string,
): string {
  if (typeof date === 'string' && inputFormat) {
    return moment(date, inputFormat).format(outputFormat);
  }
  return moment(date).format(outputFormat);
}

export function getDaysDifference(startDate: string, endDate: string): number {
  const start = moment(startDate, DATE_FORMAT_ZERO);
  const end = moment(endDate, DATE_FORMAT_ZERO);
  return end.diff(start, 'days');
}

/**
 * Convert a date string to a UTC ISO string.
 * @param date - The date to convert (string or Date)
 * @param inputFormat - The format of the input string (optional)
 * @returns UTC ISO string
 */
export function toUTCISOString(
  date: string | Date,
  inputFormat?: string,
): string {
  if (typeof date === 'string' && inputFormat) {
    return moment(date, inputFormat).utc().toISOString();
  }
  return moment(date).utc().toISOString();
}

/**
 * Convert a date and time string to a UTC ISO string.
 * @param date - The date part (string)
 * @param time - The time part (string)
 * @param dateFormat - The format of the date part (default: DATE_FORMAT_DISPLAY)
 * @param timeFormat - The format of the time part (default: 'hh:mm A')
 * @returns UTC ISO string
 */
export function toUTCTimeString(
  date: string,
  time: string,
  dateFormat: string = DATE_FORMAT_DISPLAY,
  timeFormat: string = 'hh:mm A',
): string {
  const dateTime = moment(`${date} ${time}`, `${dateFormat} ${timeFormat}`);
  return dateTime.utc().toISOString();
}
