// date‑fns es super‑ligero y rápido
import { startOfDay, addDays, addWeeks, addMonths, addYears } from 'date-fns';

/**
 * Calcula fechas de pago y la próxima fecha según frecuencia y número de cuotas.
 *
 * @param {'daily'|'weekly'|'biweekly'|'monthly'|'quarterly'|'annual'} frequency
 * @param {number} installments
 * @param {Date|number|null} [customStartDate=null]
 * @param {{ includeStartDate?: boolean }} [options]
 * @returns {{ paymentDates: number[]; nextPaymentDate: number|null }}
 */
export function calculatePaymentDates(
  frequency,
  installments,
  customStartDate = null,
  options = {},
) {
  const { includeStartDate = false } = options;
  const MAX = 3000;
  if (installments <= 0 || installments >= MAX) {
    return { paymentDates: [], nextPaymentDate: null };
  }

  // Determinar fecha de arranque al inicio del día
  const base = customStartDate
    ? startOfDay(
      typeof customStartDate === 'number'
        ? new Date(customStartDate)
        : customStartDate,
    )
    : startOfDay(new Date());

  // Mapa de intervalos
  const intervalFns = {
    daily: (d, i) => addDays(d, i + 1),
    weekly: (d, i) => addWeeks(d, i + 1),
    biweekly: (d, i) => addWeeks(d, (i + 1) * 2),
    monthly: (d, i) => addMonths(d, i + 1),
    quarterly: (d, i) => addMonths(d, (i + 1) * 3),
    annual: (d, i) => addYears(d, i + 1),
  };
  const addInterval = intervalFns[frequency] || ((d) => d);

  // Generar las fechas
  const paymentDates = Array.from({ length: installments }, (_, index) =>
    addInterval(base, includeStartDate ? index - 1 : index).getTime(),
  );

  // Próxima fecha >= hoy
  const todayTs = startOfDay(new Date()).getTime();
  const nextPaymentDate = paymentDates.find((ts) => ts >= todayTs) || null;

  return { paymentDates, nextPaymentDate };
}
