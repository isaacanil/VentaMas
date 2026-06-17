import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { VmSearchField } from '@/components/heroui';
import { selectUser } from '@/features/auth/userSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import {
  useDeveloperFeaturesData,
  useMenuCardData,
} from '@/modules/home/pages/Home/CardData';
import {
  normalizeRoutableFeatureCardData,
  normalizeSearch,
  uniqueShortcutsByRoute,
  type RoutableFeatureCardData,
} from '@/modules/home/utils/homeShortcutUtils';
import type { JSX } from 'react';

interface ShortcutSearchProps {
  activeScope?: ShortcutTabKey;
  includeDeveloperFeatures?: boolean;
  onFocusSearch?: () => void;
  onSearchValueChange?: (value: string) => void;
  searchValue?: string;
}

interface ShortcutOption {
  category: string;
  route: string;
  searchText: string;
  title: string;
  value: string;
}

type ShortcutTabKey = 'user' | 'developer';

const toShortcutOptions = (
  shortcuts: RoutableFeatureCardData[],
): ShortcutOption[] =>
  shortcuts.map((shortcut) => ({
    category: shortcut.category,
    route: shortcut.route,
    searchText: normalizeSearch(
      `${shortcut.title} ${shortcut.category} ${shortcut.route}`,
    ),
    title: shortcut.title,
    value: shortcut.route,
  }));

export const ShortcutSearch = ({
  activeScope = 'user',
  includeDeveloperFeatures = false,
  onFocusSearch,
  onSearchValueChange,
  searchValue,
}: ShortcutSearchProps): JSX.Element => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uncontrolledSearchValue, setUncontrolledSearchValue] = useState('');
  const resolvedSearchValue = searchValue ?? uncontrolledSearchValue;
  const menuShortcuts = uniqueShortcutsByRoute(
    normalizeRoutableFeatureCardData(useMenuCardData(user)),
  );
  const developerShortcuts = uniqueShortcutsByRoute(
    normalizeRoutableFeatureCardData(useDeveloperFeaturesData()),
  );
  const { abilities } = useUserAccess();
  const canUseDeveloperShortcuts = Boolean(
    includeDeveloperFeatures && abilities?.can('developerAccess', 'all'),
  );

  const userOptions = useMemo<ShortcutOption[]>(
    () => toShortcutOptions(menuShortcuts),
    [menuShortcuts],
  );
  const developerOptions = useMemo<ShortcutOption[]>(
    () =>
      canUseDeveloperShortcuts ? toShortcutOptions(developerShortcuts) : [],
    [canUseDeveloperShortcuts, developerShortcuts],
  );
  const selectedScope: ShortcutTabKey =
    canUseDeveloperShortcuts && activeScope === 'developer'
      ? 'developer'
      : 'user';
  const activeOptions =
    selectedScope === 'developer' ? developerOptions : userOptions;

  const setResolvedSearchValue = useCallback(
    (value: string): void => {
      onSearchValueChange?.(value);
      if (searchValue === undefined) {
        setUncontrolledSearchValue(value);
      }
    },
    [onSearchValueChange, searchValue],
  );

  const handleSearchFocus = useCallback((): void => {
    onFocusSearch?.();
  }, [onFocusSearch]);

  const handleValueChange = useCallback(
    (value: string): void => {
      onFocusSearch?.();
      setResolvedSearchValue(value);
    },
    [onFocusSearch, setResolvedSearchValue],
  );

  const handleSubmit = useCallback(
    (value: string): void => {
      const query = normalizeSearch(value);
      if (!query) return;
      const firstMatch = activeOptions.find((option) =>
        option.searchText.includes(query),
      );
      if (!firstMatch?.route) return;
      setResolvedSearchValue('');
      navigate(firstMatch.route);
    },
    [activeOptions, navigate, setResolvedSearchValue],
  );

  const handleClear = useCallback((): void => {
    setResolvedSearchValue('');
  }, [setResolvedSearchValue]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent): void => {
      if (
        event.key.toLowerCase() !== 'k' ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return;
      }

      event.preventDefault();
      onFocusSearch?.();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onFocusSearch]);

  return (
    <SearchContainer onFocusCapture={handleSearchFocus}>
      <VmSearchField
        aria-label="Buscar atajo"
        fullWidth
        name="shortcut-search"
        onChange={handleValueChange}
        onClear={handleClear}
        onSubmit={handleSubmit}
        value={resolvedSearchValue}
        variant="secondary"
      >
        <VmSearchField.Group>
          <VmSearchField.SearchIcon />
          <VmSearchField.Input
            ref={inputRef}
            autoComplete="off"
            placeholder="Buscar módulo o acción"
          />
          {!resolvedSearchValue && (
            <SearchShortcutHint aria-hidden="true">Ctrl K</SearchShortcutHint>
          )}
          <VmSearchField.ClearButton />
        </VmSearchField.Group>
      </VmSearchField>
    </SearchContainer>
  );
};

const SearchContainer = styled.div`
  position: relative;
  flex: 1 1 320px;
  min-width: min(100%, 220px);
  max-width: 440px;

  .search-field {
    width: 100%;
  }

  .search-field__group {
    display: flex;
    align-items: center;
    width: 100%;
    height: 42px;
    padding: 0 0.3rem 0 0.5rem;
    overflow: hidden;
    background: rgb(255 255 255 / 92%);
    border: 1px solid rgb(255 255 255 / 38%);
    border-radius: 999px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 55%);
    backdrop-filter: blur(14px);
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .search-field[data-focus-within] .search-field__group {
    background: rgb(255 255 255 / 100%);
    border-color: rgb(255 255 255 / 82%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 62%),
      0 0 0 3px rgb(255 255 255 / 22%);
  }

  .search-field__search-icon {
    flex: 0 0 auto;
    width: 1rem;
    height: 1rem;
    margin: 0;
    color: rgb(30 64 175 / 58%);
  }

  .search-field__input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    padding: 0 0.35rem;
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    color: rgb(15 23 42 / 90%);
    background: transparent;
    border: 0;
    outline: 0;
  }

  .search-field__input::placeholder {
    color: rgb(71 85 105 / 58%);
  }

  .search-field__clear-button {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 1.55rem;
    height: 1.55rem;
    margin: 0;
    color: rgb(30 64 175 / 62%);
    background: transparent;
    border: 0;
    border-radius: 999px;
    transition:
      background-color 140ms ease,
      color 140ms ease;
  }

  .search-field__clear-button:hover,
  .search-field__clear-button:focus-visible {
    color: rgb(29 78 216 / 88%);
    background: rgb(37 99 235 / 10%);
  }

  @media (width <= 768px) {
    grid-area: search;
    order: 3;
    flex-basis: 100%;
    width: 100%;
    min-width: 0;
    max-width: none;
  }
`;

const SearchShortcutHint = styled.span`
  flex: 0 0 auto;
  padding: 0.1rem 0.4rem;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: rgb(30 64 175 / 60%);
  border: 1px solid rgb(30 64 175 / 16%);
  border-radius: var(--ds-radius-sm);
`;
