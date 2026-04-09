import {
  faFilterCircleXmark,
  faArrowUpAZ,
  faArrowDownAZ,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip, Input, Drawer } from 'antd'; // Added DatePicker
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState, useEffect, memo, useRef } from 'react';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';

import { Selector } from '@/components/common/Selector/Selector';

import { StatusSelector } from './components/StatusSelector';
import { useFilterBar } from './hooks/useFilterBar';
import type { FilterBarSort, FilterBarState } from './hooks/useFilterBar';

// Import DateTime

const { RangePicker } = DatePicker; // Destructure RangePicker

type DateRangeFilterValue = {
  startDate: number;
  endDate: number;
};

type FilterValue = string | number | boolean | DateRangeFilterValue | null;

type FilterState = Record<string, FilterValue>;

type SelectorOption = {
  value: string | number;
  label: string | number;
  icon?: IconProp;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
  selectedBgColor?: string;
  selectedColor?: string;
};

type FilterConfigBase = {
  key: string;
  placeholder?: string;
  clearText?: string;
};

type FilterConfig =
  | (FilterConfigBase & {
      type: 'status';
      visibleStatus?: string[];
    })
  | (FilterConfigBase & {
      type: 'select';
      options?: SelectorOption[];
      icon?: IconProp;
      showSearch?: boolean;
    })
  | (FilterConfigBase & {
      type: 'dateRange';
    })
  | (FilterConfigBase & {
      type: 'search';
    });

type FilterDataConfig = Record<
  string,
  { data?: unknown[]; accessor: (item: unknown) => SelectorOption }
>;

type FilterBarConfig = {
  defaultValues?: FilterState;
  defaultSort?: FilterBarSort;
  filters?: FilterConfig[];
  showSortButton?: boolean;
  showResetButton?: boolean;
};

type FilterBarProps = {
  config?: FilterBarConfig;
  onChange?: (state: FilterBarState<FilterState>) => void;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  dataConfig?: FilterDataConfig;
};

const StyledRangePicker = styled(RangePicker)<{ $fullWidth?: boolean }>`
  width: ${(props) => (props.$fullWidth ? '100%' : 'auto')};
`;

