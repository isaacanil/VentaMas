import { Empty } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

import { VmButton, VmPagination, VmTable } from '@/components/heroui';
import { EyeOutlined } from '@/constants/icons/antd';
import { formatAccountingDate } from '../../../utils/accountingWorkspace';
import { JOURNAL_BOOK_PAGE_SIZE } from '../constants';
import {
  formatAccountLabel,
  formatDocumentLabel,
  formatEntryFolio,
  formatJournalAmount,
  formatUserLabel,
} from '../utils/formatters';

import type { JournalBookSummaryTotals } from '../types';
import type { AccountingLedgerRecord } from '../../../utils/accountingWorkspace';

interface JournalBookTableProps {
  difference: number;
  filteredRecords: AccountingLedgerRecord[];
  onPageChange: Dispatch<SetStateAction<number>>;
  onSelectRecord: (record: AccountingLedgerRecord) => void;
  pagedRecords: AccountingLedgerRecord[];
  safeCurrentPage: number;
  selectedRecordId: string | null;
  summary: JournalBookSummaryTotals;
  totalPages: number;
}

export const JournalBookTable = ({
  difference,
  filteredRecords,
  onPageChange,
  onSelectRecord,
  pagedRecords,
  safeCurrentPage,
  selectedRecordId,
  summary,
  totalPages,
}: JournalBookTableProps) => {
  if (filteredRecords.length === 0) {
    return (
      <EmptyState>
        <Empty
          description="No hay asientos que coincidan con los filtros actuales."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </EmptyState>
    );
  }

  return (
    <JournalTableFrame>
      <JournalTable>
        <JournalScrollViewport>
          <VmTable.ScrollContainer>
            <VmTable.Content aria-label="Libro Diario" className="min-w-[1080px]">
              <JournalTableHeader>
                <VmTable.Column>Fecha</VmTable.Column>
                <VmTable.Column>Asiento</VmTable.Column>
                <VmTable.Column>Tipo</VmTable.Column>
                <VmTable.Column>Cuenta</VmTable.Column>
                <VmTable.Column>Descripcion</VmTable.Column>
                <VmTable.Column>Usuario</VmTable.Column>
                <VmTable.Column>Debito</VmTable.Column>
                <VmTable.Column>Credito</VmTable.Column>
                <VmTable.Column>Accion</VmTable.Column>
              </JournalTableHeader>
              <VmTable.Body>
                {pagedRecords.flatMap((record) => {
                  const [primaryLine, ...derivedLines] = record.lines;
                  const selected = selectedRecordId === record.id;
                  const rows = [
                    <VmTable.Row
                      key={record.id}
                      id={record.id}
                      className={
                        selected
                          ? 'bg-[var(--ds-color-state-info-subtle)]'
                          : 'hover:bg-[var(--ds-color-bg-surface-hover)]'
                      }
                    >
                      <VmTable.Cell>
                        <DateCell>
                          {formatAccountingDate(record.entryDate)}
                        </DateCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <EntryCell>
                          <EntryBusinessReference>
                            {formatEntryFolio(record)}
                          </EntryBusinessReference>
                          <EntryDocumentReference
                            title={record.documentReference ?? undefined}
                          >
                            Ref: {formatDocumentLabel(record)}
                          </EntryDocumentReference>
                          <EntryStatus>{record.statusLabel}</EntryStatus>
                        </EntryCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <TypeCell>
                          <TypeBadge>
                            <TypeDot />
                            <span>{record.journalTypeLabel}</span>
                          </TypeBadge>
                        </TypeCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <AccountCell>{formatAccountLabel(primaryLine)}</AccountCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <DescriptionCell>
                          <strong>
                            {primaryLine?.description ?? record.description}
                          </strong>
                          <span>{record.title}</span>
                        </DescriptionCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <UserCell>
                          <CompactMeta title={record.userLabel ?? undefined}>
                            {formatUserLabel(record)}
                          </CompactMeta>
                        </UserCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <AmountCell $tone="debit">
                          {formatJournalAmount(primaryLine?.debit ?? 0)}
                        </AmountCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <AmountCell $tone="credit">
                          {formatJournalAmount(primaryLine?.credit ?? 0)}
                        </AmountCell>
                      </VmTable.Cell>
                      <VmTable.Cell>
                        <ActionCell>
                          <VmButton
                            aria-label={`Ver detalle de ${formatEntryFolio(record)}`}
                            size="sm"
                            variant={selected ? 'primary' : 'tertiary'}
                            onPress={() => onSelectRecord(record)}
                          >
                            <EyeOutlined />
                            Ver
                          </VmButton>
                        </ActionCell>
                      </VmTable.Cell>
                    </VmTable.Row>,
                  ];

                  derivedLines.forEach((line) => {
                    rows.push(
                      <VmTable.Row
                        key={`${record.id}:${line.lineNumber}`}
                        className={
                          selected
                            ? 'bg-[var(--ds-color-state-info-subtle)]'
                            : 'hover:bg-[var(--ds-color-bg-surface-hover)]'
                        }
                      >
                        <VmTable.Cell>
                          <DerivedMarkerCell>↳</DerivedMarkerCell>
                        </VmTable.Cell>
                        <VmTable.Cell>-</VmTable.Cell>
                        <VmTable.Cell>-</VmTable.Cell>
                        <VmTable.Cell>
                          <AccountCell>{formatAccountLabel(line)}</AccountCell>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <DescriptionCell>
                            <strong>{line.description ?? record.description}</strong>
                            <span>Linea {line.lineNumber}</span>
                          </DescriptionCell>
                        </VmTable.Cell>
                        <VmTable.Cell>-</VmTable.Cell>
                        <VmTable.Cell>
                          <AmountCell $tone="debit">
                            {formatJournalAmount(line.debit)}
                          </AmountCell>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <AmountCell $tone="credit">
                            {formatJournalAmount(line.credit)}
                          </AmountCell>
                        </VmTable.Cell>
                        <VmTable.Cell>-</VmTable.Cell>
                      </VmTable.Row>,
                    );
                  });

                  return rows;
                })}
              </VmTable.Body>
            </VmTable.Content>
          </VmTable.ScrollContainer>
        </JournalScrollViewport>
        <VmTable.Footer>
          <JournalTableFooter>
            <FooterMetrics>
              <FooterMetric>
                <FooterMetricLabel>Asientos</FooterMetricLabel>
                <FooterMetricValue>
                  {pagedRecords.length} / {filteredRecords.length}
                </FooterMetricValue>
              </FooterMetric>
              <FooterMetric>
                <FooterMetricLabel>Diferencia</FooterMetricLabel>
                <FooterMetricValue
                  $tone={difference < 0.005 ? 'success' : 'danger'}
                >
                  {formatJournalAmount(difference)}
                </FooterMetricValue>
              </FooterMetric>
            </FooterMetrics>

            <FooterPagination aria-label="Paginacion del libro diario">
              {filteredRecords.length > JOURNAL_BOOK_PAGE_SIZE ? (
                <VmPagination>
                  <VmPagination.Content>
                    <VmPagination.Item>
                      <VmPagination.Previous
                        isDisabled={safeCurrentPage === 1}
                        onPress={() =>
                          onPageChange((page) => Math.max(1, page - 1))
                        }
                      >
                        <VmPagination.PreviousIcon />
                      </VmPagination.Previous>
                    </VmPagination.Item>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= safeCurrentPage - 1 &&
                            page <= safeCurrentPage + 1)
                        ) {
                          return (
                            <VmPagination.Item key={page}>
                              <VmPagination.Link
                                isActive={page === safeCurrentPage}
                                onPress={() => onPageChange(page)}
                              >
                                {page}
                              </VmPagination.Link>
                            </VmPagination.Item>
                          );
                        }

                        if (
                          page === safeCurrentPage - 2 ||
                          page === safeCurrentPage + 2
                        ) {
                          return (
                            <VmPagination.Item key={page}>
                              <VmPagination.Ellipsis />
                            </VmPagination.Item>
                          );
                        }

                        return null;
                      },
                    )}
                    <VmPagination.Item>
                      <VmPagination.Next
                        isDisabled={safeCurrentPage === totalPages}
                        onPress={() =>
                          onPageChange((page) => Math.min(totalPages, page + 1))
                        }
                      >
                        <VmPagination.NextIcon />
                      </VmPagination.Next>
                    </VmPagination.Item>
                  </VmPagination.Content>
                </VmPagination>
              ) : (
                <FooterPageText>Pagina 1 de 1</FooterPageText>
              )}
            </FooterPagination>

            <FooterTotals>
              <FooterMetric $align="right">
                <FooterMetricLabel>Debito</FooterMetricLabel>
                <FooterMetricValue $tone="success">
                  {formatJournalAmount(summary.debit)}
                </FooterMetricValue>
              </FooterMetric>
              <FooterMetric $align="right">
                <FooterMetricLabel>Credito</FooterMetricLabel>
                <FooterMetricValue $tone="danger">
                  {formatJournalAmount(summary.credit)}
                </FooterMetricValue>
              </FooterMetric>
            </FooterTotals>
          </JournalTableFooter>
        </VmTable.Footer>
      </JournalTable>
    </JournalTableFrame>
  );
};

