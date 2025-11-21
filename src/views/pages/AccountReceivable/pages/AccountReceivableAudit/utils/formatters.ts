import { DateTime } from 'luxon';

import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';

export const formatDate = (value?: number | null) => {
  if (!value) return 'N/D';
  return DateTime.fromMillis(value).toFormat('dd/MM/yyyy HH:mm');
};

export const formatPrice = (value?: number | null) =>
  useFormatPrice(value || 0, 'rd');
