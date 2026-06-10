import type { ChangeEvent } from 'react';
import { useId } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SidebarSearch = ({ value, onChange }: SidebarSearchProps) => {
  const searchInputId = useId();
  const hasValue = value.trim().length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <SearchShell>
      <SearchLabel htmlFor={searchInputId}>Buscar en el menú</SearchLabel>
      <SearchField>
        <SearchIcon aria-hidden="true">{icons.forms.search}</SearchIcon>
        <SearchInput
          id={searchInputId}
          type="search"
          autoComplete="off"
          placeholder="Buscar en el menú"
          value={value}
          onChange={handleChange}
        />
        {hasValue && (
          <ClearButton
            aria-label="Limpiar búsqueda del menú"
            title="Limpiar búsqueda"
            type="button"
            onClick={handleClear}
          >
            {icons.operationModes.close}
          </ClearButton>
        )}
      </SearchField>
    </SearchShell>
  );
};

const SearchShell = styled.div`
  padding: 0.75rem 0.9rem 0.65rem;
  background-color: ${(props: any) => props.theme.bg.color2};
`;

const SearchLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
  border: 0;
`;

const SearchField = styled.div`
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.5rem;
  padding: 0 0.7rem;
  color: var(--gray-6);
  background-color: ${(props: any) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: var(--border-radius, 8px);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:focus-within {
    border-color: ${(props: any) => props.theme.bg.color};
    box-shadow: 0 0 0 3px rgb(66 165 245 / 18%);
  }
`;

const SearchIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentcolor;
`;

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 2.35rem;
  padding: 0;
  font: inherit;
  font-size: 0.95rem;
  color: rgb(45 45 45);
  background: transparent;
  border: 0;
  outline: 0;

  &::placeholder {
    color: rgb(117 117 117);
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    appearance: none;
  }
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  color: var(--gray-6);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: ${(props: any) => props.theme.bg.color};
    background-color: rgb(66 165 245 / 12%);
  }

  &:focus-visible {
    outline: 2px solid ${(props: any) => props.theme.bg.color};
    outline-offset: 2px;
  }
`;
