export type DueDateOptionValue =
  | 'immediate'
  | '3_days'
  | '1_week'
  | '2_weeks'
  | '15_days'
  | '1_month'
  | '45_days'
  | '2_months'
  | '3_months'
  | '6_months'
  | '1_year'
  | 'custom';

export type DuePeriodField = 'months' | 'weeks' | 'days';

export interface DuePeriod {
  months: number;
  weeks: number;
  days: number;
}

export interface CustomDuePeriodField {
  key: DuePeriodField;
  label: string;
}

interface DueDateOption {
  value: DueDateOptionValue;
  label: string;
  sub: string;
}

export const getDueDateToggleMessage = (checked: boolean) =>
  checked ? 'Vencimiento habilitado' : 'Vencimiento deshabilitado';

export const PREDEFINED_DUE_PERIODS: Record<
  Exclude<DueDateOptionValue, 'custom'>,
  DuePeriod
> = {
  immediate: { weeks: 0, days: 0, months: 0 },
  '3_days': { weeks: 0, days: 3, months: 0 },
  '1_week': { weeks: 1, days: 0, months: 0 },
  '2_weeks': { weeks: 2, days: 0, months: 0 },
  '15_days': { weeks: 0, days: 15, months: 0 },
  '1_month': { weeks: 0, days: 0, months: 1 },
  '45_days': { weeks: 0, days: 45, months: 0 },
  '2_months': { weeks: 0, days: 0, months: 2 },
  '3_months': { weeks: 0, days: 0, months: 3 },
  '6_months': { weeks: 0, days: 0, months: 6 },
  '1_year': { weeks: 0, days: 0, months: 12 },
};

export const DUE_DATE_OPTIONS: DueDateOption[] = [
  { value: 'immediate', label: 'Inmediato', sub: 'Al emitir' },
  { value: '1_week', label: '1 semana', sub: '7 dias' },
  { value: '15_days', label: '15 dias', sub: 'Quincenal' },
  { value: '1_month', label: '1 mes', sub: '30 dias' },
  { value: 'custom', label: 'Personalizado', sub: 'Definir plazo' },
];

export const CUSTOM_DUE_PERIOD_FIELDS: CustomDuePeriodField[] = [
  { key: 'months', label: 'Meses' },
  { key: 'weeks', label: 'Semanas' },
  { key: 'days', label: 'Dias' },
];
