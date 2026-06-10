import { Button } from 'antd';
import styled from 'styled-components';

import { ReloadOutlined } from '@/constants/icons/antd';
import {
  formatAccountingDateTime,
  formatAccountingPeriod,
} from '../utils/accountingWorkspace';
import { toDateOrNull } from '@/utils/accounting/journalEntries';
import { ACCOUNTING_EVENT_TYPE_LABELS } from '@/utils/accounting/accountingEvents';

import type {
  AccountingLedgerRecord,
  AccountingProjectionDeadLetter,
} from '../utils/accountingWorkspace';

interface AccountingMonitorPanelProps {
  deadLetters: AccountingProjectionDeadLetter[];
  onReplayIssue: (eventId: string) => Promise<boolean>;
  records: AccountingLedgerRecord[];
  replayingEventId: string | null;
}

interface MonitorIssue {
  id: string;
  eventId: string;
  eventTypeLabel: string;
  sourceReference: string;
  periodLabel: string;
  status: string;
  tone: 'danger' | 'warning' | 'neutral';
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  replayCount: number;
  updatedAtLabel: string;
}

interface BuildIssuesArgs {
  deadLetters: AccountingProjectionDeadLetter[];
  records: AccountingLedgerRecord[];
}

const MONITORED_STATUSES = new Set([
  'failed',
  'pending',
  'pending_account_mapping',
]);

const normalizeStatusLabel = (status: string) => {
  switch (status) {
    case 'failed':
      return 'Fallido';
    case 'pending_account_mapping':
      return 'Sin mapeo';
    case 'pending':
      return 'Pendiente';
    default:
      return status || 'Sin estado';
  }
};

const resolveTone = (status: string): MonitorIssue['tone'] => {
  if (status === 'failed') return 'danger';
  if (status === 'pending_account_mapping') return 'warning';
  return 'neutral';
};

const resolveEventIssueStatus = (record: AccountingLedgerRecord) => {
  const projection = record.event?.projection;
  const status = projection?.status ?? 'pending';
  const journalEntryId =
    projection?.journalEntryId ??
    record.event?.metadata?.journalEntryId ??
    null;

  if (status === 'projected' && journalEntryId) {
    return null;
  }

  return status === 'projected' ? 'pending' : status;
};

const buildIssues = ({
  deadLetters,
  records,
}: BuildIssuesArgs): MonitorIssue[] => {
  const issuesByEventId = new Map<string, MonitorIssue>();

  records.forEach((record) => {
    if (!record.event) return;

    const status = resolveEventIssueStatus(record);
    if (!status || !MONITORED_STATUSES.has(status)) return;

    const lastError = record.event.projection?.lastError ?? null;
    issuesByEventId.set(record.event.id, {
      id: `event:${record.event.id}`,
      eventId: record.event.id,
      eventTypeLabel:
        ACCOUNTING_EVENT_TYPE_LABELS[record.event.eventType] ??
        record.event.eventType,
      sourceReference:
        record.documentReference ??
        record.reference ??
        record.event.sourceDocumentId ??
        record.event.sourceId ??
        record.event.id,
      periodLabel: record.periodKey
        ? formatAccountingPeriod(record.periodKey)
        : 'Sin periodo',
      status,
      tone: resolveTone(status),
      errorCode: lastError?.code ?? null,
      errorMessage: lastError?.message ?? null,
      attemptCount: Number(record.event.projection?.attemptCount ?? 0),
      replayCount: Number(record.event.projection?.replayCount ?? 0),
      updatedAtLabel: formatAccountingDateTime(
        toDateOrNull(record.event.projection?.lastAttemptAt),
      ),
    });
  });

  deadLetters.forEach((deadLetter) => {
    const status = deadLetter.projectionStatus || 'failed';
    if (!MONITORED_STATUSES.has(status)) return;

    issuesByEventId.set(deadLetter.eventId, {
      id: `dead-letter:${deadLetter.id}`,
      eventId: deadLetter.eventId,
      eventTypeLabel: deadLetter.eventType
        ? (ACCOUNTING_EVENT_TYPE_LABELS[deadLetter.eventType] ??
          deadLetter.eventType)
        : 'Evento contable',
      sourceReference:
        deadLetter.sourceDocumentId ??
        deadLetter.sourceId ??
        deadLetter.eventId,
      periodLabel: 'Ver evento',
      status,
      tone: resolveTone(status),
      errorCode: deadLetter.lastError?.code ?? null,
      errorMessage: deadLetter.lastError?.message ?? null,
      attemptCount: deadLetter.attemptCount,
      replayCount: deadLetter.replayCount,
      updatedAtLabel: formatAccountingDateTime(
        toDateOrNull(deadLetter.updatedAt ?? deadLetter.lastAttemptAt),
      ),
    });
  });

  return Array.from(issuesByEventId.values()).sort((left, right) => {
    const toneOrder = { danger: 0, warning: 1, neutral: 2 };
    if (toneOrder[left.tone] !== toneOrder[right.tone]) {
      return toneOrder[left.tone] - toneOrder[right.tone];
    }

    return left.eventId.localeCompare(right.eventId);
  });
};

