import dayjs from 'dayjs';
import 'dayjs/locale/es';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(weekday);
dayjs.locale('es');

// Configurar para que la semana empiece en domingo
const locale = dayjs.Ls.es;
if (locale) {
  locale.weekStart = 0; // 0 = domingo
}

const getWeekRangeMondayAligned = (reference = dayjs()) => {
  const referenceStart = reference.startOf('day');
  const daysToSubtract = (referenceStart.day() + 6) % 7;
  const start = referenceStart.subtract(daysToSubtract, 'day');
  const end = start.add(6, 'day').endOf('day');
  return { start, end };
};

export const createDefaultPresets = (mode = 'single') => [
  {
    label: 'Hoy',
    value:
      mode === 'range'
        ? [dayjs().startOf('day'), dayjs().endOf('day')]
        : dayjs().startOf('day'),
  },
  {
    label: 'Ayer',
    value:
      mode === 'range'
        ? [
            dayjs().subtract(1, 'day').startOf('day'),
            dayjs().subtract(1, 'day').endOf('day'),
          ]
        : dayjs().subtract(1, 'day').startOf('day'),
  },
  {
    label: 'Esta semana',
    value: (() => {
      const { start, end } = getWeekRangeMondayAligned(dayjs());
      return mode === 'range' ? [start, end] : start;
    })(),
  },
  {
    label: 'Este mes',
    value:
      mode === 'range'
        ? [dayjs().startOf('month'), dayjs().endOf('month')]
        : dayjs().startOf('month'),
  },
  {
    label: 'Este año',
    value:
      mode === 'range'
        ? [dayjs().startOf('year'), dayjs().endOf('year')]
        : dayjs().startOf('year'),
  },
  // Períodos recientes
  {
    label: 'Últimos 7 días',
    value:
      mode === 'range'
        ? [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]
        : dayjs().subtract(6, 'day').startOf('day'),
    group: 'Períodos recientes',
  },
  {
    label: 'Últimos 30 días',
    value:
      mode === 'range'
        ? [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]
        : dayjs().subtract(29, 'day').startOf('day'),
    group: 'Períodos recientes',
  },
  {
    label: 'Últimos 90 días',
    value:
      mode === 'range'
        ? [dayjs().subtract(89, 'day').startOf('day'), dayjs().endOf('day')]
        : dayjs().subtract(89, 'day').startOf('day'),
    group: 'Períodos recientes',
  },
  // Períodos pasados
  {
    label: 'Semana pasada',
    value: (() => {
      const reference = dayjs().subtract(1, 'week');
      const { start, end } = getWeekRangeMondayAligned(reference);
      return mode === 'range' ? [start, end] : start;
    })(),
    group: 'Períodos pasados',
  },
  {
    label: 'Mes pasado',
    value:
      mode === 'range'
        ? [
            dayjs().subtract(1, 'month').startOf('month'),
            dayjs().subtract(1, 'month').endOf('month'),
          ]
        : dayjs().subtract(1, 'month').startOf('month'),
    group: 'Períodos pasados',
  },
  {
    label: 'Año pasado',
    value:
      mode === 'range'
        ? [
            dayjs().subtract(1, 'year').startOf('year'),
            dayjs().subtract(1, 'year').endOf('year'),
          ]
        : dayjs().subtract(1, 'year').startOf('year'),
    group: 'Períodos pasados',
  },
  // Trimestres actuales
  {
    label: 'Primer trimestre',
    value:
      mode === 'range'
        ? [
            dayjs().startOf('year'),
            dayjs().startOf('year').add(2, 'month').endOf('month'),
          ]
        : dayjs().startOf('year'),
    group: 'Trimestres',
  },
  {
    label: 'Segundo trimestre',
    value:
      mode === 'range'
        ? [
            dayjs().startOf('year').add(3, 'month'),
            dayjs().startOf('year').add(5, 'month').endOf('month'),
          ]
        : dayjs().startOf('year').add(3, 'month'),
    group: 'Trimestres',
  },
  {
    label: 'Tercer trimestre',
    value:
      mode === 'range'
        ? [
            dayjs().startOf('year').add(6, 'month'),
            dayjs().startOf('year').add(8, 'month').endOf('month'),
          ]
        : dayjs().startOf('year').add(6, 'month'),
    group: 'Trimestres',
  },
  {
    label: 'Cuarto trimestre',
    value:
      mode === 'range'
        ? [
            dayjs().startOf('year').add(9, 'month'),
            dayjs().startOf('year').add(11, 'month').endOf('month'),
          ]
        : dayjs().startOf('year').add(9, 'month'),
    group: 'Trimestres',
  },
];

export const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
