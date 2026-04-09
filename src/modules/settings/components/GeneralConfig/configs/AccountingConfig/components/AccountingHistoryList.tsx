import { useMemo, useState } from 'react';
import { Empty, Segmented, Space, Tag, Typography } from 'antd';
import styled from 'styled-components';

import {
  ACCOUNTING_AUDIT_CHANGE_TYPE_LABELS,
  ACCOUNTING_AUDIT_SCOPE_LABELS,
  buildAccountingAuditComparisonRows,
  type AccountingAuditEntry,
  type AccountingAuditScope,
} from '../utils/accountingAudit';
import { toMillis } from '@/utils/firebase/toTimestamp';

const { Text } = Typography;

interface AccountingHistoryListProps {
  entries: AccountingAuditEntry[];
  loading: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type ScopeFilter = 'all' | AccountingAuditScope;

const formatHistoryDate = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (millis == null) {
    return 'Fecha no disponible';
  }

  return dateFormatter.format(new Date(millis));
};

export const AccountingHistoryList = ({
  entries,
  loading,
}: AccountingHistoryListProps) => {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) =>
        scopeFilter === 'all' ? true : entry.scope === scopeFilter,
      ),
    [entries, scopeFilter],
  );

  if (loading) {
    return (
      <LoadingWrap>
        <Text type="secondary">Cargando bitacora...</Text>
      </LoadingWrap>
    );
  }

  if (entries.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Todavia no hay cambios auditables."
      />
    );
  }

  return (
    <Stack>
      <Toolbar>
        <Segmented
          block
          value={scopeFilter}
          onChange={(value) => setScopeFilter(value as ScopeFilter)}
          options={[
            { label: 'Todo', value: 'all' },
            { label: ACCOUNTING_AUDIT_SCOPE_LABELS.settings, value: 'settings' },
            {
              label: ACCOUNTING_AUDIT_SCOPE_LABELS.bank_account,
              value: 'bank_account',
            },
            {
              label: ACCOUNTING_AUDIT_SCOPE_LABELS.chart_of_account,
              value: 'chart_of_account',
            },
            {
              label: ACCOUNTING_AUDIT_SCOPE_LABELS.posting_profile,
              value: 'posting_profile',
            },
          ]}
        />
      </Toolbar>

      {!visibleEntries.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No hay cambios para ese filtro."
        />
      ) : (
        <HistoryStack direction="vertical" size={12}>
          {visibleEntries.map((entry) => {
            const rows = buildAccountingAuditComparisonRows(entry);

            return (
              <HistoryItem key={entry.id}>
                <HistoryHeader>
                  <IdentityBlock>
                    <ItemTitle>{entry.entityLabel}</ItemTitle>
                    <Space wrap size={[6, 6]}>
                      <Tag>{ACCOUNTING_AUDIT_SCOPE_LABELS[entry.scope]}</Tag>
                      <Tag color={entry.changeType === 'status_changed' ? 'gold' : 'blue'}>
                        {ACCOUNTING_AUDIT_CHANGE_TYPE_LABELS[entry.changeType]}
                      </Tag>
                    </Space>
                  </IdentityBlock>

                  <MetaBlock>
                    <DateText>{formatHistoryDate(entry.changedAt)}</DateText>
                    <ActorText>{entry.changedBy || 'Sistema'}</ActorText>
                  </MetaBlock>
                </HistoryHeader>

                {!rows.length ? (
                  <EmptyValue>Sin before/after disponible.</EmptyValue>
                ) : (
                  <ComparisonGrid>
                    <ComparisonHeader>Campo</ComparisonHeader>
                    <ComparisonHeader>Antes</ComparisonHeader>
                    <ComparisonHeader>Despues</ComparisonHeader>

                    {rows.map((row) => (
                      <ComparisonRow key={`${entry.id}-${row.key}`} $changed={row.changed}>
                        <FieldLabel>{row.label}</FieldLabel>
                        <FieldValue>{row.before}</FieldValue>
                        <FieldValue>{row.after}</FieldValue>
                      </ComparisonRow>
                    ))}
                  </ComparisonGrid>
                )}
              </HistoryItem>
            );
          })}
        </HistoryStack>
      )}
    </Stack>
  );
};

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-height: 100%;
`;

const Toolbar = styled.div`
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
`;

const HistoryStack = styled(Space)`
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  display: flex;
`;

const HistoryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const IdentityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const ItemTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const MetaBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;

const DateText = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const ActorText = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 0.9fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 1px;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-border-default);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonHeader = styled.div`
  padding: var(--ds-space-2) var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const ComparisonRow = styled.div<{ $changed: boolean }>`
  display: contents;

  & > span {
    background: ${({ $changed }) =>
      $changed
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-bg-surface)'};
  }
`;

const FieldLabel = styled.span`
  padding: var(--ds-space-3);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const FieldValue = styled.span`
  padding: var(--ds-space-3);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  font-variant-numeric: tabular-nums;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EmptyValue = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const LoadingWrap = styled.div`
  padding: var(--ds-space-6);
  text-align: center;
`;
