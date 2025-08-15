import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ColumnMenu } from './components/ColumnMenu/ColumnMenu';
import { filterData } from '../../../../hooks/search/useSearch';
import useTableSorting from './hooks/useTableSorting';
import { useTablePagination } from './hooks/usePagination';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import useTableFiltering, { applyFilters, useDynamicFilterConfig } from './hooks/useTableFilter';
import { TableHeader } from './components/Table/TableHeader/TableHeader';
import { TableBody } from './components/Table/TableBody/TableBody';
import TableFooter from './components/Table/TableFooter/TableFooter';
import { useColumnOrder } from './hooks/useColumnOrder';
import { FilterUI } from './components/MenuFilter/MenuFilter';
import { DatePicker } from '../Dates/DatePicker/DatePicker';
import { useWindowWidth } from '../../../../hooks/useWindowWidth';
import { icons } from '../../../../constants/icons/icons';

/**
 * AdvancedTable es un componente de tabla personalizado que acepta los siguientes props:
 *
 * - data: Un array de objetos que representan los datos de la tabla.
 * - columns: Un array de objetos que representan las columnas de la tabla.
 * - searchTerm: Una cadena de texto utilizada para filtrar los datos de la tabla.
 * - headerComponent: Un componente React que se renderiza como el encabezado de la tabla.
 * - tableName: Una cadena de texto que se utiliza como el nombre de la tabla.
 * - onRowClick: Una función que se ejecuta cuando se hace clic en una fila de la tabla. Esta función recibe los datos de la fila en la que se hizo clic.
 */

const groupDataByField = (data, field) => {
  return data.reduce((acc, item) => {
    (acc[item[field]] = acc[item[field]] || []).push(item);
    return acc;
  }, {});
};

const useWideLayout = () => {
  const [isWide, setIsWide] = useState(window.innerWidth >= 1600);

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth >= 1600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isWide;
};

export const AdvancedTable = memo(({
  // Behaviour
  groupBy,
  numberOfElementsPerPage = 30,
  loading = false,

  // Custom UI hooks
  headerComponent,
  filterUI,
  datePicker = false,
  footerLeftSide,
  footerRightSide,

  // Data / config
  columns = [],
  data = [],
  filterConfig = [],
  searchTerm = '',
  elementName,
  tableName,

  // Date filter
  dateRange,
  defaultDate,
  setDateRange,

  //Misc
  emptyText = 'No hay datos para mostrar',
  onRowClick,
  title,

  // Expandable rows (optional)
  expandedRowRender, // function(row) => ReactNode
  rowExpandable,     // function(row) => boolean
  getRowId,          // function(row, index) => string | number
}) => {

  const wrapperRef = useRef(null);
  const user = useSelector(selectUser)

  // Build columns with optional expander
  const columnsWithExpander = useMemo(() => {
    if (!expandedRowRender) return columns;
    const expanderCol = {
      Header: '',
      accessor: '_expander',
      minWidth: '36px',
      maxWidth: '36px',
      keepWidth: true,
      fixed: 'left',
      sortable: false,
      clickable: false,
      cell: ({ value }) => {
        const isExpanded = !!value?.expanded;
        const toggle = value?.toggle;
        return (
          <ExpanderButton
            type="button"
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            onClick={(e) => { e.stopPropagation(); toggle && toggle(); }}
          >
            {isExpanded ? icons.arrows.caretDown : icons.arrows.caretRight}
          </ExpanderButton>
        );
      }
    };
    return [expanderCol, ...columns];
  }, [columns, expandedRowRender]);

  //Reordenamiento de Columnas
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);
  const [columnOrder, setColumnOrder, resetColumnOrder] = useColumnOrder(
    columnsWithExpander, 
    tableName, 
    user?.uid
  );

  //Funciones UI
  const toggleReorderMenu = () => { setIsReorderMenuOpen(!isReorderMenuOpen); };

  //Filtrado y configuración Dinámica
  const [filter, setFilter, setDefaultFilter, defaultFilter, filteredData] = useTableFiltering(filterConfig, data);

  const dynamicFilterConfig = useDynamicFilterConfig(filterConfig, data);

  // Filtrado de término de búsqueda
  const searchTermFilteredData = searchTerm ? filterData(filteredData, searchTerm) : filteredData;

  //Ordenación y agrupación
  const { handleSort, sortedData, sortConfig } = useTableSorting(searchTermFilteredData, columnsWithExpander)
  const { currentData, nextPage, prevPage, firstPage, lastPage, currentPage, pageCount } = useTablePagination(data, sortedData, searchTermFilteredData, numberOfElementsPerPage, wrapperRef);
  const shouldGroup = (sortConfig.direction === 'none' || sortConfig.key === null) && groupBy;
  const groupedData = shouldGroup ? groupDataByField(currentData, groupBy) : sortedData;

  //Paginación

  // Información adicional
  const totalElements = data?.length;
  const elementsShown = currentData?.length;

  const isWideScreen = useWindowWidth(1366);
  const isWideLayout = useWideLayout();

  return (
    <Container
      headerComponent={filterUI || headerComponent}
      datesFilter={setDateRange}
      title={title}
    >
      {title && <TableTitle>{title}</TableTitle>}
      {(filterUI || dateRange ?
        (
          <FilterBar>
            {
              filterUI &&
              <FilterUI
                setFilter={setFilter}
                filterConfig={dynamicFilterConfig}
                filter={filter}
                defaultFilter={defaultFilter}
                setDefaultFilter={setDefaultFilter}
              />
            }
            {
              datePicker &&
              <DatePicker
                dates={dateRange}
                setDates={setDateRange}
                datesDefault={defaultDate}
              />
            }
          </FilterBar>
        ) : (
          headerComponent && <div>{headerComponent}</div>
        )
      )}
      <TableContainer columns={columns}>
        <Wrapper
          ref={wrapperRef}
          isWideScreen={isWideScreen}
        >
          <TableHeader
            columnOrder={columnOrder}
            handleSort={handleSort}
            sortConfig={sortConfig}
            isWideScreen={isWideScreen}
            isWideLayout={isWideLayout}
          />
          <TableBody
            columnOrder={columnOrder}
            currentData={currentData}
            emptyText={emptyText}
            groupedData={groupedData}
            onRowClick={onRowClick}
            shouldGroup={shouldGroup}
            loading={loading}
            isWideScreen={isWideScreen}
            isWideLayout={isWideLayout}
            expandedRowRender={expandedRowRender}
            rowExpandable={rowExpandable}
            getRowId={getRowId}
          />
        </Wrapper>
        <TableFooter
          currentPage={currentPage}
          elementName={elementName}
          elementsShown={elementsShown}
          firstPage={firstPage}
          footerLeftSide={footerLeftSide}
          footerRightSide={footerRightSide}
          lastPage={lastPage}
          nextPage={nextPage}
          pageCount={pageCount}
          prevPage={prevPage}
          toggleReorderMenu={toggleReorderMenu}
          totalElements={totalElements}
        />
        <ColumnMenu
          resetColumnOrder={resetColumnOrder}
          isOpen={isReorderMenuOpen}
          toggleOpen={toggleReorderMenu}
          columns={columns}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
        />
      </TableContainer>
    </Container>
  )
});
const FilterBar = styled.div`
display: flex;
align-items: center;
padding: 0.2em 0.4em;
`

