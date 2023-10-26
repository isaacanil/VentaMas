import { DateTime } from 'luxon';
/**
 * Returns a date range object with a start and end date based on the specified parameter.
 * 
 * @param {string} parameter - The descriptor for the desired date range (e.g., 'today', 'thisWeek', etc.)
 * @returns {Object} An object with a 'startDate' and 'endDate' property, each being a Luxon DateTime object.
 */


export function getDateRange(parameter) {
    const now = DateTime.local();
    
    const currentYear = now.year;
    const rangeStart = {
        empty: null,
        today: now.startOf('day'),
        yesterday: now.minus({ days: 1 }).startOf('day'),
        thisWeek: now.startOf('week'),
        lastWeek: now.minus({ weeks: 1 }).startOf('week'),
        thisMonth: now.startOf('month'),
        lastMonth: now.minus({ months: 1 }).startOf('month'),
        thisYear: now.startOf('year'),
        lastYear: now.minus({ years: 1 }).startOf('year'),
        thisQuarter: now.startOf('quarter'),
        lastQuarter: now.minus({ quarters: 1 }).startOf('quarter'),
        firstQuarter: DateTime.local(currentYear, 1, 1).startOf('day'),
        secondQuarter: DateTime.local(currentYear, 4, 1).startOf('day'),
        thirdQuarter: DateTime.local(currentYear, 7, 1).startOf('day'),
        fourthQuarter: DateTime.local(currentYear, 10, 1).startOf('day'),
    }
    const rangeEnd = {
        empty: null,
        today: now.endOf('day'),
        yesterday: now.minus({ days: 1 }).endOf('day'),
        thisWeek: now.endOf('week'),
        lastWeek: now.minus({ weeks: 1 }).endOf('week'),
        thisMonth: now.endOf('month'),
        lastMonth: now.minus({ months: 1 }).endOf('month'),
        thisYear: now.endOf('year'),
        lastYear: now.minus({ years: 1 }).endOf('year'),
        thisQuarter: now.endOf('quarter'),
        lastQuarter: now.minus({ quarters: 1 }).endOf('quarter'),
        firstQuarter: DateTime.local(currentYear, 3, DateTime.local(currentYear, 3, 1).daysInMonth).endOf('month').endOf('day'),
        secondQuarter: DateTime.local(currentYear, 6, DateTime.local(currentYear, 6, 1).daysInMonth).endOf('month').endOf('day'),
        thirdQuarter: DateTime.local(currentYear, 9, DateTime.local(currentYear, 9, 1).daysInMonth).endOf('month').endOf('day'),
        fourthQuarter: DateTime.local(currentYear, 12, DateTime.local(currentYear, 12, 1).daysInMonth).endOf('month').endOf('day'),
    }

    return { 
        startDate: rangeStart[parameter].toMillis(), 
        endDate: rangeEnd[parameter].toMillis()
    };
}




