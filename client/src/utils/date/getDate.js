import { DateTime } from 'luxon';

export function getDate(type) {
  const actions = {
    'today': () => DateTime.local().toMillis(),
    'yesterday': () => DateTime.local().minus({ days: 1 }).toMillis(),
    'tomorrow': () => DateTime.local().plus({ days: 1 }).toMillis(),
    'thisWeek': () => DateTime.local().startOf('week').toMillis(),
    'lastWeek': () => DateTime.local().minus({ weeks: 1 }).startOf('week').toMillis(),
    'nextWeek': () => DateTime.local().plus({ weeks: 1 }).startOf('week').toMillis(),
    'thisMonth': () => DateTime.local().startOf('month').toMillis(),
    'lastMonth': () => DateTime.local().minus({ months: 1 }).startOf('month').toMillis(),
    'nextMonth': () => DateTime.local().plus({ months: 1 }).startOf('month').toMillis(),
    'thisYear': () => DateTime.local().startOf('year').toMillis(),
    'lastYear': () => DateTime.local().minus({ years: 1 }).startOf('year').toMillis(),
    'nextYear': () => DateTime.local().plus({ years: 1 }).startOf('year').toMillis(),
    'thisQuarter': () => DateTime.local().startOf('quarter').toMillis(),
    'lastQuarter': () => DateTime.local().minus({ quarters: 1 }).startOf('quarter').toMillis(),
    'nextQuarter': () => DateTime.local().plus({ quarters: 1 }).startOf('quarter').toMillis(),
    'firstQuarter': () => DateTime.local().startOf('year').toMillis(),
    'secondQuarter': () => DateTime.local().startOf('year').plus({ months: 3 }).toMillis(),
    'thirdQuarter': () => DateTime.local().startOf('year').plus({ months: 6 }).toMillis(),
    'fourthQuarter': () => DateTime.local().startOf('year').plus({ months: 9 }).toMillis(),
  };

  return (actions[type] || (() => null))();
}
