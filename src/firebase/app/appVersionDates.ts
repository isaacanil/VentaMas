import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const toAppVersionMillis = (value: unknown): number | undefined => {
  return toMillis(value as TimestampLike);
};

export const formatAppVersionBadgeLabel = (value: unknown): string => {
  const millis = toAppVersionMillis(value);
  if (millis === undefined) return '';

  const date = new Date(millis);
  const day = `0${date.getDate()}`.slice(-2);
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `Versión ${day} de ${month} ${year}`;
};

export const formatClientAppVersionDate = (
  value: unknown,
): string | undefined => {
  const millis = toAppVersionMillis(value);
  if (millis === undefined) return undefined;

  return new Date(millis).toISOString();
};
