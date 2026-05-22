import { ListBox } from '@heroui/react';
import type { Key } from 'react';
import styled from 'styled-components';

import { VmLabel, VmSelect } from '@/components/heroui';

export interface InvoiceWorkspaceSelectOption {
  label: string;
  value: string;
}

interface InvoiceWorkspaceSelectProps {
  ariaLabel: string;
  isDisabled?: boolean;
  label?: string;
  name?: string;
  options: InvoiceWorkspaceSelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const EMPTY_OPTION_KEY = '__invoice_workspace_empty__';

const optionValueToKey = (value: string) =>
  value.length > 0 ? value : EMPTY_OPTION_KEY;

const optionKeyToValue = (key: Key) => {
  const value = String(key);
  return value === EMPTY_OPTION_KEY ? '' : value;
};

export const InvoiceWorkspaceSelect = ({
  ariaLabel,
  isDisabled = false,
  label,
  name,
  options,
  placeholder,
  value,
  onChange,
}: InvoiceWorkspaceSelectProps) => {
  const selectedKey = optionValueToKey(value);

  return (
    <SelectRoot
      aria-label={label ? undefined : ariaLabel}
      fullWidth
      isDisabled={isDisabled}
      name={name}
      placeholder={placeholder}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (isDisabled || key === null) return;
        onChange(optionKeyToValue(key));
      }}
    >
      {label ? <SelectLabel>{label}</SelectLabel> : null}
      <VmSelect.Trigger>
        <VmSelect.Value />
        <VmSelect.Indicator />
      </VmSelect.Trigger>
      <VmSelect.Popover>
        <ListBox aria-label={ariaLabel}>
          {options.map((option) => (
            <ListBox.Item
              key={optionValueToKey(option.value)}
              id={optionValueToKey(option.value)}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </VmSelect.Popover>
    </SelectRoot>
  );
};

const SelectRoot = styled(VmSelect)`
  display: grid;
  gap: var(--ds-space-1);
  width: 100%;
  min-width: 0;
`;

const SelectLabel = styled(VmLabel)`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  text-transform: uppercase;
`;
