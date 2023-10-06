import React, { useEffect, useRef, useState } from 'react';
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
import filterByDateRange from '../../../../utils/date/filterByDateRange';
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

export const AdvancedTable = ({
  groupBy,
  elementName,
  headerComponent,
  filterConfig = [],
  datesKeyConfig = "", //ubicacion de la fecha en el array data
  emptyText = 'No hay datos para mostrar',
  columns = [],
  data = [],
  filterUI,
  datesFilter,
  tableName,
  searchTerm = '',
  onRowClick,
  footerLeftSide,
  footerRightSide,
  numberOfElementsPerPage = 20
}) => {
  //Usuarios y referencias
  const user = useSelector(selectUser)
  const wrapperRef = useRef(null);

  const [dates, setDates] = useState({});

  //Reordenamiento de Columnas
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);
  const [columnOrder, setColumnOrder, resetColumnOrder] = useColumnOrder(columns, tableName, user.uid);

  //Funciones UI
  const toggleReorderMenu = () => { setIsReorderMenuOpen(!isReorderMenuOpen); };

  //Filtrado y configuración Dinámica
  const [filter, setFilter, setDefaultFilter, defaultFilter, filteredData] = useTableFiltering(filterConfig, data);

  const dynamicFilterConfig = useDynamicFilterConfig(filterConfig, data);

  //Filtrado por fechas
  const datesEmpty = dates?.startDate && dates?.endDate;
  const filteredDataByDateRange = datesFilter && datesEmpty ? filterByDateRange(filteredData, dates?.startDate, dates?.endDate, datesKeyConfig) : filteredData;

  // Filtrado de término de búsqueda
  const searchTermFilteredData = searchTerm ? filterData(filteredDataByDateRange, searchTerm) : filteredDataByDateRange;

  //Ordenación y agrupación
  const { handleSort, sortedData, sortConfig } = useTableSorting(searchTermFilteredData, columns)
  const { currentData, nextPage, prevPage, firstPage, lastPage, currentPage, pageCount } = useTablePagination(data, sortedData, searchTermFilteredData, numberOfElementsPerPage, wrapperRef);
  const shouldGroup = (sortConfig.direction === 'none' || sortConfig.key === null) && groupBy;
  const groupedData = shouldGroup ? groupDataByField(currentData, groupBy) : sortedData;

  //Paginación

  // Información adicional
  const totalElements = data?.length;
  const elementsShown = currentData?.length;

  return (
    <Container
      headerComponent={filterUI || headerComponent}
      datesFilter={datesFilter}>
      {(filterUI || datesFilter ?
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
              datesFilter &&
              <DatePicker
                dates={dates}
                setDates={setDates}
                datesDefault='empty'
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
        >
          <TableHeader
            columnOrder={columnOrder}
            handleSort={handleSort}
            sortConfig={sortConfig}
          />
          <TableBody
            columnOrder={columnOrder}
            currentData={currentData}
            emptyText={emptyText}
            groupedData={groupedData}
            onRowClick={onRowClick}
            shouldGroup={shouldGroup}
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
};
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
  grid-template-rows: 1fr;
  border-radius: 0.4em;
  overflow: hidden;
  ${props => {
    if (props?.headerComponent) {
      return `
      grid-template-rows: min-content 1fr;
      `
    }
    if (props?.datesFilter) {
      return `
      grid-template-rows: min-content 1fr;
      `
    }
  }}

`
const TableContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
 overflow: hidden;
  position: relative;
  width: 100%;
`;

const Wrapper = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-rows: min-content 1fr;
  overflow-y: scroll;
  overflow-x: auto;
  background-color: #ffffff;
`

export const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns.map(col => `minmax(${col.minWidth || 'auto'}, ${col.maxWidth || '1fr'})`).join(' ')};
  align-items: center;
  justify-content: space-between;
  gap: 0.6em;
`;



