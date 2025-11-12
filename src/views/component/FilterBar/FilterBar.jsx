import {
  faFilterCircleXmark,
  faArrowUpAZ,
  faArrowDownAZ,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Tooltip, Input, Drawer, DatePicker } from 'antd' // Added DatePicker
import dayjs from 'dayjs'
import { useCallback, useMemo, useState, useEffect, memo } from 'react'
import styled from 'styled-components'

import { Selector } from '../../../components/common/Selector/Selector';

import { StatusSelector } from './components/StatusSelector'
import { useFilterBar } from './hooks/useFilterBar'

// Import DateTime

const { RangePicker } = DatePicker; // Destructure RangePicker

export const FilterBar = memo(({
  config = {},
  onChange,
  searchTerm,
  onSearchTermChange,
  dataConfig = {}
}) => {
  const { state, setFilters, setSorting, resetAll } = useFilterBar(
    config.defaultValues,
    config.defaultSort
  );

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // When component mounts, notify parent of initial state
  useEffect(() => {
    onChange?.(state)
  }, [])

  const handleFiltersChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      onChange?.({ ...state, filters: newFilters });
    },
    [state, onChange, setFilters]
  );

  const handleSortingChange = useCallback(
    (ascending) => {
      setSorting(ascending)
      onChange?.({
        filters: state.filters,
        isAscending: ascending
      });
    },
    [state.filters, onChange, setSorting]
  );

  const handleReset = useCallback(() => {
    resetAll();
    onChange?.({
      filters: config.defaultValues || {},
      isAscending: config.defaultSort?.isAscending ?? false
    });
  }, [config.defaultValues, config.defaultSort, onChange, resetAll]);

  const updateFilter = (key, value) => {
    const newFilters = { ...state.filters, [key]: value };
    handleFiltersChange(newFilters);
  }
  const renderFilter = useCallback((filterConfig, isInDrawer) => {
    if (filterConfig.type === 'search') return null;
    
    let finalOptions = filterConfig.options || [];
    if (dataConfig[filterConfig.key]) {
      const { data, accessor } = dataConfig[filterConfig.key];
      finalOptions = data ? data.map(accessor) : [];
    }

    switch (filterConfig.type) {
      case 'status':
        return (
          <FilterGroup key="status">
            <StatusSelector
              value={state.filters[filterConfig.key]}
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
              value={state.filters[filterConfig.key]}
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
      case 'dateRange': // Added case for dateRange
        return (
          <FilterGroup key={filterConfig.key}>
            <RangePicker
              style={{ width: isInDrawer ? '100%' : 'auto' }} // Full width in drawer
              format="DD/MM/YYYY" // Adjust format as needed
              value={(
                state.filters[filterConfig.key]?.startDate &&
                state.filters[filterConfig.key]?.endDate
              ) ? [
                dayjs(state.filters[filterConfig.key].startDate),
                dayjs(state.filters[filterConfig.key].endDate)
              ] : null}
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  updateFilter(filterConfig.key, {
                    startDate: dates[0].startOf('day').valueOf(),
                    endDate: dates[1].endOf('day').valueOf(),
                  });
                } else {
                  updateFilter(filterConfig.key, null); // Clear the filter if dates are cleared
                }
              }}
              placeholder={filterConfig.placeholder ? [filterConfig.placeholder, ' '] : ['Fecha Inicio', 'Fecha Fin']}
              // Add any other props needed for RangePicker, e.g., format
            />
          </FilterGroup>
        );
      default:
        return null
    }
  }, [state.filters, dataConfig])

  const searchInput = (
    <FilterGroup key="search">
      <Input
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        allowClear
        style={{ width: '200px' }}
      />
    </FilterGroup>
  );

  const filters = useMemo(() =>
    config.filters?.map(filterConfig => renderFilter(filterConfig, false)),
    [config.filters, renderFilter]
  );

  const filterContent = (
    <>
      {onSearchTermChange && searchInput}
      {filters}
      {config.showSortButton && (
        <ButtonGroup>
          <Tooltip title={state.isAscending ? "Ordenar descendente" : "Ordenar ascendente"}>
            <Button
              onClick={() => handleSortingChange(!state.isAscending)}
              icon={<FontAwesomeIcon icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ} />}
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
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
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
          width="100%"
        >
          <MobileFilterWrapper>
            {config.filters?.map(filterConfig => renderFilter(filterConfig, true))}
            <DrawerFooter>
              {config.showSortButton && (
                <Button
                  onClick={() => handleSortingChange(!state.isAscending)}
                  icon={<FontAwesomeIcon icon={state.isAscending ? faArrowUpAZ : faArrowDownAZ} />}
                  type="default"
                >
                  {state.isAscending ? "Ordenar descendente" : "Ordenar ascendente"}
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
})

FilterBar.displayName = 'FilterBar'

const FilterContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 0.2rem;
  
  @media (max-width: 768px) {
    border-radius: 0;
    padding: 0.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }
`

const FilterWrapper = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.5rem;
    
    /* Hacer que los elementos ocupen todo el ancho en móvil */
    & > div {
      flex: 1 1 100%;
      min-width: 100%;
    }

    /* Los botones de ordenar y reset se mantienen en línea */
    & > div:last-child,
    & > div:nth-last-child(2) {
      flex: 0 1 auto;
      min-width: auto;
    }
  }
`

const FilterGroup = styled.div`
  /* Asegurar que los inputs y selectores tengan el ancho completo en móvil */
  @media (max-width: 768px) {
    .ant-input,
    .ant-select,
    .ant-picker { /* Ensure DatePicker also takes full width on mobile */
      width: 100% !important;
    }
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.3rem;
  align-items: center;

  @media (max-width: 768px) {
    margin-left: auto;
  }
`

const DesktopWrapper = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileWrapper = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  gap: 8px;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const MobileFilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .ant-select,
  .ant-picker { /* Ensure DatePicker also takes full width in mobile drawer */
    width: 100%;
  }
`;

const DrawerFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;
