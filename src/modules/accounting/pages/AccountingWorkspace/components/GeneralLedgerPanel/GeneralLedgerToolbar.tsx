import { Select as AntSelect } from 'antd';
import { SearchField } from '@heroui/react';
import styled from 'styled-components';

import { HeroUIDatePicker } from '@/components/common/DatePicker/HeroUIDatePicker';
import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';

import type { GeneralLedgerAccountOption } from '../../utils/accountingWorkspace';

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
}: GeneralLedgerToolbarProps) => (
  <ToolbarShell>
    <Toolbar>
      <ToolbarField>
        <ToolbarLabel htmlFor="general-ledger-account">Cuenta</ToolbarLabel>
        <AntSelect
          id="general-ledger-account"
          showSearch
          optionFilterProp="label"
          value={selectedAccountId || undefined}
          options={accountOptions.map((option) => ({
            label:
              option.movementCount > 0
                ? `${option.code} — ${option.name}`
                : `${option.code} — ${option.name} (sin movimientos)`,
            value: option.id,
          }))}
          onChange={onAccountChange}
        />
      </ToolbarField>

      <ToolbarField $dateRange>
        <ToolbarLabel>Fechas</ToolbarLabel>
        <HeroUIDatePicker
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
        <SearchField
          aria-label="Buscar movimientos del libro mayor"
          value={query}
          onChange={onQueryChange}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              id="general-ledger-search"
              placeholder="Filtrar movimientos..."
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </ToolbarField>
    </Toolbar>
  </ToolbarShell>
);

const ToolbarShell = styled.section`
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns:
    minmax(300px, 1fr) 260px
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
  ${({ $dateRange }) => ($dateRange ? 'width: 260px;' : '')}
  ${({ $search }) => ($search ? 'width: 100%;' : '')}

  @media (max-width: 640px) {
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
