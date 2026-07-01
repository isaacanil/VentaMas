import styled from 'styled-components';

import { formatPrice } from '@/utils/format/formatPrice';

import type {
  AccountsPayableAgingBucket,
  AccountsPayableReviewQueueKey,
  AccountsPayableSummary,
} from '../utils/accountsPayableDashboard';

interface AccountsPayableSummaryStripProps {
  activeBucket: AccountsPayableAgingBucket | 'all';
  activeReviewQueue: AccountsPayableReviewQueueKey | 'all';
  hasError?: boolean;
  loading?: boolean;
  onSelectBucket: (bucket: AccountsPayableAgingBucket | 'all') => void;
  onSelectReviewQueue: (
    reviewQueue: AccountsPayableReviewQueueKey | 'all',
  ) => void;
  scopeNotice?: string | null;
  summary: AccountsPayableSummary;
}

export const AccountsPayableSummaryStrip = ({
  activeBucket,
  activeReviewQueue,
  hasError = false,
  loading = false,
  onSelectBucket,
  onSelectReviewQueue,
  scopeNotice,
  summary,
}: AccountsPayableSummaryStripProps) => {
  const dataState = loading ? 'loading' : hasError ? 'error' : 'ready';
  const visibleScopeNotice =
    dataState === 'ready' ? (scopeNotice?.trim() ?? '') : '';
  const renderAmount = (value: number) => {
    if (dataState === 'loading') return <MetricState>Cargando</MetricState>;
    if (dataState === 'error') return <MetricState>Sin confirmar</MetricState>;
    return formatPrice(value);
  };
  const renderCount = (value: number, label: string) => {
    if (dataState === 'loading') return 'Actualizando datos';
    if (dataState === 'error') return 'Revisa el aviso de carga';
    return `${value} ${label}`;
  };

  return (
    <SummaryStack>
      {visibleScopeNotice ? (
        <ScopeNotice aria-live="polite" role="status">
          <strong>Resumen parcial</strong>
          <span>{visibleScopeNotice}</span>
        </ScopeNotice>
      ) : null}

      <Grid aria-label="Resumen aging CxP">
        <SummaryButton
          $active={activeBucket === 'all'}
          aria-pressed={activeBucket === 'all'}
          onClick={() => onSelectBucket('all')}
          type="button"
        >
          <span>Abierto total</span>
          <strong>{renderAmount(summary.totalBalanceAmount)}</strong>
          <small>{renderCount(summary.totalCount, 'compras')}</small>
        </SummaryButton>

        {summary.buckets.map((bucket) => (
          <SummaryButton
            key={bucket.key}
            $active={activeBucket === bucket.key}
            aria-pressed={activeBucket === bucket.key}
            onClick={() => onSelectBucket(bucket.key)}
            type="button"
          >
            <span>{bucket.label}</span>
            <strong>{renderAmount(bucket.balanceAmount)}</strong>
            <small>{renderCount(bucket.count, 'registros')}</small>
          </SummaryButton>
        ))}
      </Grid>

      <ReviewQueueBar aria-label="Colas de revisión CxP">
        {summary.reviewQueues.map((queue) => {
          const active = activeReviewQueue === queue.key;

          return (
            <ReviewQueueItem
              $active={active}
              $tone={queue.tone}
              aria-label={`Filtrar CxP por ${queue.label}`}
              aria-pressed={active}
              key={queue.key}
              onClick={() => onSelectReviewQueue(active ? 'all' : queue.key)}
              type="button"
            >
              <span>{queue.label}</span>
              <strong>{dataState === 'loading' ? '...' : queue.count}</strong>
              <small>
                {dataState === 'error'
                  ? 'Sin confirmar'
                  : dataState === 'loading'
                    ? 'Actualizando'
                    : formatPrice(queue.balanceAmount)}
              </small>
            </ReviewQueueItem>
          );
        })}
      </ReviewQueueBar>
    </SummaryStack>
  );
};

const SummaryStack = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px 4px;
`;

const ScopeNotice = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgb(173 104 0 / 24%);
  border-radius: 8px;
  background: rgb(250 173 20 / 8%);
  color: var(--ds-color-text-secondary, #5f4b14);
  font-size: 12px;
  line-height: 1.4;

  strong {
    flex: 0 0 auto;
    color: #8a5200;
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (width <= 640px) {
    display: grid;
    gap: 2px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 128px), 1fr));
  gap: 10px;
  min-width: 0;
  overflow: clip;
`;

const SummaryButton = styled.button<{ $active: boolean }>`
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  min-height: 82px;
  padding: 10px 12px;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? 'var(--ds-color-border-brand, #1677ff)'
        : 'var(--ds-color-border-default, #d9d9d9)'};
  border-radius: 8px;
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
    overflow-wrap: anywhere;
  }

  small {
    color: var(--ds-color-text-secondary, #666);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-brand, #1677ff);
    outline-offset: 2px;
  }

  @media (width <= 480px) {
    min-height: 76px;
    padding: 10px;
  }
`;

const ReviewQueueBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
  padding-block-end: 2px;

  @media (width <= 1400px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ReviewQueueItem = styled.button<{
  $active: boolean;
  $tone: 'danger' | 'neutral' | 'warning';
}>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
  min-height: 44px;
  padding: 9px 11px;
  border: 1px solid
    ${({ $active, $tone }) =>
      $active
        ? 'var(--ds-color-border-brand, #1677ff)'
        : $tone === 'danger'
          ? 'rgb(207 19 34 / 24%)'
          : $tone === 'warning'
            ? 'rgb(173 104 0 / 24%)'
            : 'var(--ds-color-border-default, #d9d9d9)'};
  border-radius: 8px;
  background: ${({ $active, $tone }) =>
    $active
      ? 'var(--ds-color-interactive-hover-bg, #f0f7ff)'
      : $tone === 'danger'
        ? 'rgb(255 77 79 / 6%)'
        : $tone === 'warning'
          ? 'rgb(250 173 20 / 8%)'
          : 'var(--ds-color-bg-surface, #fff)'};
  text-align: left;
  cursor: pointer;

  span,
  small {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  strong {
    color: var(--ds-color-text-primary, #111);
    font-size: 15px;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-brand, #1677ff);
    outline-offset: 2px;
  }

  @media (width <= 480px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 3px;
  }
`;

const MetricState = styled.em`
  display: inline;
  color: var(--ds-color-text-secondary, #666);
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
`;
