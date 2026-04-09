import { getTimeElapsed } from '@/hooks/useFormatTime';
import { Tag } from '@/components/ui/Tag/Tag';
import { formatPrice } from '@/utils/format';

import { getColorByStatus, getStatusLabel } from '../utils';

export const PriceCell = ({
  value,
}: {
  value: number | string | null | undefined;
}) => <span>{formatPrice(value)}</span>;

export const DateCell = ({ value }: { value: number | null | undefined }) => {
  if (!value || !Number.isFinite(value)) {
    return <span>Sin fecha</span>;
  }

  const time = value * 1000;
  return <span>{getTimeElapsed(time, 0)}</span>;
};

export const StatusCell = ({ value }: { value: string | null | undefined }) => (
  <Tag color={getColorByStatus(value)}>{getStatusLabel(value)}</Tag>
);
