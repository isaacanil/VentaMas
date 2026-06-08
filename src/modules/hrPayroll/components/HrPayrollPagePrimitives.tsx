import { parseDate } from '@internationalized/date';
import type { KeyboardEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  VmButton,
  VmDateField,
  VmDateRangePicker,
  VmRangeCalendar,
  VmSpinner,
  VmTable,
} from '@/components/heroui';
import {
  fromHrDateKey,
  toHrDateKey,
} from '@/modules/hrPayroll/utils/hrDateRange';

import {
  DateInputContainer,
  DateRangeGroup,
  HrPaginationActions,
  HrTableFooter,
  HrTableFrame,
  HrTableMeta,
  HrTableState,
  HrTableTitle,
} from './HrPayrollPagePrimitives.styles';

export {
  HrActionGroup,
  HrAmountText,
  HrCellStack,
  HrDescription,
  HrInlineStack,
  HrMutedText,
  HrNotice,
  HrPage,
  HrPageHeader,
  HrPaginationActions,
  HrPrimaryText,
  HrStatusTag,
  HrSummaryGrid,
  HrSummaryItem,
  HrSummaryLabel,
  HrSummaryValue,
  HrTableFrame,
  HrTableFooter,
  HrTableMeta,
  HrTableState,
  HrTableTitle,
  HrTitle,
  HrTitleBlock,
  type HrTone,
} from './HrPayrollPagePrimitives.styles';

type HrRowKey = string | number;

export type HrTableColumn<T> = {
  align?: 'left' | 'center' | 'right';
  isRowHeader?: boolean;
  key: string;
  render: (row: T) => ReactNode;
  title: ReactNode;
  width?: number | string;
};

interface HrDataTableProps<T> {
  ariaLabel: string;
  columns: HrTableColumn<T>[];
  emptyText?: string;
  getRowId?: (row: T) => HrRowKey;
  loading?: boolean;
  minTableWidth?: number | string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  rows: T[];
  selectedRowId?: HrRowKey | null;
  title?: ReactNode;
}

const getDefaultRowId = <T extends { id?: HrRowKey }>(
  row: T,
  index: number,
): HrRowKey => row.id ?? index;