export const AccountingMonitorPanel = ({
  deadLetters,
  onReplayIssue,
  records,
  replayingEventId,
}: AccountingMonitorPanelProps) => {
  const issues = buildIssues({ deadLetters, records });
  const failedCount = issues.filter(
    (issue) => issue.status === 'failed',
  ).length;
  const mappingCount = issues.filter(
    (issue) => issue.status === 'pending_account_mapping',
  ).length;
  const pendingCount = issues.filter(
    (issue) => issue.status === 'pending',
  ).length;

  return (
    <Panel>
      <SummaryGrid>
        <SummaryItem>
          <span>Total</span>
          <strong>{issues.length}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Fallidos</span>
          <strong>{failedCount}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Sin mapeo</span>
          <strong>{mappingCount}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Pendientes</span>
          <strong>{pendingCount}</strong>
        </SummaryItem>
      </SummaryGrid>

      {issues.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Sin eventos contables pendientes</EmptyTitle>
          <EmptyCopy>
            No hay proyecciones fallidas, sin mapeo o pendientes en este
            momento.
          </EmptyCopy>
        </EmptyState>
      ) : (
        <TableShell>
          <MonitorTable>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Evento</th>
                <th>Referencia</th>
                <th>Error</th>
                <th>Intentos</th>
                <th>Último intento</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <StatusBadge $tone={issue.tone}>
                      {normalizeStatusLabel(issue.status)}
                    </StatusBadge>
                  </td>
                  <td>
                    <StrongText>{issue.eventTypeLabel}</StrongText>
                    <MutedText>{issue.eventId}</MutedText>
                  </td>
                  <td>
                    <StrongText>{issue.sourceReference}</StrongText>
                    <MutedText>{issue.periodLabel}</MutedText>
                  </td>
                  <td>
                    <StrongText>{issue.errorCode ?? 'Sin código'}</StrongText>
                    <MutedText>{issue.errorMessage ?? 'Sin detalle'}</MutedText>
                  </td>
                  <td>
                    <StrongText>{issue.attemptCount}</StrongText>
                    <MutedText>{issue.replayCount} replay</MutedText>
                  </td>
                  <td>{issue.updatedAtLabel}</td>
                  <td>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={replayingEventId === issue.eventId}
                      onClick={() => {
                        void onReplayIssue(issue.eventId);
                      }}
                    >
                      Reprocesar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </MonitorTable>
        </TableShell>
      )}
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-xl);
    font-weight: var(--ds-font-weight-semibold);
    line-height: var(--ds-line-height-tight);
  }
`;

const TableShell = styled.div`
  overflow-x: auto;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const MonitorTable = styled.table`
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
    font-size: var(--ds-font-size-sm);
  }

  th {
    color: var(--ds-color-text-secondary);
    font-weight: var(--ds-font-weight-semibold);
    background: var(--ds-color-bg-muted);
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const StatusBadge = styled.span<{ $tone: MonitorIssue['tone'] }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: ${(props) =>
    props.$tone === 'danger'
      ? 'var(--ds-color-state-danger-text)'
      : props.$tone === 'warning'
        ? 'var(--ds-color-state-warning-text)'
        : 'var(--ds-color-text-secondary)'};
  background: ${(props) =>
    props.$tone === 'danger'
      ? 'rgba(180, 35, 24, 0.08)'
      : props.$tone === 'warning'
        ? 'rgba(181, 71, 8, 0.08)'
        : 'var(--ds-color-bg-muted)'};
`;

const StrongText = styled.div`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-semibold);
`;

const MutedText = styled.div`
  max-width: 320px;
  margin-top: 2px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  overflow-wrap: anywhere;
`;

const EmptyState = styled.div`
  padding: var(--ds-space-6);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
`;

const EmptyCopy = styled.p`
  margin: var(--ds-space-2) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