export const FilterBar = memo(
  ({
    config = {},
    onChange,
    searchTerm,
    onSearchTermChange,
    dataConfig = {},
  }: FilterBarProps) => {
    const { state, setFilters, setSorting, resetAll } = useFilterBar(
      (config.defaultValues ?? {}) as FilterState,
      config.defaultSort ?? { isAscending: false },
    );

    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    // When component mounts, notify parent of initial state
    // Using ref to call onChange only once on mount
    const initializedRef = useRef(false);
    useEffect(() => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        onChange?.(state);
      }
    }, [onChange, state]);

    const handleFiltersChange = useCallback(
      (newFilters: FilterState) => {
        setFilters(newFilters);
        onChange?.({ ...state, filters: newFilters });
      },
      [state, onChange, setFilters],
    );

    const handleSortingChange = useCallback(
      (ascending: boolean) => {
        setSorting(ascending);
        onChange?.({
          filters: state.filters,
          isAscending: ascending,
        });
      },
      [state.filters, onChange, setSorting],
    );

    const handleReset = useCallback(() => {
      resetAll();
      onChange?.({
        filters: config.defaultValues || {},
        isAscending: config.defaultSort?.isAscending ?? false,
      });
    }, [config.defaultValues, config.defaultSort, onChange, resetAll]);

    const updateFilter = useCallback(
      (key: string, value: FilterValue) => {
        const newFilters = { ...state.filters, [key]: value };
        handleFiltersChange(newFilters);
      },
      [state.filters, handleFiltersChange],
    );

    const resolveStatusValue = useCallback((value: FilterValue) => {
      return typeof value === 'string' ? value : null;
    }, []);

    const resolveSelectorValue = useCallback((value: FilterValue) => {
      return typeof value === 'string' || typeof value === 'number'
        ? value
        : null;
    }, []);

    const renderFilter = useCallback(
      (filterConfig: FilterConfig, isInDrawer: boolean) => {
        if (filterConfig.type === 'search') return null;

        let finalOptions: SelectorOption[] =
          filterConfig.type === 'select' ? (filterConfig.options ?? []) : [];
        if (filterConfig.type === 'select' && dataConfig[filterConfig.key]) {
          const { data, accessor } = dataConfig[filterConfig.key];
          finalOptions = data ? data.map(accessor) : [];
        }

        switch (filterConfig.type) {
          case 'status':
            return (
              <FilterGroup key="status">
                <StatusSelector
                  value={resolveStatusValue(state.filters[filterConfig.key])}
                  onChange={(value) => updateFilter(filterConfig.key, value)}
                  visibleStatus={filterConfig.visibleStatus}
                  placeholder={filterConfig.placeholder}
                  clearText={filterConfig.clearText}
                  allowClear={true}
                  width={isInDrawer ? '100%' : undefined}
                />
              </FilterGroup>
            );
          case 'select':
            return (
              <FilterGroup key={filterConfig.key}>
                <Selector
                  value={resolveSelectorValue(state.filters[filterConfig.key])}
                  onChange={(value) => updateFilter(filterConfig.key, value)}
                  options={finalOptions}
                  placeholder={filterConfig.placeholder}
                  clearText={filterConfig.clearText}
                  icon={filterConfig.icon}
                  showSearch={filterConfig.showSearch}
                  allowClear={true}
                  width={isInDrawer ? '100%' : undefined}
                />
              </FilterGroup>
            );
          case 'dateRange': {
            // Added case for dateRange
            const rangeValue = state.filters[filterConfig.key];
            const rangeDates: [DateTime, DateTime] | null =
              typeof rangeValue === 'object' &&
              rangeValue !== null &&
              'startDate' in rangeValue &&
              'endDate' in rangeValue
                ? [
                    DateTime.fromMillis(
                      (rangeValue as DateRangeFilterValue).startDate,
                    ),
                    DateTime.fromMillis(
                      (rangeValue as DateRangeFilterValue).endDate,
                    ),
                  ]
                : null;
            return (
              <FilterGroup key={filterConfig.key}>
                <StyledRangePicker
                  $fullWidth={isInDrawer}
                  format="DD/MM/YYYY" // Adjust format as needed
                  value={rangeDates}
                  onChange={(dates) => {
                    if (dates?.[0] && dates?.[1]) {
                      updateFilter(filterConfig.key, {
                        startDate: dates[0].startOf('day').toMillis(),
                        endDate: dates[1].endOf('day').toMillis(),
                      });
                    } else {
                      updateFilter(filterConfig.key, null); // Clear the filter if dates are cleared
                    }
                  }}
                  placeholder={
                    filterConfig.placeholder
                      ? [filterConfig.placeholder, ' ']
                      : ['Fecha Inicio', 'Fecha Fin']
                  }
                  // Add additional props needed for RangePicker, e.g., format
                />
              </FilterGroup>
            );
          }
          default:
            return null;
        }
      },
      [
        state.filters,
        updateFilter,
        dataConfig,
        resolveStatusValue,
        resolveSelectorValue,
      ],
    );

    const searchInput = onSearchTermChange ? (
      <FilterGroup key="search">
        <Input
          placeholder="Buscar..."
          value={searchTerm ?? ''}
          onChange={(e) => onSearchTermChange(e.target.value)}
          allowClear
          style={{ width: '200px' }}
        />
      </FilterGroup>
    ) : null;

    const filters = useMemo(
      () =>
        config.filters?.map((filterConfig) =>
          renderFilter(filterConfig, false),
        ),
      [config.filters, renderFilter],
    );

    const filterContent = (
      <>
        {searchInput}
        {filters}
        {config.showSortButton && (
          <ButtonGroup>
            <Tooltip
              title={
                state.isAscending ? 'Ordenar descendente' : 'Ordenar ascendente'
              }
            >
              <Button
                onClick={() => handleSortingChange(!state.isAscending)}
                icon={
                  <FontAwesomeIcon
                    icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ}
                  />
                }
                type="default"
              />
            </Tooltip>
          </ButtonGroup>
        )}
        {config.showResetButton && (
          <ButtonGroup>
            <Tooltip title="Restablecer filtros">
              <Button
                onClick={handleReset}
                icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
                type="default"
                danger
              />
            </Tooltip>
          </ButtonGroup>
        )}
      </>
    );

    return (
      <FilterContainer>
        <DesktopWrapper>
          <FilterWrapper>{filterContent}</FilterWrapper>
        </DesktopWrapper>

        <MobileWrapper>
          <MobileHeader>
            <Input
              placeholder="Buscar..."
              value={searchTerm ?? ''}
              onChange={(e) => onSearchTermChange?.(e.target.value)}
              allowClear
              style={{ flex: 1 }}
            />
            <Button
              onClick={() => setIsDrawerVisible(true)}
              icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
            >
              Filtros
            </Button>
          </MobileHeader>

          <Drawer
            title="Filtros"
            placement="bottom"
            onClose={() => setIsDrawerVisible(false)}
            open={isDrawerVisible}
            size="large"
          >
            <MobileFilterWrapper>
              {config.filters?.map((filterConfig) =>
                renderFilter(filterConfig, true),
              )}
              <DrawerFooter>
                {config.showSortButton && (
                  <Button
                    onClick={() => handleSortingChange(!state.isAscending)}
                    icon={
                      <FontAwesomeIcon
                        icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ}
                      />
                    }
                    type="default"
                  >
                    {state.isAscending
                      ? 'Ordenar descendente'
                      : 'Ordenar ascendente'}
                  </Button>
                )}
                {config.showResetButton && (
                  <Button
                    onClick={handleReset}
                    icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
                    type="primary"
                    danger
                  >
                    Restablecer filtros
                  </Button>
                )}
              </DrawerFooter>
            </MobileFilterWrapper>
          </Drawer>
        </MobileWrapper>
      </FilterContainer>
    );
  },
);

