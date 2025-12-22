import { toMillis } from './toMillis';

export const toValidDate = (value) => {
  const millis = toMillis(value);
  if (!Number.isFinite(millis)) return null;

  const d = new Date(millis);
  return Number.isFinite(d.getTime()) ? d : null;
};

