import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';

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
        // Usar índice seguro para selección
        const effectiveIndex =
          activeIndex >= filteredOptions.length
            ? filteredOptions.length - 1
            : activeIndex;

        const selected = filteredOptions[effectiveIndex >= 0 ? effectiveIndex : 0];
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

  // Estado para trackear cambio de dependencia
  const [prevDependencyKey, setPrevDependencyKey] = useState(dependencyKey);

  // PATRÓN RECOMENDADO REACT: Resetear estado al cambiar dependencyKey
  if (dependencyKey !== prevDependencyKey) {
    setPrevDependencyKey(dependencyKey);
    setInputValue('');
    setIsOpen(false);
    setActiveIndex(-1);
  }

  // Opción A: No cambiar el estado, solo clampa al leer (Estado derivado seguro)
  // Si activeIndex se pasa de opciones, usamos el último; si no hay opciones, -1.
  // Pero visualmente, si el usuario filtró y redujo opciones, el foco debería estar en una opción válida o ninguna.
  // Para activeDescendant y selección:
  const safeIndex =
    filteredOptions.length === 0
      ? -1
      : activeIndex >= filteredOptions.length
        ? filteredOptions.length - 1
        : activeIndex;

  const activeOptionId =
    safeIndex >= 0 && filteredOptions[safeIndex]
      ? `general-config-search-option-${filteredOptions[safeIndex].key}`
      : undefined;

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
  display: flex;
  justify-content: center;
  width: 100%;
`;

const SearchInner = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  padding: 0 1rem 0.8rem;

  @media (width <= 768px) {
    padding: 0 0.4rem 0.6rem;
  }
`;

const SearchField = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.45rem 0.85rem;
  background: #fff;
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 999px;
  box-shadow: 0 6px 16px rgb(15 23 42 / 8%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: var(--primary-color, #1677ff);
    box-shadow: 0 12px 28px rgb(22 119 255 / 18%);
  }

  @media (width <= 768px) {
    gap: 0.5rem;
    padding: 0.4rem 0.7rem;
  }
`;

const SearchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: rgb(0 0 0 / 45%);

  svg {
    font-size: 1rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
  color: rgb(0 0 0 / 88%);
  outline: none;
  background: transparent;
  border: none;

  &::placeholder {
    color: rgb(0 0 0 / 45%);
  }
`;

const SearchClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem;
  color: rgb(0 0 0 / 45%);
  cursor: pointer;
  background: transparent;
  border: none;
  transition: color 0.2s ease;

  &:hover {
    color: rgb(0 0 0 / 75%);
  }

  svg {
    font-size: 0.95rem;
  }
`;

const SearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 1rem;
  left: 1rem;
  z-index: 6;
  max-height: 320px;
  padding: 0.4rem 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 16px;
  box-shadow:
    0 26px 66px rgb(15 23 42 / 16%),
    0 12px 24px rgb(15 23 42 / 12%);

  @media (width <= 768px) {
    right: 0.4rem;
    left: 0.4rem;
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
  color: rgb(15 23 42 / 92%);
  transition: background 0.2s ease;

  &:hover,
  &:focus {
    outline: none;
    background: rgb(22 119 255 / 12%);
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
  color: rgb(0 0 0 / 88%);
`;

const SearchOptionMeta = styled.span`
  display: block;
  font-size: 0.75rem;
  color: rgb(0 0 0 / 48%);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SearchOptionDescription = styled.span`
  display: block;
  font-size: 0.85rem;
  line-height: 1.35;
  color: rgb(0 0 0 / 65%);
`;

const EmptyState = styled.div`
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  color: rgb(0 0 0 / 45%);
`;
