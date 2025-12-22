import { DateTime } from 'luxon';

import { formatPrice as formatCurrency } from '@/utils/format';

export const formatDate = (value?: number | null) => {
  if (!value) return 'N/D';
  return DateTime.fromMillis(value).toFormat('dd/MM/yyyy HH:mm');
};

export const formatPrice = (value?: number | null) =>
  formatCurrency(value || 0, 'rd');
