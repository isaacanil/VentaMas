import { DateTime } from 'luxon';

export type PresetValue =
  | 'today'
  | 'yesterday'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_90_days'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'this_year'
  | 'last_year'
  | 'all';

export interface PresetOption {
  label: string;
  value: PresetValue;
}

export interface PresetRange {
  start: DateTime | null;
  end: DateTime | null;
}

export const PRESETS: PresetOption[] = [
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

export const getRangeFromPreset = (
  preset: PresetValue | string,
): PresetRange => {
  const now = DateTime.local();
  switch (preset) {
    case 'today':
      return { start: now.startOf('day'), end: now.endOf('day') };
    case 'yesterday': {
      const y = now.minus({ days: 1 });
      return { start: y.startOf('day'), end: y.endOf('day') };
    }
    case 'this_month':
      return { start: now.startOf('month'), end: now.endOf('month') };
    case 'last_month': {
      const lm = now.minus({ months: 1 });
      return { start: lm.startOf('month'), end: lm.endOf('month') };
    }
    case 'last_3_months':
      return {
        start: now.minus({ months: 3 }).startOf('day'),
        end: now.endOf('day'),
      };
    case 'last_90_days':
      return {
        start: now.minus({ days: 90 }).startOf('day'),
        end: now.endOf('day'),
      };
    case 'q1': {
      const year = now.year;
      return {
        start: DateTime.fromISO(`${year}-01-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-03-31`).endOf('day'),
      };
    }
    case 'q2': {
      const year = now.year;
      return {
        start: DateTime.fromISO(`${year}-04-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-06-30`).endOf('day'),
      };
    }
    case 'q3': {
      const year = now.year;
      return {
        start: DateTime.fromISO(`${year}-07-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-09-30`).endOf('day'),
      };
    }
    case 'q4': {
      const year = now.year;
      return {
        start: DateTime.fromISO(`${year}-10-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-12-31`).endOf('day'),
      };
    }
    case 'this_year': {
      const year = now.year;
      return {
        start: DateTime.fromISO(`${year}-01-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-12-31`).endOf('day'),
      };
    }
    case 'last_year': {
      const year = now.year - 1;
      return {
        start: DateTime.fromISO(`${year}-01-01`).startOf('day'),
        end: DateTime.fromISO(`${year}-12-31`).endOf('day'),
      };
    }
    case 'all':
      return { start: null, end: null };
    default:
      return {
        start: now.minus({ days: 90 }).startOf('day'),
        end: now.endOf('day'),
      };
  }
};
