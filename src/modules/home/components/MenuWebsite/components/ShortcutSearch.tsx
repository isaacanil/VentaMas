import { Header, ListBox, SearchField, Surface } from '@heroui/react';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  useDeveloperFeaturesData,
  useMenuCardData,
} from '@/modules/home/pages/Home/CardData';

import type { FeatureCardData } from '@/modules/home/pages/Home/components/FeatureCardList/FeatureCard';
import type { JSX, Key } from 'react';

interface ShortcutSearchProps {
  includeDeveloperFeatures?: boolean;
}

interface ShortcutOption {
  category: string;
  route: string;
  searchText: string;
  title: string;
  value: string;
}

interface ShortcutOptionGroup {
  category: string;
  options: ShortcutOption[];
}

const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isFeatureCardData = (card: unknown): card is FeatureCardData => {
  if (!card || typeof card !== 'object') return false;
  const candidate = card as Partial<FeatureCardData>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.route === 'string'
  );
};

const normalizeCardData = (data: unknown): FeatureCardData[] =>
  Array.isArray(data) ? data.filter(isFeatureCardData) : [];

export const ShortcutSearch = ({
  includeDeveloperFeatures = false,
}: ShortcutSearchProps): JSX.Element => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuShortcuts = normalizeCardData(useMenuCardData(user));
  const developerShortcuts = normalizeCardData(useDeveloperFeaturesData());
  const shortcuts = useMemo(() => {
    const base = includeDeveloperFeatures
      ? [...developerShortcuts, ...menuShortcuts]
      : menuShortcuts;
    const seenRoutes = new Set<string>();

    return base.filter((shortcut) => {
      if (!shortcut.route || seenRoutes.has(shortcut.route)) return false;
      seenRoutes.add(shortcut.route);
      return true;
    });
  }, [developerShortcuts, includeDeveloperFeatures, menuShortcuts]);

  const options = useMemo<ShortcutOption[]>(() => {
    return shortcuts.map((shortcut) => ({
      category: shortcut.category,
      route: shortcut.route ?? '',
      searchText: normalizeSearch(
        `${shortcut.title} ${shortcut.category} ${shortcut.route}`,
      ),
      title: shortcut.title,
      value: shortcut.route ?? '',
    }));
  }, [shortcuts]);

  const normalizedQuery = normalizeSearch(searchValue);
  const visibleOptions = useMemo(
    () =>
      normalizedQuery
        ? options
            .filter((option) => option.searchText.includes(normalizedQuery))
            .slice(0, 8)
        : [],
    [normalizedQuery, options],
  );
  const visibleOptionGroups = useMemo<ShortcutOptionGroup[]>(() => {
    const groups = new Map<string, ShortcutOption[]>();

    visibleOptions.forEach((option) => {
      const group = groups.get(option.category) ?? [];
      group.push(option);
      groups.set(option.category, group);
    });

    return Array.from(groups, ([category, groupOptions]) => ({
      category,
      options: groupOptions,
    }));
  }, [visibleOptions]);
  const shouldShowResults = isSearchFocused && Boolean(normalizedQuery);

  const handleSelect = useCallback(
    (route: string): void => {
      if (!route) return;
      setSearchValue('');
      setIsSearchFocused(false);
      navigate(route);
    },
    [navigate],
  );

  const handleSubmit = useCallback(
    (value: string): void => {
      const query = normalizeSearch(value);
      if (!query) return;
      const firstMatch = options.find((option) =>
        option.searchText.includes(query),
      );
      handleSelect(firstMatch?.route ?? '');
    },
    [handleSelect, options],
  );

  const handleAction = useCallback(
    (key: Key): void => {
      handleSelect(String(key));
    },
    [handleSelect],
  );

  const handleClear = useCallback((): void => {
    setSearchValue('');
  }, []);

  return (
    <SearchContainer
      onBlurCapture={(event) => {
        const nextFocus = event.relatedTarget;
        if (nextFocus instanceof Node && event.currentTarget.contains(nextFocus)) {
          return;
        }
        setIsSearchFocused(false);
      }}
      onFocusCapture={() => setIsSearchFocused(true)}
    >
      <SearchField
        aria-label="Buscar atajo"
        fullWidth
        name="shortcut-search"
        onChange={setSearchValue}
        onClear={handleClear}
        onSubmit={handleSubmit}
        value={searchValue}
        variant="secondary"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input autoComplete="off" placeholder="Buscar atajo" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {shouldShowResults ? (
        <ResultsSurface variant="default">
          {visibleOptions.length > 0 ? (
            <ListBox
              aria-label="Atajos encontrados"
              onAction={handleAction}
              selectionMode="none"
            >
              {visibleOptionGroups.map((group) => (
                <ListBox.Section key={group.category}>
                  <GroupHeader>{group.category}</GroupHeader>
                  {group.options.map((option) => (
                    <ListBox.Item
                      id={option.value}
                      key={option.value}
                      textValue={`${option.title} ${option.category}`}
                    >
                      <OptionLabel>
                        <OptionTitle>{option.title}</OptionTitle>
                      </OptionLabel>
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
              ))}
            </ListBox>
          ) : (
            <EmptyResult>Sin atajos</EmptyResult>
          )}
        </ResultsSurface>
      ) : null}
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
    order: 3;
    flex-basis: 100%;
    max-width: none;
  }
`;

const ResultsSurface = styled(Surface)`
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  left: 0;
  z-index: 20;
  min-width: 0;
  max-height: min(23rem, calc(100vh - 6.5rem));
  overflow-y: auto;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-xl);

  .list-box {
    width: 100%;
    padding: 0.35rem;
  }

  .list-box-section + .list-box-section {
    padding-top: 0.35rem;
    margin-top: 0.35rem;
    border-top: 1px solid var(--ds-color-border-subtle);
  }

  .list-box-item {
    display: flex;
    align-items: flex-start;
    width: 100%;
    min-width: 0;
    padding: 0.65rem 0.75rem;
    border-radius: var(--ds-radius-sm);
  }

  .list-box-item:hover,
  .list-box-item[data-hovered='true'],
  .list-box-item[data-focus-visible='true'] {
    background: rgb(37 99 235 / 9%);
    outline: 0;
  }
`;

const GroupHeader = styled(Header)`
  display: flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.2rem 0.75rem 0.15rem;
  margin: 0.05rem 0 0.2rem;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-action-primary);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const OptionLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const EmptyResult = styled.div`
  padding: 0.8rem 0.85rem;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
`;

const OptionTitle = styled.span`
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
