const padDatePart = (value: number) => String(value).padStart(2, '0');

export type FiscalCalendarTone = 'success' | 'warning';

export interface FiscalCalendarItem {
  date: Date;
  label: string;
  tone: FiscalCalendarTone;
}

export const parsePeriodStart = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number);
  if (!year || !month) return new Date();
  return new Date(year, month - 1, 1);
};

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

export const buildFiscalDate = (
  periodKey: string,
  monthOffset: number,
  day: number,
) => {
  const periodStart = parsePeriodStart(periodKey);
  return new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + monthOffset,
    day,
  );
};

export const formatFiscalDate = (date: Date) =>
  [
    padDatePart(date.getDate()),
    padDatePart(date.getMonth() + 1),
    date.getFullYear(),
  ].join('/');

export const getDaysUntil = (date: Date) => {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.ceil(
    (targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
};

export const getFiscalCalendarItems = (
  periodKey: string,
): FiscalCalendarItem[] => {
  const nextMonth = addMonths(parsePeriodStart(periodKey), 1);
  const monthLabel = nextMonth.toLocaleDateString('es-DO', { month: 'long' });
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return [
    {
      date: buildFiscalDate(periodKey, 1, 15),
      label: 'Envio formatos 606, 607, 608',
      tone: 'warning',
    },
    {
      date: buildFiscalDate(periodKey, 1, 20),
      label: `Pago ITBIS (IT-1) - ${capitalizedMonth}`,
      tone: 'warning',
    },
    {
      date: buildFiscalDate(periodKey, 1, 30),
      label: 'Retención ISR asalariados',
      tone: 'success',
    },
    {
      date: buildFiscalDate(periodKey, 2, 15),
      label: 'Envio IR-17 - anticipo',
      tone: 'success',
    },
    {
      date: buildFiscalDate(periodKey, 3, 28),
      label: 'Declaración jurada anual IR-2',
      tone: 'success',
    },
  ];
};
