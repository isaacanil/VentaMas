import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { icons } from '../../../constants/icons/icons';
import { ColumnMenu } from './components/ColumnMenu/ColumnMenu';
import { Button } from '../../templates/system/Button/Button';
import { filterData } from '../../../hooks/search/useSearch';
import { CenteredText } from '../../templates/system/CentredText';
import useTableSorting from './hooks/useTableSorting';
import { useTablePagination } from './hooks/usePagination';
import { Pagination } from './components/Pagination/Pagination';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../features/auth/userSlice';
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
export const AdvancedTable = ({ headerComponent, columns, data, tableName, searchTerm, onRowClick }) => {
  const user = useSelector(selectUser)
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);
  
  let localStorageName = `tableColumnsOrder_${user.uid}_${tableName}`;

  const [columnOrder, setColumnOrder] = useState(() => {
    if (!tableName) return columns;
    const savedColumns = localStorage.getItem(localStorageName);
    if (savedColumns) {
      const parsedColumns = JSON.parse(savedColumns);
      return parsedColumns.map(savedCol => {
        const originalCol = columns.find(col => col.accessor === savedCol.accessor);
        return {
          ...savedCol,
          cell: originalCol.cell,
          sortable: originalCol.sortable,
          sortableValue: originalCol.sortableValue,

        };
      });
    } else {
      return columns || [];
    }
  });

  useEffect(() => {
    if (tableName) {
      localStorage.setItem(localStorageName, JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  const toggleReorderMenu = () => { setIsReorderMenuOpen(!isReorderMenuOpen); };

  const filteredData = searchTerm ? filterData(data, searchTerm) : data;

  const { handleSort, sortedData, sortConfig } = useTableSorting(filteredData, columns)
  const { currentData, nextPage, prevPage, firstPage, lastPage, currentPage, pageCount } = useTablePagination(data, sortedData, filteredData, 10);

  const totalElements = data.length;
  const elementsShown = currentData.length;

  const resetColumnOrder = () => {
    if (tableName) {
      const localStorageName = `tableColumnsOrder_${tableName}`;
      localStorage.removeItem(localStorageName);
    }
    setColumnOrder(columns); // Restablecer el orden de las columnas al estado predeterminado
  };
  return (
    <Container headerComponent={headerComponent}>
      {headerComponent && <div>{headerComponent}</div>}
      <TableContainer columns={columns}>
        <Wrapper>
          <Head columns={columnOrder}>
            <Row columns={columnOrder}>
              {columnOrder.map((col, index) => (
                <HeaderCell
                  key={index}
                  align={col.align}
                  onClick={() => handleSort(col.accessor, col.sortable)} // pasar col.sortable aquí
                >
                  {col.Header}
                  {/* {(col.sortable && sortConfig.direction !== 'asc' && sortConfig.direction !== 'desc') ? <span>{icons.mathOperations.subtract}</span> : ''}  */}

                  {sortConfig.key === col.accessor
                    ? (sortConfig.direction === 'asc'
                      ? <MotionIcon key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.arrows.caretUp}</MotionIcon>
                      : sortConfig.direction === 'desc'
                        ? <MotionIcon key="down" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.arrows.caretDown}</MotionIcon>
                        : <MotionIcon key="minus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.mathOperations.subtract}</MotionIcon>)
                    : col.sortable && <MotionIcon key="minus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>{icons.mathOperations.subtract}</MotionIcon>}

                </HeaderCell>
              ))}
            </Row>
          </Head>
          <Body columns={columnOrder}>
            {
              currentData.length > 0 ? (
                currentData.map((row, rowIndex) => (
                  <Row columns={columnOrder} onClick={onRowClick ? () => onRowClick(row) : null}> {/* Puedes reemplazar este div con un componente de fila estilizado si lo prefieres */}
                    {columnOrder.map((col, colIndex) => (
                      <BodyCell key={colIndex} align={col.align} columns={columnOrder}>
                        {col.cell ? col.cell({ value: row[col.accessor] }) : row[col.accessor]}
                      </BodyCell>
                    ))}
                  </Row>
                ))
              ) : <CenteredText text={'No se encontraron elementos'} />
            }
          </Body>
        </Wrapper>
        <Footer>
          <FooterLeftSide>
            {elementsShown} / {totalElements}
          </FooterLeftSide>
          <Pagination
            currentPage={currentPage}
            pageCount={pageCount}
            nextPage={nextPage}
            prevPage={prevPage}
            firstPage={firstPage}
            lastPage={lastPage}
          />
          <FooterRightSide>
            <Button startIcon={icons.operationModes.setting3} title={'columnas'} onClick={toggleReorderMenu} />
          </FooterRightSide>
        </Footer>
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

const Container = styled.div`
  border: 1px solid #ccc;
  height: 100%;
  display: grid;
  
  grid-template-rows: 1fr;
  border-radius: 0.4em;
  overflow: hidden;
  ${props => {
    if (props?.headerComponent) {
      return `
      grid-template-rows: min-content 1fr;
      `
    }
  }}

`
const TableContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
 overflow-y: hidden;
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

const HeaderCell = styled.div`
  font-weight: bold;
  padding: 0 10px;
  display: flex;
  gap: 0.6em;
  height: 2.75em;
  svg{
    display: flex;
    align-items: center;
    color: var(--color);
    font-size: 1.4em;
  }
  align-items: center;
  
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};
  ${props => {
    if (props?.columns?.minWidth) {
      return `
      min-width: ${props?.columns?.minWidth};
      `
    }
  }}
`;

const MotionIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  color: var(--color);
  font-size: 1.4em;
  min-width: 1em;
  display: flex;
  justify-items: center;
  justify-content: center;
  svg {
    color: inherit;
    font-size: inherit;
  }
`;

const BodyCell = styled.div`
 display: flex;
  align-items: center;
  padding: 0 10px;
  height: 100%;
  height: 3.4em;
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};
  ${props => {
    if (props?.columns?.minWidth) {
      return `
      min-width: ${props?.columns?.minWidth};
      `
    }
  }}
`;

const Head = styled.div`
    display: grid;  
    align-items: center;
    gap: 1em;
    color: var(--Gray7);
    font-size: 14px;
    border-bottom: var(--border-primary);
    border-top: var(--border-primary);
    font-weight: 500;
    background-color: white;
    position: sticky;
    top: 0;
    z-index: 2;
    `
const Body = styled.div`
   display: grid;
   align-content: flex-start;
   gap: 0.2em 1em;
  
`
const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns.map(col => `minmax(${col.minWidth || 'auto'}, ${col.maxWidth || '1fr'})`).join(' ')};
  align-items: center;
  justify-content: space-between;
  gap: 1em;
`;

const Footer = styled.div`
  
   padding: 0 1em;
  
    z-index: 2;
    grid-template-columns: 1fr 1fr 1fr;
    display: grid;
    align-items: center;
    background-color: white;
  height: 3em;
  border-top: var(--border-primary);
`;

const FooterLeftSide = styled.div``

const FooterRightSide = styled.div`
  justify-self: end;
`