const JournalTableFrame = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const JournalTable = styled(VmTable)`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &.table-root--primary {
    // padding-bottom: 0;
  }

  .table__scroll-container {
    flex: 1 1 auto;
    min-height: 0;
  }

  .table__footer {
    min-height: 40px;
    background: transparent;
    padding: 0;
  }
`;

const JournalScrollViewport = styled.div`
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  height: auto;
  min-height: 0;
  overflow: auto;
`;

const JournalTableHeader = styled(VmTable.Header)`
  position: sticky;
  top: 0;
  z-index: 5;
  box-shadow: 0 1px 0 var(--ds-color-border-default);

  &.table__header {
    position: sticky;
    top: 0;
    z-index: 5;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--ds-color-bg-subtle);
  }

  .table__column {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--ds-color-bg-subtle);
  }
`;

const JournalTableFooter = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(280px, auto) minmax(
      220px,
      1fr
    );
  align-items: center;
  flex-shrink: 0;
  gap: var(--ds-space-2);
  min-height: 52px;
  width: 100%;
  border-top: 1px solid var(--ds-color-border-default);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const FooterMetrics = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  min-width: 0;

  @media (max-width: 520px) {
    justify-content: space-between;
    gap: var(--ds-space-3);
  }
`;

const FooterTotals = styled(FooterMetrics)`
  justify-content: flex-end;
