export type WarrantyOption = {
  value: string;
  label: string;
};

export const warrantyOptions: WarrantyOption[] = [
  {
    value: 'days',
    label: 'Días',
  },
  {
    value: 'weeks',
    label: 'Semanas',
  },
  {
    value: 'months',
    label: 'Meses',
  },
  {
    value: 'years',
    label: 'Años',
  },
];

const UNITS_MAP = {
  day: 'día',
  days: 'días',
  week: 'semana',
  weeks: 'semanas',
  month: 'mes',
  months: 'meses',
  year: 'año',
  years: 'años',
};

export const convertTimeToSpanish = (
  cantidad: number | string,
  unidad: string,
) => {
  if (!unidad) return 'Unidad no reconocida';

  const normalizedUnit = unidad.toLowerCase();
  const unidadEnEspañol = UNITS_MAP[normalizedUnit];

  if (!unidadEnEspañol) return 'Unidad no reconocida';

  const amount = Number(cantidad);
  if (Number.isNaN(amount)) return `0 ${unidadEnEspañol}`;

  return amount === 1 ? `1 ${unidadEnEspañol}` : `${amount} ${unidadEnEspañol}`;
};
