import type { ReactNode } from 'react';

import {
  ProgressBar,
  ProgressFill,
  UsageBox,
  UsageBoxHeader,
  UsageIconWrap,
  UsageLabel,
  UsageLimit,
  UsageNumbers,
  UsagePct,
  UsageUsed,
} from './SubscriptionOverviewCard.styles';

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('es-DO').format(value);

interface UsageItemProps {
  icon: ReactNode;
  label: string;
  used: number;
  limit: number;
}

export const UsageItem = ({ icon, label, used, limit }: UsageItemProps) => {
  const isUnlimited = limit < 0;
  const safeLimit = isUnlimited ? Math.max(used, 1) : Math.max(limit, 1);
  const pct = isUnlimited
    ? 0
    : Math.min(100, Math.round((used / safeLimit) * 100));
  const isCritical = !isUnlimited && pct >= 95;
  const isHigh = !isUnlimited && pct >= 80;

  return (
    <UsageBox>
      <UsageBoxHeader>
        <UsageIconWrap $critical={isCritical} $high={isHigh}>
          {icon}
        </UsageIconWrap>
        <UsageLabel>{label}</UsageLabel>
      </UsageBoxHeader>
      <UsageNumbers>
        <UsageUsed>{formatNumber(used)}</UsageUsed>
        <UsageLimit>
          / {isUnlimited ? 'Ilimitado' : formatNumber(limit)}
        </UsageLimit>
      </UsageNumbers>
      <ProgressBar>
        <ProgressFill $pct={pct} $critical={isCritical} $high={isHigh} />
      </ProgressBar>
      <UsagePct $critical={isCritical} $high={isHigh}>
        {isUnlimited ? 'Sin tope definido' : `${pct}% utilizado`}
      </UsagePct>
    </UsageBox>
  );
};