`;

const FooterMetric = styled.div<{ $align?: 'left' | 'right' }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $align }) => ($align === 'right' ? 'baseline' : 'center')};
  justify-content: ${({ $align }) =>
    $align === 'right' ? 'flex-end' : 'flex-start'};
  gap: 2px;
  min-width: 0;
`;

const FooterMetricLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-letter-spacing-wide);
  line-height: var(--ds-line-height-tight);
  text-transform: uppercase;
  white-space: nowrap;
`;

const FooterMetricValue = styled.strong<{ $tone?: 'success' | 'danger' }>`
  color: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success-text)'
      : $tone === 'danger'
        ? 'var(--ds-color-state-danger-text)'
        : 'var(--ds-color-text-primary)'};
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-normal);
  white-space: nowrap;
`;

const FooterPagination = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
`;

const FooterPageText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const DateCell = styled.div`
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

const EntryCell = styled.div`
  min-width: 220px;
`;

const EntryStatus = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin-top: var(--ds-space-1);
  min-height: 20px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-full, 999px);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  line-height: var(--ds-line-height-tight);
  text-transform: uppercase;
`;

const EntryBusinessReference = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  font-variant-numeric: tabular-nums;
`;

const EntryDocumentReference = styled.span`
  display: block;
  margin-top: var(--ds-space-1);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
  font-variant-numeric: tabular-nums;
  line-height: var(--ds-line-height-tight);
`;

const TypeCell = styled.div`
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-interactive-default);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const TypeDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
`;

const AccountCell = styled.div`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const DescriptionCell = styled.div`
  && {
    display: flex;
    flex-direction: column;
    min-width: 260px;
  }

  strong {
    display: block;
    margin-bottom: 2px;
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-line-height-tight);
  }

  span {
    display: block;
    color: var(--ds-color-text-secondary);
    line-height: var(--ds-line-height-normal);
  }
`;

const DerivedMarkerCell = styled.div`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-sm);
`;

const UserCell = styled.div`
  white-space: nowrap;
`;

const CompactMeta = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 26px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-xs);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AmountCell = styled.div<{ $tone: 'debit' | 'credit' }>`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
  font-family: var(--ds-font-family-mono, monospace);
  font-weight: var(--ds-font-weight-semibold);

  && {
    color: ${({ $tone }) =>
      $tone === 'debit'
        ? 'var(--ds-color-state-success-text, #166534)'
        : 'var(--ds-color-state-danger-text, #b42318)'};
  }
`;

const ActionCell = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 88px;
`;

const EmptyState = styled.div`
  padding: var(--ds-space-8) var(--ds-space-4);
`;