export function HrDataTable<T extends { id?: HrRowKey }>({
  ariaLabel,
  columns,
  emptyText = 'Sin datos',
  getRowId,
  loading = false,
  minTableWidth,
  onRowClick,
  pageSize,
  rows,
  selectedRowId,
  title,
}: HrDataTableProps<T>) {
  const [page, setPage] = useState(1);
  const hasRows = rows.length > 0;
  const totalPages = pageSize
    ? Math.max(1, Math.ceil(rows.length / pageSize))
    : 1;
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    if (!pageSize) return rows;
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [pageSize, rows, safePage]);
  const resolveRowId = (row: T, index: number) =>
    getRowId ? getRowId(row) : getDefaultRowId(row, index);
  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, row: T) => {
    if (!onRowClick) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onRowClick(row);
  };

  return (
    <HrTableFrame variant="primary">
      {title ? <HrTableTitle>{title}</HrTableTitle> : null}
      <VmTable.ScrollContainer>
        <VmTable.Content
          aria-label={ariaLabel}
          style={{ minWidth: hasRows ? minTableWidth : undefined }}
        >
          <VmTable.Header>
            {columns.map((column) => (
              <VmTable.Column
                key={column.key}
                isRowHeader={column.isRowHeader}
                style={{
                  minWidth: hasRows ? column.width : undefined,
                  textAlign: column.align,
                }}
              >
                {column.title}
              </VmTable.Column>
            ))}
          </VmTable.Header>
          <VmTable.Body key={loading ? 'loading' : `rows-${safePage}`}>
            {loading ? (
              <VmTable.Row id="loading">
                <VmTable.Cell colSpan={columns.length}>
                  <HrTableState>
                    <VmSpinner size="sm" />
                    Cargando...
                  </HrTableState>
                </VmTable.Cell>
              </VmTable.Row>
            ) : visibleRows.length === 0 ? (
              <VmTable.Row id="empty">
                <VmTable.Cell colSpan={columns.length}>
                  <HrTableState>{emptyText}</HrTableState>
                </VmTable.Cell>
              </VmTable.Row>
            ) : (
              visibleRows.map((row, index) => {
                const rowId = resolveRowId(row, index);
                const selected =
                  selectedRowId != null && rowId === selectedRowId;
                const rowInteractionProps = onRowClick
                  ? ({
                      'aria-selected': selected,
                      'data-clickable': 'true',
                      onClick: () => onRowClick(row),
                      onKeyDown: (event: KeyboardEvent<HTMLElement>) =>
                        handleRowKeyDown(event, row),
                      tabIndex: 0,
                    } as Record<string, unknown>)
                  : {};
                return (
                  <VmTable.Row
                    key={rowId}
                    id={rowId}
                    data-selected={selected ? 'true' : undefined}
                    {...rowInteractionProps}
                    style={{
                      background: selected
                        ? 'var(--ds-color-bg-subtle)'
                        : undefined,
                      cursor: onRowClick ? 'pointer' : undefined,
                    }}
                  >
                    {columns.map((column) => (
                      <VmTable.Cell
                        key={column.key}
                        style={{ textAlign: column.align }}
                      >
                        {column.render(row)}
                      </VmTable.Cell>
                    ))}
                  </VmTable.Row>
                );
              })
            )}
          </VmTable.Body>
        </VmTable.Content>
      </VmTable.ScrollContainer>
      {pageSize && hasRows ? (
        <HrTableFooter>
          <HrTableMeta>
            {rows.length === 0
              ? '0 registros'
              : `${visibleRows.length} / ${rows.length} registros`}
          </HrTableMeta>
          <HrPaginationActions>
            <VmButton
              variant="secondary"
              isDisabled={safePage <= 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </VmButton>
            <HrTableMeta>
              {safePage} / {totalPages}
            </HrTableMeta>
            <VmButton
              variant="secondary"
              isDisabled={safePage >= totalPages}
              onPress={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Siguiente
            </VmButton>
          </HrPaginationActions>
        </HrTableFooter>
      ) : null}
    </HrTableFrame>
  );
}

interface HrDateRangeFieldProps {
  ariaLabel: string;
  onChange: (range: [Date, Date]) => void;
  value: [Date, Date];
}

export function HrDateRangeField({
  ariaLabel,
  onChange,
  value,
}: HrDateRangeFieldProps) {
  return (
    <VmDateRangePicker
      value={{
        start: parseDate(toHrDateKey(value[0])),
        end: parseDate(toHrDateKey(value[1])),
      }}
      onChange={(nextValue) => {
        if (!nextValue?.start || !nextValue?.end) return;
        onChange([
          fromHrDateKey(nextValue.start.toString(), 'start'),
          fromHrDateKey(nextValue.end.toString(), 'end'),
        ]);
      }}
    >
      <DateRangeGroup fullWidth>
        <DateInputContainer>
          <VmDateField.Input slot="start">
            {(segment) => <VmDateField.Segment segment={segment} />}
          </VmDateField.Input>
          <VmDateRangePicker.RangeSeparator />
          <VmDateField.Input slot="end">
            {(segment) => <VmDateField.Segment segment={segment} />}
          </VmDateField.Input>
        </DateInputContainer>
        <VmDateField.Suffix>
          <VmDateRangePicker.Trigger aria-label={ariaLabel}>
            <VmDateRangePicker.TriggerIndicator />
          </VmDateRangePicker.Trigger>
        </VmDateField.Suffix>
      </DateRangeGroup>
      <VmDateRangePicker.Popover>
        <VmRangeCalendar aria-label={ariaLabel}>
          <VmRangeCalendar.Header>
            <VmRangeCalendar.YearPickerTrigger>
              <VmRangeCalendar.YearPickerTriggerHeading />
              <VmRangeCalendar.YearPickerTriggerIndicator />
            </VmRangeCalendar.YearPickerTrigger>
            <VmRangeCalendar.NavButton slot="previous" />
            <VmRangeCalendar.NavButton slot="next" />
          </VmRangeCalendar.Header>
          <VmRangeCalendar.Grid>
            <VmRangeCalendar.GridHeader>
              {(day) => (
                <VmRangeCalendar.HeaderCell>{day}</VmRangeCalendar.HeaderCell>
              )}
            </VmRangeCalendar.GridHeader>
            <VmRangeCalendar.GridBody>
              {(date) => <VmRangeCalendar.Cell date={date} />}
            </VmRangeCalendar.GridBody>
          </VmRangeCalendar.Grid>
          <VmRangeCalendar.YearPickerGrid>
            <VmRangeCalendar.YearPickerGridBody>
              {({ year }) => <VmRangeCalendar.YearPickerCell year={year} />}
            </VmRangeCalendar.YearPickerGridBody>
          </VmRangeCalendar.YearPickerGrid>
        </VmRangeCalendar>
      </VmDateRangePicker.Popover>
    </VmDateRangePicker>
  );
}
