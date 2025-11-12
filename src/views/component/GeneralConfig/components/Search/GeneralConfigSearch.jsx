import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';

const EMPTY_RESULTS_TEXT = 'Sin resultados';

export const GeneralConfigSearch = ({
  records = [],
  onSelect,
  dependencyKey,
  placeholder = 'Buscar en configuración...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return records.slice(0, 8);
    }

    const normalized = inputValue
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return records
      .filter((record) =>
        record.tokens.some((token) => token.includes(normalized)),
      )
      .slice(0, 10);
  }, [inputValue, records]);

  const activeOptionId =
    activeIndex >= 0 && filteredOptions[activeIndex]
      ? `general-config-search-option-${filteredOptions[activeIndex].key}`
      : undefined;

  const handleSelect = useCallback(
    (entry) => {
      if (!entry) return;
      setInputValue('');
      setIsOpen(false);
      setActiveIndex(-1);
      onSelect?.(entry);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleInputChange = useCallback((event) => {
    setInputValue(event.target.value);
    setIsOpen(true);
  }, []);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    setActiveIndex(-1);
    setIsOpen(true);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (!filteredOptions.length) {
        if (event.key === 'Escape') {
          setIsOpen(false);
          setActiveIndex(-1);
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length
            ? filteredOptions.length - 1
            : next;
        });
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) return -1;
          return prev - 1;
        });
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selected = filteredOptions[activeIndex >= 0 ? activeIndex : 0];
        if (selected) {
          handleSelect(selected.entry);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [activeIndex, filteredOptions, handleSelect],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!filteredOptions.length) {
      if (activeIndex !== -1) {
        setActiveIndex(-1);
      }
      return;
    }

    if (activeIndex >= filteredOptions.length) {
      setActiveIndex(filteredOptions.length - 1);
    }
  }, [activeIndex, filteredOptions, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue('');
    setIsOpen(false);
    setActiveIndex(-1);
  }, [dependencyKey]);

  if (!records.length) {
    return null;
  }

  const showDropdown =
    isOpen && (filteredOptions.length > 0 || inputValue.trim().length > 0);

  return (
    <SearchContainer ref={containerRef}>
      <SearchInner>
        <SearchField>
          <SearchIcon aria-hidden="true">
            {icons.operationModes.search}
          </SearchIcon>
          <SearchInput
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="general-config-search-results"
            aria-activedescendant={activeOptionId}
            aria-haspopup="listbox"
            role="combobox"
            autoComplete="off"
          />
          {inputValue && (
            <SearchClearButton
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
            >
              {icons.operationModes.close}
            </SearchClearButton>
          )}
        </SearchField>

        {showDropdown && (
          <SearchDropdown id="general-config-search-results" role="listbox">
            {filteredOptions.length === 0 ? (
              <EmptyState>{EMPTY_RESULTS_TEXT}</EmptyState>
            ) : (
              filteredOptions.map((option, index) => (
                <SearchOptionButton
                  key={option.key}
                  id={`general-config-search-option-${option.key}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  $active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.entry)}
                >
                  <SearchOptionTitle>{option.label}</SearchOptionTitle>
                  <SearchOptionMeta>{option.category}</SearchOptionMeta>
                  <SearchOptionDescription>
                    {option.description}
                  </SearchOptionDescription>
                </SearchOptionButton>
              ))
            )}
          </SearchDropdown>
        )}
      </SearchInner>
    </SearchContainer>
  );
};

const SearchContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const SearchInner = styled.div`
  width: 100%;
  max-width: 640px;
  position: relative;
  padding: 0 1rem 0.8rem;

  @media (max-width: 768px) {
    padding: 0 0.4rem 0.6rem;
  }
`;

const SearchField = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: var(--primary-color, #1677ff);
    box-shadow: 0 12px 28px rgba(22, 119, 255, 0.18);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.7rem;
    gap: 0.5rem;
  }
`;

const SearchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.45);

  svg {
    font-size: 1rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.88);

  &::placeholder {
    color: rgba(0, 0, 0, 0.45);
  }
`;

const SearchClearButton = styled.button`
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  padding: 0.1rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(0, 0, 0, 0.75);
  }

  svg {
    font-size: 0.95rem;
  }
`;

const SearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 1rem;
  right: 1rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0 26px 66px rgba(15, 23, 42, 0.16),
    0 12px 24px rgba(15, 23, 42, 0.12);
  padding: 0.4rem 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  max-height: 320px;
  overflow-y: auto;
  z-index: 6;

  @media (max-width: 768px) {
    left: 0.4rem;
    right: 0.4rem;
  }
`;

const SearchOptionButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.92);
  transition: background 0.2s ease;

  &:hover,
  &:focus {
    outline: none;
    background: rgba(22, 119, 255, 0.12);
  }

  ${(props) =>
    props.$active &&
    `
    background: rgba(22, 119, 255, 0.16);
    box-shadow: inset 3px 0 0 rgba(22, 119, 255, 0.45);
  `}
`;

const SearchOptionTitle = styled.span`
  display: block;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
`;

const SearchOptionMeta = styled.span`
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.48);
`;

const SearchOptionDescription = styled.span`
  display: block;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.35;
`;

const EmptyState = styled.div`
  padding: 0.8rem 1rem;
  color: rgba(0, 0, 0, 0.45);
  font-size: 0.9rem;
`;
