// @ts-nocheck
import { Modal, Checkbox, Select, Button } from 'antd';
import React from 'react';

import {
  FilterModalContent,
  FilterSection,
  FilterSectionTitle,
  FilterSelectContainer,
  MutedText,
} from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/styles';

import type { DraftBatchOption, FilterDraft, ProductOption } from '@/views/pages/Inventory/components/Warehouse/components/DetailView/components/InventoryTable/types';

interface AdvancedFilterModalProps {
  open: boolean;
  filterDraft: FilterDraft;
  onCancel: () => void;
  onReset: () => void;
  onApply: () => void;
  onToggleExpiration: (checked: boolean) => void;
  productOptions: ProductOption[];
  onProductChange: (value: string | null) => void;
  draftBatchOptions: DraftBatchOption[];
  onToggleBatch: (batchValue: string, checked: boolean) => void;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  filterDraft,
  onCancel,
  onReset,
  onApply,
  onToggleExpiration,
  productOptions,
  onProductChange,
  draftBatchOptions,
  onToggleBatch,
}) => (
  <Modal
    title="Filtros avanzados"
    open={open}
    onCancel={onCancel}
    footer={[
      <Button key="reset" onClick={onReset}>
        Restablecer
      </Button>,
      <Button key="apply" type="primary" onClick={onApply}>
        Aplicar
      </Button>,
    ]}
  >
    <FilterModalContent>
      <FilterSection>
        <FilterSectionTitle>Vencimiento</FilterSectionTitle>
        <Checkbox
          checked={filterDraft.showOnlyWithExpiration}
          onChange={(event) => onToggleExpiration(event.target.checked)}
        >
          Solo productos con fecha de vencimiento
        </Checkbox>
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Producto</FilterSectionTitle>
        {productOptions.length ? (
          <Select
            placeholder="Selecciona un producto"
            options={productOptions}
            value={filterDraft.product ?? undefined}
            onChange={(value) => onProductChange(value ?? null)}
            allowClear
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="label"
          />
        ) : (
          <MutedText>No hay productos disponibles</MutedText>
        )}
      </FilterSection>

      <FilterSection>
        <FilterSectionTitle>Lotes del producto</FilterSectionTitle>
        {filterDraft.product ? (
          draftBatchOptions.length ? (
            <FilterSelectContainer>
              {draftBatchOptions.map((option) => {
                const isChecked = filterDraft.batches.includes(option.value);
                return (
                  <Checkbox
                    key={option.value}
                    checked={isChecked}
                    onChange={(event) =>
                      onToggleBatch(option.value, event.target.checked)
                    }
                  >
                    <div>
                      <span>{option.displayLabel}</span>
                      <MutedText>{` · ${option.expirationText}`}</MutedText>
                    </div>
                  </Checkbox>
                );
              })}
            </FilterSelectContainer>
          ) : (
            <MutedText>No hay lotes disponibles para este producto</MutedText>
          )
        ) : (
          <MutedText>
            Selecciona un producto para ver sus lotes disponibles
          </MutedText>
        )}
      </FilterSection>
    </FilterModalContent>
  </Modal>
);
