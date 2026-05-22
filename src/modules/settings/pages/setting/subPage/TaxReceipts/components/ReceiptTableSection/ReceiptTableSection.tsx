import { PlusOutlined } from '@/constants/icons/antd';
import { Label, ListBox, ListBoxItem } from '@heroui/react';
import { Button } from 'antd';
import type { Key } from 'react';
import React, { useState } from 'react';
import styled from 'styled-components';

import { VmSelect } from '@/components/heroui';
import { TableTaxReceipt } from '@/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/TableTaxReceipt';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

type SetTaxReceiptItems = (
  next:
    | TaxReceiptDocument[]
    | ((prev: TaxReceiptDocument[]) => TaxReceiptDocument[]),
) => void;

type ReceiptViewFilter = 'active' | 'archived';

const VIEW_FILTER_OPTIONS = [
  { label: 'Activas', value: 'active' },
  { label: 'Archivadas', value: 'archived' },
] satisfies Array<{ label: string; value: ReceiptViewFilter }>;

interface ReceiptTableSectionProps {
  enabled: boolean;
  itemsLocal: TaxReceiptDocument[];
  setItemsLocal: SetTaxReceiptItems;
  isUnchanged: boolean;
  actions?: React.ReactNode;
  onAddBlank?: () => void;
}

export const ReceiptTableSection = ({
  enabled,
  itemsLocal,
  setItemsLocal,
  isUnchanged: _isUnchanged,
  actions,
  onAddBlank,
}: ReceiptTableSectionProps) => {
  const [viewFilter, setViewFilter] = useState<ReceiptViewFilter>('active');

  const handleViewFilterChange = (key: Key | null) => {
    const nextFilter = String(key);
    if (nextFilter === 'active' || nextFilter === 'archived') {
      setViewFilter(nextFilter);
    }
  };

  if (!enabled) {
    return (
      <Wrapper>
        <DisabledNotice>
          Activa la emisión fiscal para gestionar series NCF.
        </DisabledNotice>
      </Wrapper>
    );
  }
  return (
    <Wrapper>
      <Actions>
        <Left>
          <FilterControl>
            <VmSelect
              selectedKey={viewFilter}
              onSelectionChange={handleViewFilterChange}
              fullWidth
            >
              <HiddenLabel>Estado de series</HiddenLabel>
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <ListBox
                  aria-label="Estado de series"
                  items={VIEW_FILTER_OPTIONS}
                >
                  {(option) => (
                    <ListBoxItem id={option.value} textValue={option.label}>
                      {option.label}
                      <ListBoxItem.Indicator />
                    </ListBoxItem>
                  )}
                </ListBox>
              </VmSelect.Popover>
            </VmSelect>
          </FilterControl>
        </Left>
        {actions ? (
          <Right>{actions}</Right>
        ) : onAddBlank ? (
          <Right>
            <Button icon={<PlusOutlined />} type="primary" onClick={onAddBlank}>
              Agregar serie
            </Button>
          </Right>
        ) : null}
      </Actions>
      <TableTaxReceipt
        array={itemsLocal}
        setData={setItemsLocal}
        filter={viewFilter}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DisabledNotice = styled.div`
  padding: var(--ds-space-4);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);
  font-size: var(--ds-font-size-sm);
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
`;

const Left = styled.div`
  display: flex;
`;

const FilterControl = styled.div`
  width: 168px;

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const HiddenLabel = styled(Label)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Right = styled.div`
  display: flex;
  gap: var(--ds-space-3);

  @media (max-width: 760px) {
    width: 100%;

    > button {
      width: 100%;
    }
  }
`;
