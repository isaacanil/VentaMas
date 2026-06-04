import { getLocalizedNow } from './dateLocale';
import type { DatePickerMode, DatePickerPreset } from '../types';

const getWeekRangeMondayAligned = (reference = getLocalizedNow()) => {
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
        ? [getLocalizedNow().startOf('day'), getLocalizedNow().endOf('day')]
        : getLocalizedNow().startOf('day'),
  },
  {
    label: 'Ayer',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().minus({ days: 1 }).startOf('day'),
            getLocalizedNow().minus({ days: 1 }).endOf('day'),
          ]
        : getLocalizedNow().minus({ days: 1 }).startOf('day'),
  },
  {
    label: 'Esta semana',
    value: (() => {
      const { start, end } = getWeekRangeMondayAligned(getLocalizedNow());
      return mode === 'range' ? [start, end] : start;
    })(),
  },
  {
    label: 'Este mes',
    value:
      mode === 'range'
        ? [getLocalizedNow().startOf('month'), getLocalizedNow().endOf('month')]
        : getLocalizedNow().startOf('month'),
  },
  {
    label: 'Este año',
    value:
      mode === 'range'
        ? [getLocalizedNow().startOf('year'), getLocalizedNow().endOf('year')]
        : getLocalizedNow().startOf('year'),
  },
  // Periodos recientes
  {
    label: 'Últimos 7 días',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().minus({ days: 6 }).startOf('day'),
            getLocalizedNow().endOf('day'),
          ]
        : getLocalizedNow().minus({ days: 6 }).startOf('day'),
    group: 'Periodos recientes',
  },
  {
    label: 'Últimos 30 días',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().minus({ days: 29 }).startOf('day'),
            getLocalizedNow().endOf('day'),
          ]
        : getLocalizedNow().minus({ days: 29 }).startOf('day'),
    group: 'Periodos recientes',
  },
  {
    label: 'Últimos 90 días',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().minus({ days: 89 }).startOf('day'),
            getLocalizedNow().endOf('day'),
          ]
        : getLocalizedNow().minus({ days: 89 }).startOf('day'),
    group: 'Periodos recientes',
  },
  // Periodos pasados
  {
    label: 'Semana pasada',
    value: (() => {
      const reference = getLocalizedNow().minus({ weeks: 1 });
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
            getLocalizedNow().minus({ months: 1 }).startOf('month'),
            getLocalizedNow().minus({ months: 1 }).endOf('month'),
          ]
        : getLocalizedNow().minus({ months: 1 }).startOf('month'),
    group: 'Periodos pasados',
  },
  {
    label: 'Año pasado',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().minus({ years: 1 }).startOf('year'),
            getLocalizedNow().minus({ years: 1 }).endOf('year'),
          ]
        : getLocalizedNow().minus({ years: 1 }).startOf('year'),
    group: 'Periodos pasados',
  },
  // Trimestres actuales
  {
    label: 'Primer trimestre',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().startOf('year'),
            getLocalizedNow()
              .startOf('year')
              .plus({ months: 2 })
              .endOf('month'),
          ]
        : getLocalizedNow().startOf('year'),
    group: 'Trimestres',
  },
  {
    label: 'Segundo trimestre',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().startOf('year').plus({ months: 3 }),
            getLocalizedNow()
              .startOf('year')
              .plus({ months: 5 })
              .endOf('month'),
          ]
        : getLocalizedNow().startOf('year').plus({ months: 3 }),
    group: 'Trimestres',
  },
  {
    label: 'Tercer trimestre',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().startOf('year').plus({ months: 6 }),
            getLocalizedNow()
              .startOf('year')
              .plus({ months: 8 })
              .endOf('month'),
          ]
        : getLocalizedNow().startOf('year').plus({ months: 6 }),
    group: 'Trimestres',
  },
  {
    label: 'Cuarto trimestre',
    value:
      mode === 'range'
        ? [
            getLocalizedNow().startOf('year').plus({ months: 9 }),
            getLocalizedNow()
              .startOf('year')
              .plus({ months: 11 })
              .endOf('month'),
          ]
        : getLocalizedNow().startOf('year').plus({ months: 9 }),
    group: 'Trimestres',
  },
];

export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
