import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '@/hooks/useClickOutSide';

type SelectorOptionStyles = {
  color?: string;
  bgColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
  selectedBgColor?: string;
  selectedColor?: string;
  icon?: IconProp | null;
};

type SelectorOption<TValue = string | number> = SelectorOptionStyles & {
  value: TValue;
  label: string | number;
};

type SelectorDisplayOption<TValue = string | number> = SelectorOptionStyles & {
  value?: TValue | null;
  label: string | number;
};

type SelectorPopperModifier = {
  name: string;
  options?: {
    offset?: number | [number, number];
    [key: string]: unknown;
  };
};

type SelectorProps<TValue = string | number> = {
  value?: TValue | null;
  onChange?: (value: TValue | null) => void;
  options?: Array<SelectorOption<TValue>>;
  placeholder?: string;
  allowClear?: boolean;
  clearText?: string;
  width?: string | number;
  defaultStyles?: SelectorOptionStyles;
  popperConfig?: {
    placement?: Placement;
    modifiers?: SelectorPopperModifier[];
  };
  showSearch?: boolean;
  showAllOption?: boolean;
  icon?: IconProp;
};

interface TriggerProps {
  $styles: SelectorOptionStyles;
  $width?: string | number;
  $hasIcon: boolean;
}

interface ChevronProps {
  $isOpen: boolean;
}

interface DropdownItemProps {
  $styles: SelectorOptionStyles;
  $isSelected: boolean;
}

const EMPTY_SELECTOR_OPTIONS: Array<SelectorOption> = [];

