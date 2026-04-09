import { DateTime } from 'luxon';

const DATE_LOCALE = 'es';

const startOfWeekSunday = (date: DateTime) =>
  date.minus({ days: date.weekday % 7 }).startOf('day');

const endOfWeekSunday = (date: DateTime) =>
  startOfWeekSunday(date).plus({ days: 6 }).endOf('day');

export const buildCreditNoteFilterPresets = () => {
  const now = DateTime.local().setLocale(DATE_LOCALE);

  return [
    {
      label: 'Hoy',
      value: [now.startOf('day'), now.endOf('day')],
    },
    {
      label: 'Ayer',
      value: [
        now.minus({ days: 1 }).startOf('day'),
        now.minus({ days: 1 }).endOf('day'),
      ],
    },
    {
      label: 'Esta semana',
      value: [startOfWeekSunday(now), endOfWeekSunday(now)],
    },
    {
      label: 'Este mes',
      value: [now.startOf('month'), now.endOf('month')],
    },
    {
      label: 'Este año',
      value: [now.startOf('year'), now.endOf('year')],
    },
    {
      label: 'Ultimos 7 dias',
      value: [now.minus({ days: 6 }).startOf('day'), now.endOf('day')],
    },
    {
      label: 'Ultimos 30 dias',
      value: [now.minus({ days: 29 }).startOf('day'), now.endOf('day')],
    },
  ];
};
