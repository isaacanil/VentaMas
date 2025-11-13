import { faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useRef } from 'react';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { useClickOutSide } from '../../../hooks/useClickOutSide';

export const Selector = ({
  value,
  onChange,
  options = [],
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
    placement: 'bottom-start',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'preventOverflow', options: { boundary: 'viewport' } },
    ],
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const referenceRef = useRef(null);
  const containerRef = useRef(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(
    referenceRef.current,
    popperElement,
    popperConfig,
  );

  const filteredOptions = options.filter((option) => {
    if (!option || !option.label) return false;
    return option.label
      .toString()
      .toLowerCase()
      .includes(filterText.toLowerCase());
  });

  const selectedOption = value
    ? options.find((opt) => opt?.value === value)
    : {
        label: placeholder,
        icon: defaultStyles.icon,
        ...defaultStyles,
      };

  // Validación adicional para selectedOption
  if (!selectedOption || !selectedOption.label) {
    console.warn('Selector: Invalid option format detected');
    return null;
  }

  useClickOutSide(containerRef, isOpen, () => setIsOpen(false));

  const getOptionStyles = (option, isSelected) => {
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

  return (
    <Container ref={containerRef}>
      <Trigger
        ref={referenceRef}
        onClick={() => setIsOpen(!isOpen)}
        styles={getOptionStyles(selectedOption, false)}
        $width={width}
        $hasIcon={!!selectedOption.icon}
      >
        {selectedOption.icon ? (
          <FontAwesomeIcon icon={selectedOption.icon} />
        ) : null}
        <span>{selectedOption.label}</span>
        <Chevron isOpen={isOpen}>
          <FontAwesomeIcon icon={faChevronDown} />
        </Chevron>
      </Trigger>

      {isOpen && (
        <Dropdown
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
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
                onChange(null);
                setIsOpen(false);
              }}
              styles={{
                color: !value ? '#1890ff' : defaultStyles.color,
                bgColor: !value ? '#e6f7ff' : defaultStyles.bgColor,
                borderColor: !value ? '#91d5ff' : defaultStyles.borderColor,
              }}
              isSelected={!value}
            >
              <span>{clearText || 'Mostrar todos'}</span>
            </DropdownItem>
          )}
          {filteredOptions.map((option) => (
            <DropdownItem
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              styles={getOptionStyles(option, value === option.value)}
              isSelected={value === option.value}
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

const Trigger = styled.button`
  display: grid;
  grid-template-columns: ${({ $hasIcon }) =>
    $hasIcon ? 'min-content 1fr min-content' : '1fr min-content'};
  gap: 8px;
  align-items: center;
  width: ${({ $width }) => $width || 'min-content'};
  min-width: 160px;
  padding: 7px 12px;
  font-size: 0.9rem;
  color: ${({ styles }) => styles.color};
  cursor: pointer;
  background: ${({ styles }) => styles.bgColor};
  border: 1px solid ${({ styles }) => styles.borderColor};
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

const Chevron = styled.span`
  transform: rotate(${(props) => (props.isOpen ? '180deg' : '0deg')});
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

const DropdownItem = styled.li`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  color: ${({ styles }) => styles.color};
  cursor: pointer;
  background: ${({ isSelected, styles }) =>
    isSelected ? styles.bgColor : 'white'};
  border-radius: 6px;

  &:hover {
    background: ${({ styles }) => styles.hoverBgColor || styles.bgColor};
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
