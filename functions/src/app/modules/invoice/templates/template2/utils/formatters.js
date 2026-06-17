import { format as formatDateFns } from 'date-fns';

export { getDiscount } from '../../../../../core/utils/pdfDiscount.util.js';

export function money(n) {
  return Number(n).toFixed(2);
}

export function formatDate(ts) {
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return formatDateFns(date, 'dd/MM/yyyy');
}
