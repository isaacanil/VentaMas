import type { Key, ReactNode } from 'react';
import styled from 'styled-components';

import { VmListBox, VmSelect } from '@/components/heroui';

type FilterSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  searchText?: string;
};

type FilterSelectControlProps = {
  value?: string | null;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  ariaLabel: string;
  placeholder?: string;
  width?: number | string;
  isDisabled?: boolean;
};

const EMPTY_OPTION_KEY = '__vm-filter-empty__';

const toCssSize = (value?: number | string) => {
  if (typeof value === 'number') return `${value}px`;
  return value ?? '100%';
};

const getOptionKey = (value: string) => value || EMPTY_OPTION_KEY;

const getOptionText = (option: FilterSelectOption) => {
  if (typeof option.label === 'string') return option.label;
  return option.searchText || option.value || 'Opcion';
};

export const FilterSelectControl = ({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  width,
  isDisabled,
}: FilterSelectControlProps) => {
  const selectedOptionKey = getOptionKey(value ?? '');
  const selectedKey = options.some(
    (option) => getOptionKey(option.value) === selectedOptionKey,
  )
    ? selectedOptionKey
    : null;

  const handleSelectionChange = (key: Key | null) => {
    if (key == null) return;
    const option = options.find(
      (candidate) => getOptionKey(candidate.value) === String(key),
    );
    onChange(
      option?.value ?? (String(key) === EMPTY_OPTION_KEY ? '' : String(key)),
    );
  };

  return (
    <SelectFrame $width={toCssSize(width)} data-filter-select-control>
      <VmSelect
        fullWidth
        aria-label={ariaLabel}
        placeholder={placeholder}
        selectedKey={selectedKey}
        onSelectionChange={handleSelectionChange}
        isDisabled={isDisabled}
      >
        <VmSelect.Trigger>
          <VmSelect.Value />
          <VmSelect.Indicator />
        </VmSelect.Trigger>
        <VmSelect.Popover>
          <VmListBox>
            {options.map((option) => {
              const optionKey = getOptionKey(option.value);
              return (
                <VmListBox.Item
                  key={optionKey}
                  id={optionKey}
                  textValue={getOptionText(option)}
                  isDisabled={option.disabled}
                >
                  {option.label}
                  <VmListBox.ItemIndicator />
                </VmListBox.Item>
              );
            })}
          </VmListBox>
        </VmSelect.Popover>
      </VmSelect>
    </SelectFrame>
  );
};

const SelectFrame = styled.div<{ $width: string }>`
  width: ${({ $width }) => $width};
  max-width: 100%;
  min-width: 0;

  @media (max-width: 900px) {
    width: 100%;
  }
`;
