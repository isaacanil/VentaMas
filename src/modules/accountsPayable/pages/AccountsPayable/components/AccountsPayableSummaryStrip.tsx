import styled from 'styled-components';

import { formatPrice } from '@/utils/format/formatPrice';

import type {
  AccountsPayableAgingBucket,
  AccountsPayableSummary,
} from '../utils/accountsPayableDashboard';

interface AccountsPayableSummaryStripProps {
  activeBucket: AccountsPayableAgingBucket | 'all';
  onSelectBucket: (bucket: AccountsPayableAgingBucket | 'all') => void;
  summary: AccountsPayableSummary;
}

export const AccountsPayableSummaryStrip = ({
  activeBucket,
  onSelectBucket,
  summary,
}: AccountsPayableSummaryStripProps) => {
  return (
    <Grid>
      <SummaryButton
        $active={activeBucket === 'all'}
        onClick={() => onSelectBucket('all')}
        type="button"
      >
        <span>Abierto total</span>
        <strong>{formatPrice(summary.totalBalanceAmount)}</strong>
        <small>{summary.totalCount} compras</small>
      </SummaryButton>

      {summary.buckets.map((bucket) => (
        <SummaryButton
          key={bucket.key}
          $active={activeBucket === bucket.key}
          onClick={() => onSelectBucket(bucket.key)}
          type="button"
        >
          <span>{bucket.label}</span>
          <strong>{formatPrice(bucket.balanceAmount)}</strong>
          <small>{bucket.count} registros</small>
        </SummaryButton>
      ))}
    </Grid>
  );
};

const Grid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(180px, 220px);
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 12px 4px;
  scrollbar-width: thin;
`;

const SummaryButton = styled.button<{ $active: boolean }>`
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 88px;
  padding: 12px 14px;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? 'var(--ds-color-border-brand, #1677ff)'
        : 'var(--ds-color-border-default, #d9d9d9)'};
  border-radius: 14px;
  background: ${({ $active }) =>
    $active
      ? 'var(--ds-color-interactive-hover-bg, #f0f7ff)'
      : 'var(--ds-color-bg-surface, #fff)'};
  text-align: left;
  cursor: pointer;

  span {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ds-color-text-secondary, #666);
  }

  strong {
    font-size: 16px;
    color: var(--ds-color-text-primary, #111);
  }

  small {
    color: var(--ds-color-text-secondary, #666);
  }
`;
