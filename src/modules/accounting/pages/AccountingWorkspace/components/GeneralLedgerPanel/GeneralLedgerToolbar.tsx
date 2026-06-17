import { useCallback, useMemo } from 'react';
import type { Key } from 'react';
import styled from 'styled-components';

import { VmDatePicker } from '@/components/common/DatePicker/VmDatePicker';
import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import { VmListBox, VmSearchField, VmSelect } from '@/components/heroui';

import type { GeneralLedgerAccountOption } from '../../utils/accountingWorkspace';

interface AccountSelectItem {
  id: string;
  label: string;
}

interface GeneralLedgerToolbarProps {
  accountOptions: GeneralLedgerAccountOption[];
  dateRangeValue: DatePickerRangeValue;
  query: string;
  selectedAccountId: string;
  onAccountChange: (value: string) => void;
  onDateRangeChange: (range: DatePickerRangeValue | null) => void;
  onQueryChange: (value: string) => void;
}

export const GeneralLedgerToolbar = ({
  accountOptions,
  dateRangeValue,
  query,
  selectedAccountId,
  onAccountChange,
  onDateRangeChange,
  onQueryChange,
}: GeneralLedgerToolbarProps) => {
  const accountSelectItems = useMemo<AccountSelectItem[]>(
    () =>
      accountOptions.map((option) => ({
        id: option.id,
        label:
          option.movementCount > 0
            ? `${option.code} — ${option.name}`
            : `${option.code} — ${option.name} (sin movimientos)`,
      })),
    [accountOptions],
  );

  const handleAccountSelectionChange = useCallback(
    (key: Key | null) => {
      if (key === null) return;

      const nextAccountId = String(key);
      if (nextAccountId === selectedAccountId) return;

      onAccountChange(nextAccountId);
    },
    [onAccountChange, selectedAccountId],
  );

  return (
    <ToolbarShell>
      <Toolbar>
        <ToolbarField>
          <ToolbarLabel>Cuenta</ToolbarLabel>
          <SelectWrapper>
            <VmSelect
              aria-label="Cuenta contable"
              placeholder="Seleccionar cuenta"
              selectedKey={selectedAccountId || null}
              fullWidth
              onSelectionChange={handleAccountSelectionChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox items={accountSelectItems}>
                  {(option) => (
                    <VmListBox.Item id={option.id} textValue={option.label}>
                      {option.label}
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  )}
                </VmListBox>
              </VmSelect.Popover>
            </VmSelect>
          </SelectWrapper>
        </ToolbarField>

        <ToolbarField $dateRange>
          <ToolbarLabel>Fechas</ToolbarLabel>
          <VmDatePicker
            mode="range"
            value={dateRangeValue}
            placeholder="Seleccionar rango"
            allowClear
            onChange={(nextValue) => {
              onDateRangeChange(Array.isArray(nextValue) ? nextValue : null);
            }}
          />
        </ToolbarField>

        <ToolbarField $search>
          <ToolbarLabel htmlFor="general-ledger-search">Buscar</ToolbarLabel>
          <VmSearchField
            aria-label="Buscar movimientos del libro mayor"
            value={query}
            onChange={onQueryChange}
          >
            <VmSearchField.Group>
              <VmSearchField.SearchIcon />
              <VmSearchField.Input
                id="general-ledger-search"
                placeholder="Filtrar movimientos..."
              />
              <VmSearchField.ClearButton />
            </VmSearchField.Group>
          </VmSearchField>
        </ToolbarField>
      </Toolbar>
    </ToolbarShell>
  );
};

const ToolbarShell = styled.section`
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns:
    minmax(300px, 1fr) max-content
    minmax(240px, 0.9fr);
  gap: 12px;
  align-items: flex-end;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ToolbarField = styled.div<{ $dateRange?: boolean; $search?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;
  ${({ $dateRange }) => ($dateRange ? 'width: max-content;' : '')}
  ${({ $search }) => ($search ? 'width: 100%;' : '')}

  @media (max-width: 1080px) {
    ${({ $dateRange }) => ($dateRange ? 'width: 100%;' : '')}
  }
`;

const ToolbarLabel = styled.label`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const SelectWrapper = styled.div`
  width: 100%;
  min-width: 0;
`;
