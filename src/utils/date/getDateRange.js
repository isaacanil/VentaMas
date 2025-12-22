import { DateTime } from 'luxon';

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
    last30Days: now.minus({ days: 30 }).startOf('day'),
  };
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
    firstQuarter: DateTime.local(
      currentYear,
      3,
      DateTime.local(currentYear, 3, 1).daysInMonth,
    )
      .endOf('month')
      .endOf('day'),
    secondQuarter: DateTime.local(
      currentYear,
      6,
      DateTime.local(currentYear, 6, 1).daysInMonth,
    )
      .endOf('month')
      .endOf('day'),
    thirdQuarter: DateTime.local(
      currentYear,
      9,
      DateTime.local(currentYear, 9, 1).daysInMonth,
    )
      .endOf('month')
      .endOf('day'),
    fourthQuarter: DateTime.local(
      currentYear,
      12,
      DateTime.local(currentYear, 12, 1).daysInMonth,
    )
      .endOf('month')
      .endOf('day'),
    last30Days: now.endOf('day'),
  };

  if (!rangeStart[parameter] || !rangeEnd[parameter]) {
    console.warn(
      `Parámetro de rango de fecha no reconocido: ${parameter}. Usando 'thisMonth' por defecto.`,
    );
    return {
      startDate: rangeStart.thisMonth.toMillis(),
      endDate: rangeEnd.thisMonth.toMillis(),
    };
  }

  return {
    startDate: rangeStart[parameter].toMillis(),
    endDate: rangeEnd[parameter].toMillis(),
  };
}