FilterBar.displayName = 'FilterBar';

const FilterContainer = styled.div`
  padding: 0.2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);

  @media (width <= 768px) {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 0.5rem;
    border-radius: 0;
  }
`;

const FilterWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;

  @media (width <= 768px) {
    gap: 0.5rem;

    /* Hacer que los elementos ocupen todo el ancho en m├│vil */
    & > div {
      flex: 1 1 100%;
      min-width: 100%;
    }

    /* Los botones de ordenar y reset se mantienen en l├¡nea */
    & > div:last-child,
    & > div:nth-last-child(2) {
      flex: 0 1 auto;
      min-width: auto;
    }
  }
`;

const FilterGroup = styled.div`
  /* Asegurar que los inputs y selectores tengan el ancho completo en m├│vil */
  @media (width <= 768px) {
    .ant-input,
    .ant-select,
    .ant-picker {
      /* Ensure DatePicker also takes full width on mobile */
      width: 100% !important;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.3rem;
  align-items: center;

  @media (width <= 768px) {
    margin-left: auto;
  }
`;

const DesktopWrapper = styled.div`
  @media (width <= 768px) {
    display: none;
  }
`;

const MobileWrapper = styled.div`
  display: none;

  @media (width <= 768px) {
    display: block;
  }
`;

const MobileHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  gap: 8px;
  background-color: white;
`;

const MobileFilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .ant-select,
  .ant-picker {
    /* Ensure DatePicker also takes full width in mobile drawer */
    width: 100%;
  }
`;

const DrawerFooter = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
`;
