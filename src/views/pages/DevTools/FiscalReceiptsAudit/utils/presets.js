import dayjs from 'dayjs';

export const PRESETS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Este mes', value: 'this_month' },
  { label: 'Mes pasado', value: 'last_month' },
  { label: 'Últimos 3 meses', value: 'last_3_months' },
  { label: 'Últimos 90 días', value: 'last_90_days' },
  { label: 'Trimestre 1 (Ene-Mar)', value: 'q1' },
  { label: 'Trimestre 2 (Abr-Jun)', value: 'q2' },
  { label: 'Trimestre 3 (Jul-Sep)', value: 'q3' },
  { label: 'Trimestre 4 (Oct-Dic)', value: 'q4' },
  { label: 'Este año', value: 'this_year' },
  { label: 'Año pasado', value: 'last_year' },
  { label: 'Todas (sin filtro de fechas)', value: 'all' },
];

export const getRangeFromPreset = (preset) => {
  const now = dayjs();
  switch (preset) {
    case 'today':
      return { start: now.startOf('day'), end: now.endOf('day') };
    case 'yesterday': {
      const y = now.subtract(1, 'day');
      return { start: y.startOf('day'), end: y.endOf('day') };
    }
    case 'this_month':
      return { start: now.startOf('month'), end: now.endOf('month') };
    case 'last_month': {
      const lm = now.subtract(1, 'month');
      return { start: lm.startOf('month'), end: lm.endOf('month') };
    }
    case 'last_3_months':
      return {
        start: now.subtract(3, 'month').startOf('day'),
        end: now.endOf('day'),
      };
    case 'last_90_days':
      return {
        start: now.subtract(90, 'day').startOf('day'),
        end: now.endOf('day'),
      };
    case 'q1': {
      const year = now.year();
      return {
        start: dayjs(`${year}-01-01`).startOf('day'),
        end: dayjs(`${year}-03-31`).endOf('day'),
      };
    }
    case 'q2': {
      const year = now.year();
      return {
        start: dayjs(`${year}-04-01`).startOf('day'),
        end: dayjs(`${year}-06-30`).endOf('day'),
      };
    }
    case 'q3': {
      const year = now.year();
      return {
        start: dayjs(`${year}-07-01`).startOf('day'),
        end: dayjs(`${year}-09-30`).endOf('day'),
      };
    }
    case 'q4': {
      const year = now.year();
      return {
        start: dayjs(`${year}-10-01`).startOf('day'),
        end: dayjs(`${year}-12-31`).endOf('day'),
      };
    }
    case 'this_year': {
      const year = now.year();
      return {
        start: dayjs(`${year}-01-01`).startOf('day'),
        end: dayjs(`${year}-12-31`).endOf('day'),
      };
    }
    case 'last_year': {
      const year = now.year() - 1;
      return {
        start: dayjs(`${year}-01-01`).startOf('day'),
        end: dayjs(`${year}-12-31`).endOf('day'),
      };
    }
    case 'all':
      return { start: null, end: null };
    default:
      return {
        start: now.subtract(90, 'day').startOf('day'),
        end: now.endOf('day'),
      };
  }
};
