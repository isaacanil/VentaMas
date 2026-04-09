import { DateTime } from 'luxon';
import type { DatePickerMode, DatePickerPreset } from '../types';

const DATE_LOCALE = 'es';

const getWeekRangeMondayAligned = (
  reference = DateTime.local().setLocale(DATE_LOCALE),
) => {
  const referenceStart = reference.startOf('day');
  const daysToSubtract = (referenceStart.weekday + 6) % 7;
  const start = referenceStart.minus({ days: daysToSubtract });
  const end = start.plus({ days: 6 }).endOf('day');
  return { start, end };
};

export const createDefaultPresets = (
  mode: DatePickerMode = 'single',
): DatePickerPreset[] => [
  {
    label: 'Hoy',
    value:
      mode === 'range'
        ? [
            DateTime.local().setLocale(DATE_LOCALE).startOf('day'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('day'),
          ]
        : DateTime.local().setLocale(DATE_LOCALE).startOf('day'),
  },
  {
    label: 'Ayer',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ days: 1 })
              .startOf('day'),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ days: 1 })
              .endOf('day'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ days: 1 })
            .startOf('day'),
  },
  {
    label: 'Esta semana',
    value: (() => {
      const { start, end } = getWeekRangeMondayAligned(
        DateTime.local().setLocale(DATE_LOCALE),
      );
      return mode === 'range' ? [start, end] : start;
    })(),
  },
  {
    label: 'Este mes',
    value:
      mode === 'range'
        ? [
            DateTime.local().setLocale(DATE_LOCALE).startOf('month'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('month'),
          ]
        : DateTime.local().setLocale(DATE_LOCALE).startOf('month'),
  },
  {
    label: 'Este año',
    value:
      mode === 'range'
        ? [
            DateTime.local().setLocale(DATE_LOCALE).startOf('year'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('year'),
          ]
        : DateTime.local().setLocale(DATE_LOCALE).startOf('year'),
  },
  // Periodos recientes
  {
    label: 'Últimos 7 días',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ days: 6 })
              .startOf('day'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('day'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ days: 6 })
            .startOf('day'),
    group: 'Periodos recientes',
  },
  {
    label: 'Últimos 30 días',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ days: 29 })
              .startOf('day'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('day'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ days: 29 })
            .startOf('day'),
    group: 'Periodos recientes',
  },
  {
    label: 'Últimos 90 días',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ days: 89 })
              .startOf('day'),
            DateTime.local().setLocale(DATE_LOCALE).endOf('day'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ days: 89 })
            .startOf('day'),
    group: 'Periodos recientes',
  },
  // Periodos pasados
  {
    label: 'Semana pasada',
    value: (() => {
      const reference = DateTime.local()
        .setLocale(DATE_LOCALE)
        .minus({ weeks: 1 });
      const { start, end } = getWeekRangeMondayAligned(reference);
      return mode === 'range' ? [start, end] : start;
    })(),
    group: 'Periodos pasados',
  },
  {
    label: 'Mes pasado',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ months: 1 })
              .startOf('month'),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ months: 1 })
              .endOf('month'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ months: 1 })
            .startOf('month'),
    group: 'Periodos pasados',
  },
  {
    label: 'Año pasado',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ years: 1 })
              .startOf('year'),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .minus({ years: 1 })
              .endOf('year'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .minus({ years: 1 })
            .startOf('year'),
    group: 'Periodos pasados',
  },
  // Trimestres actuales
  {
    label: 'Primer trimestre',
    value:
      mode === 'range'
        ? [
            DateTime.local().setLocale(DATE_LOCALE).startOf('year'),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 2 })
              .endOf('month'),
          ]
        : DateTime.local().setLocale(DATE_LOCALE).startOf('year'),
    group: 'Trimestres',
  },
  {
    label: 'Segundo trimestre',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 3 }),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 5 })
              .endOf('month'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .startOf('year')
            .plus({ months: 3 }),
    group: 'Trimestres',
  },
  {
    label: 'Tercer trimestre',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 6 }),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 8 })
              .endOf('month'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .startOf('year')
            .plus({ months: 6 }),
    group: 'Trimestres',
  },
  {
    label: 'Cuarto trimestre',
    value:
      mode === 'range'
        ? [
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 9 }),
            DateTime.local()
              .setLocale(DATE_LOCALE)
              .startOf('year')
              .plus({ months: 11 })
              .endOf('month'),
          ]
        : DateTime.local()
            .setLocale(DATE_LOCALE)
            .startOf('year')
            .plus({ months: 9 }),
    group: 'Trimestres',
  },
];

export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