export const Selector = ({
  value,
  onChange,
  options = EMPTY_SELECTOR_OPTIONS,
  placeholder = 'Seleccionar',
  allowClear = false, // Nueva prop para controlar si se muestra la opción de limpiar
  clearText, // Nueva prop para el texto de la opción de limpiar
  width, // Nueva prop
  defaultStyles = {
    color: '#666',
    bgColor: '#ffffff',
    borderColor: '#d9d9d9',
    hoverBgColor: '#f5f5f5', // Nuevo color por defecto para hover
    selectedBgColor: '#e6f7ff', // Nuevo color por defecto para seleccionado
    selectedColor: '#1890ff', // Nuevo color por defecto para texto seleccionado
    icon: null,
  },
  popperConfig = {
    placement: 'bottom-start' as Placement,
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'preventOverflow', options: { boundary: 'viewport' } },
    ],
  },
}: SelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offsetOption = useMemo(
    () =>
      popperConfig?.modifiers?.find((m) => m.name === 'offset')?.options
        ?.offset,
    [popperConfig],
  );
  const offsetValue = Array.isArray(offsetOption)
    ? (offsetOption[1] ?? offsetOption[0])
    : typeof offsetOption === 'number'
      ? offsetOption
      : 8;
  const { refs, floatingStyles } = useFloating({
    placement: popperConfig?.placement ?? 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(offsetValue), flip(), shift({ padding: 8 })],
  });
  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  const filteredOptions = options.filter((option) => {
    if (!option || !option.label) return false;
    return option.label
      .toString()
      .toLowerCase()
      .includes(filterText.toLowerCase());
  });

  useClickOutSide(containerRef, isOpen, () => setIsOpen(false));

  const selectedOption: SelectorDisplayOption | undefined = value
    ? options.find((opt) => opt?.value === value)
    : {
        label: placeholder,
        icon: defaultStyles.icon,
        ...defaultStyles,
      };

  const getOptionStyles = (
    option: SelectorDisplayOption,
    isSelected: boolean,
  ) => {
    const defaultOptionStyles = {
      color: isSelected ? defaultStyles.selectedColor : defaultStyles.color,
      bgColor: isSelected
        ? defaultStyles.selectedBgColor
        : defaultStyles.bgColor,
      borderColor: defaultStyles.borderColor,
      hoverBgColor: defaultStyles.hoverBgColor,
    };

    return {
      ...defaultOptionStyles,
      ...option,
    };
  };

  if (!selectedOption || !selectedOption.label) {
    console.warn('Selector: Invalid option format detected');
    return null;
  }

  return (
    <Container ref={containerRef}>
      <Trigger
        ref={setReference}
        onClick={() => setIsOpen(!isOpen)}
        $styles={getOptionStyles(selectedOption, false)}
        $width={width}
        $hasIcon={!!selectedOption.icon}
      >
        {selectedOption.icon ? (
          <FontAwesomeIcon icon={selectedOption.icon} />
        ) : null}
        <span>{selectedOption.label}</span>
        <Chevron $isOpen={isOpen}>
          <FontAwesomeIcon icon={faChevronDown} />
        </Chevron>
      </Trigger>

      {isOpen && (
        <Dropdown
          ref={setFloating}
          style={floatingStyles}
          role="listbox"
          aria-label="Options"
        >
          <SearchContainer>
            <SearchIcon icon={faSearch} />
            <SearchInput
              type="text"
              placeholder="Buscar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              autoFocus
            />
          </SearchContainer>
          {allowClear && (
            <DropdownItem
              key="null-option"
              onClick={() => {
                onChange?.(null);
                setIsOpen(false);
              }}
              $styles={{
                color: !value ? '#1890ff' : defaultStyles.color,
                bgColor: !value ? '#e6f7ff' : defaultStyles.bgColor,
                borderColor: !value ? '#91d5ff' : defaultStyles.borderColor,
              }}
              $isSelected={!value}
            >
              <span>{clearText || 'Mostrar todos'}</span>
            </DropdownItem>
          )}
          {filteredOptions.map((option) => (
            <DropdownItem
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                setIsOpen(false);
              }}
              $styles={getOptionStyles(option, value === option.value)}
              $isSelected={value === option.value}
            >
              {option.icon && <FontAwesomeIcon icon={option.icon} />}
              <span>{option.label}</span>
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Trigger = styled.button<TriggerProps>`
  display: grid;
  grid-template-columns: ${({ $hasIcon }: TriggerProps) =>
    $hasIcon ? 'min-content 1fr min-content' : '1fr min-content'};
  gap: 8px;
  align-items: center;
  width: ${({ $width }: TriggerProps) => $width || 'min-content'};
  min-width: 160px;
  padding: 7px 12px;
  font-size: 0.9rem;
  color: ${({ $styles }: TriggerProps) => $styles.color};
  cursor: pointer;
  background: ${({ $styles }: TriggerProps) => $styles.bgColor};
  border: 1px solid ${({ $styles }: TriggerProps) => $styles.borderColor};
  border-radius: 6px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: start;
    white-space: nowrap;
  }

  &:hover {
    filter: brightness(0.95);
  }
`;

const Chevron = styled.span<ChevronProps>`
  transform: rotate(
    ${({ $isOpen }: ChevronProps) => ($isOpen ? '180deg' : '0deg')}
  );
  transition: transform 0.2s;
`;

const Dropdown = styled.ul`
  z-index: 1000;
  width: max-content;
  min-width: 200px;
  padding: 4px;
  margin: 0;
  list-style: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgb(0 0 0 / 15%);
`;

const DropdownItem = styled.li<DropdownItemProps>`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  color: ${({ $styles }: DropdownItemProps) => $styles.color};
  cursor: pointer;
  background: ${({ $isSelected, $styles }: DropdownItemProps) =>
    $isSelected ? $styles.bgColor : 'white'};
  border-radius: 6px;

  &:hover {
    background: ${({ $styles }: DropdownItemProps) =>
      $styles.hoverBgColor || $styles.bgColor};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #eee;
`;

const SearchIcon = styled(FontAwesomeIcon)`
  margin-right: 8px;
  color: #999;
`;

const SearchInput = styled.input`
  width: 100%;
  font-size: 0.9rem;
  outline: none;
  border: none;

  &::placeholder {
    color: #999;
  }
`;