const Container = styled.div`
  border: var(--border-primary);
  height: 100%;
  display: grid;
  background-color: ${props => props.theme.bg.shade};
  border-radius: 0.4em;
  overflow: hidden;
  
  /* Auto-fit grid template rows based on content presence */
  grid-template-rows: ${props => {
    const rows = [];

    // Add title row if present
    if (props.title) rows.push('min-content');

    // Add header row if present
    if (props.headerComponent || props.datesFilter) rows.push('min-content');

    // Always add main content
    rows.push('1fr');

    return rows.join(' ');
  }};
`;

const TableTitle = styled.div`
  padding: 0.8em 1em;
  font-size: 1.1em;
  height: min-content;
  font-weight: 600;
  background-color: ${props => props.theme.bg.primary};
  border-bottom: var(--border-primary);
`;

const TableContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
  overflow: hidden;
  position: relative;
  width: 100%;
  isolation: isolate; // Para manejar el z-index de las columnas fijas
`;

const Wrapper = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-rows: min-content 1fr;
  overflow-y: scroll;
  overflow-x: auto;
  background-color: #ffffff;
  position: relative;

  /* Mejora el comportamiento del scroll horizontal */
  &::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
`;

export const ExpanderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--Gray7);
  &:hover { color: var(--Gray9); }
`;

export const ExpandedRow = styled.div`
  grid-column: 1 / -1;
  padding: 8px 12px;
  background: #fafafa;
  border-left: 2px solid var(--Gray3);
  border-right: 2px solid var(--Gray3);
  border-bottom: 1px dashed var(--Gray3);
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => {
    if (props.isWideLayout) {
      return props.columns.map(col => {
        // Mantener tamaño original si keepWidth es true
        if (col.keepWidth) {
          return `minmax(${col.minWidth || '100px'}, ${col.maxWidth || '1fr'})`;
        }
        return '1fr';
      }).join(' ');
    }
    // Comportamiento original para pantallas más pequeñas
    return props.columns.map(col =>
      `minmax(${col.minWidth || '100px'}, ${col.maxWidth || '1fr'})`
    ).join(' ');
  }};
  align-items: center;
  gap: 0.6em;
  position: relative;
  min-width: fit-content;
  width: 100%;
`;



