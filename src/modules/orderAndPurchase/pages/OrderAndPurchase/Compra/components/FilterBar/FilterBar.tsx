import {
  faArrowDownAZ,
  faArrowUpAZ,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { memo, useCallback, useEffect, useMemo } from 'react';

import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar/FilterBar';
import type { FilterBarItem } from '@/components/common/FilterBar/FilterBar';

import { useFilterBar } from './hooks/useFilterBar';
import type {
  DataConfigMap,
  FilterConfigItem,
  FilterConfigState,
  FilterOption,
  FilterState,
} from './types';

const emptyConfig: FilterConfigState = {
  filters: [],
  defaultValues: {},
  defaultSort: { isAscending: false },
  showSortButton: false,
  showResetButton: false,
};

const defaultStatusOptions: FilterOption[] = [
  { value: 'completed', label: 'Completado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'processing', label: 'En Proceso' },
];

interface FilterBarProps {
  config?: FilterConfigState;
  onChange?: (state: FilterState) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  dataConfig?: DataConfigMap;
  extraItems?: FilterBarItem[];
  trailingItems?: FilterBarItem[];
  hasActiveExtraFilters?: boolean;
  onClearExtraFilters?: () => void;
  compactSortButton?: boolean;
  sortLabel?: string;
}

const normalizeFilterValue = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(normalizeFilterValue);
  return value;
};

const areFilterValuesEqual = (left: unknown, right: unknown): boolean => {
  return JSON.stringify(normalizeFilterValue(left)) === JSON.stringify(normalizeFilterValue(right));
};

const resolveStatusOptions = (filterConfig: FilterConfigItem): FilterOption[] => {
  if (!filterConfig.visibleStatus?.length) {
    return defaultStatusOptions;
  }

  return defaultStatusOptions.filter((status) =>
    filterConfig.visibleStatus?.includes(status.value),
  );
};

const resolveFilterOptions = (
  filterConfig: FilterConfigItem,
  dataConfig: DataConfigMap,
): FilterOption[] => {
  if (filterConfig.type === 'status') {
    return resolveStatusOptions(filterConfig);
  }

  const dataEntry = dataConfig[filterConfig.key];
  if (dataEntry) {
    return dataEntry.data.map((item) => dataEntry.accessor(item)) as FilterOption[];
  }

  return filterConfig.options || [];
};

export const FilterBar = memo(
  ({
    config = emptyConfig,
    onChange,
    searchTerm,
    onSearchTermChange,
    dataConfig = {},
    extraItems = [],
    trailingItems = [],
    hasActiveExtraFilters = false,
    onClearExtraFilters,
    compactSortButton = false,
    sortLabel = 'Orden',
  }: FilterBarProps) => {
    const { state, setFilters, setSorting, resetAll } = useFilterBar(
      config.defaultValues,
      config.defaultSort,
    );

    useEffect(() => {
      onChange?.(state);
    }, [onChange, state]);

    const updateFilter = useCallback(
      (key: string, value: unknown) => {
        setFilters({
          ...state.filters,
          [key]: value,
        });
      },
      [setFilters, state.filters],
    );

    const toggleSorting = useCallback(() => {
      setSorting(!state.isAscending);
    }, [setSorting, state.isAscending]);

    const hasActiveFilters = useMemo(() => {
      const filtersDifferFromDefaults = config.filters.some((filterConfig) => {
        return !areFilterValuesEqual(
          state.filters[filterConfig.key],
          config.defaultValues[filterConfig.key],
        );
      });

      return (
        filtersDifferFromDefaults ||
        state.isAscending !== (config.defaultSort?.isAscending ?? false)
      );
    }, [config.defaultSort?.isAscending, config.defaultValues, config.filters, state.filters, state.isAscending]);

    const items = useMemo(
      () => [
        {
          key: 'search',
          type: 'input' as const,
          section: 'main' as const,
          label: 'Buscar',
          value: searchTerm,
          onChange: onSearchTermChange,
          placeholder: 'Buscar...',
          minWidth: 220,
          width: 220,
          props: {
            allowClear: true,
          },
        },
        ...config.filters.map((filterConfig) => {
          const options = resolveFilterOptions(filterConfig, dataConfig).map(
            (option) => ({
              value: option.value,
              label: option.label,
            }),
          );

          return {
            key: filterConfig.key,
            type: 'select' as const,
            section: 'main' as const,
            label: filterConfig.placeholder || filterConfig.key,
            value: (state.filters[filterConfig.key] as string | null | undefined) ?? null,
            onChange: (value: string | number | Array<string | number> | null) =>
              updateFilter(filterConfig.key, value),
            options,
            placeholder: filterConfig.placeholder,
            allowClear: filterConfig.allowClear,
            minWidth: 180,
            props: {
              showSearch: Boolean(filterConfig.showSearch),
              optionFilterProp: 'label',
            },
          };
        }),
        ...extraItems,
        ...(config.showSortButton
          ? [
              {
                key: 'sort',
                type: 'custom' as const,
                section: 'main' as const,
                label: undefined,
                wrap: !compactSortButton,
                collapsible: false,
                minWidth: compactSortButton ? 88 : undefined,
                wrapperStyle: compactSortButton
                  ? {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      gap: 4,
                    }
                  : undefined,
                render: () => (
                  compactSortButton ? (
                    <>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          lineHeight: 1.2,
                          color: 'var(--ds-color-text-secondary, #666)',
                        }}
                      >
                        {sortLabel}
                      </span>
                      <Button
                        onClick={toggleSorting}
                        icon={
                          <FontAwesomeIcon
                            icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ}
                          />
                        }
                        title={
                          state.isAscending
                            ? 'Orden ascendente'
                            : 'Orden descendente'
                        }
                        aria-label={
                          state.isAscending
                            ? 'Orden ascendente'
                            : 'Orden descendente'
                        }
                      />
                    </>
                  ) : (
                    <Button
                      onClick={toggleSorting}
                      icon={
                        <FontAwesomeIcon
                          icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ}
                        />
                      }
                      title={
                        state.isAscending
                          ? 'Orden ascendente'
                          : 'Orden descendente'
                      }
                      aria-label={
                        state.isAscending
                          ? 'Orden ascendente'
                          : 'Orden descendente'
                      }
                    >
                      {state.isAscending
                        ? 'Orden ascendente'
                        : 'Orden descendente'}
                    </Button>
                  )
                ),
              },
            ]
          : []),
        ...trailingItems,
      ],
      [
        compactSortButton,
        config.filters,
        config.showSortButton,
        dataConfig,
        extraItems,
        sortLabel,
        onSearchTermChange,
        searchTerm,
        state.filters,
        state.isAscending,
        trailingItems,
        toggleSorting,
        updateFilter,
      ],
    );

    const handleClearFilters = useCallback(() => {
      resetAll();
      onClearExtraFilters?.();
    }, [onClearExtraFilters, resetAll]);

    const shouldShowClearButton = config.showResetButton || hasActiveExtraFilters;
    const hasAnyActiveFilters = hasActiveFilters || hasActiveExtraFilters;

    return (
      <CommonFilterBar
        items={items}
        hasActiveFilters={shouldShowClearButton ? hasAnyActiveFilters : false}
        onClearFilters={shouldShowClearButton ? handleClearFilters : undefined}
        labels={{
          drawerTrigger: 'Filtros',
          drawerTitle: 'Filtros',
          modalTitle: 'Filtros adicionales',
          more: 'Más filtros',
          clear: 'Restablecer filtros',
        }}
      />
    );
  },
);

FilterBar.displayName = 'FilterBar';
