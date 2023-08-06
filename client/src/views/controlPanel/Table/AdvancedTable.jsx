import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { icons } from '../../../constants/icons/icons';
import { ColumnMenu } from './components/ColumnMenu/ColumnMenu';
import { Button } from '../../templates/system/Button/Button';
import { filterData } from '../../../hooks/search/useSearch';
import { CenteredText } from '../../templates/system/CentredText';

export const AdvancedTable = ({ headerComponent, columns, data, tableName, searchTerm }) => {

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);

  let localStorageName = `tableColumnsOrder_${tableName}`;

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

  const toggleReorderMenu = () => {
    setIsReorderMenuOpen(!isReorderMenuOpen);
  };
  // Filtrar los datos basándose en el término de búsqueda
  const filteredData = searchTerm ? filterData(data, searchTerm) : data;

  /**************** Ordenar informarmacion ************************************************ */
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === null || sortConfig.direction === 'none') return 0;

    const key = sortConfig.key;
    const column = columns.find(col => col.accessor === key);

    const aValue = column.sortableValue ? column.sortableValue(a[key]) : a[key];
    const bValue = column.sortableValue ? column.sortableValue(b[key]) : b[key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });


  const handleSort = (key, sortable) => {
    if (sortable) {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'none';
      }
      setSortConfig({ key, direction });
    }
  };
  /****************************************************** */
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10; // Puedes ajustar este número según lo que necesites
  useEffect(() => {
    setCurrentPage(0); // Reiniciar la página actual a 0 cuando los datos cambian
  }, [data]);
  // Cálculo de páginas
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);
  /****************************************************** */
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
    <Container>
      {headerComponent && <div>{headerComponent}</div>}
      <TableContainer columns={columns}>
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
                {sortConfig.key === col.accessor ? (sortConfig.direction === 'asc' ? icons.arrows.caretUp : sortConfig.direction === 'desc' ? icons.arrows.caretDown : icons.mathOperations.subtract) : col.sortable && icons.mathOperations.subtract}
              </HeaderCell>
            ))}
          </Row>
        </Head>
        <Body columns={columnOrder}>
          {
            currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <Row columns={columnOrder}> {/* Puedes reemplazar este div con un componente de fila estilizado si lo prefieres */}
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
        <Footer>
          <FooterLeftSide>
            {elementsShown} de {totalElements} elementos
          </FooterLeftSide>
          <PaginationContainer>
            <PageSwitch onClick={() => setCurrentPage(0)} disabled={currentPage === 0}>{icons.arrows.AnglesLeft}</PageSwitch>
            <PageSwitch
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              {icons.arrows.chevronLeft}
            </PageSwitch>
            <PageCount>
              {currentPage + 1} de {pageCount}
            </PageCount>
            <PageSwitch
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount - 1))}
              disabled={currentPage === pageCount - 1}
            >
              {icons.arrows.chevronRight}
            </PageSwitch>
            <PageSwitch onClick={() => setCurrentPage(pageCount - 1)} disabled={currentPage === pageCount - 1}>{icons.arrows.AnglesRight}</PageSwitch>
          </PaginationContainer>
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
  height:calc(100vh - 2.7em);
  display: grid;
  grid-template-rows: min-content 1fr;

`
const TableContainer = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  overflow-y: scroll;
  overflow-x: auto;
  position: relative;
  width: 100%;
`;
const PageCount = styled.div`
  width: 100px;
  display: flex;
  justify-content: center;
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

const EmptyMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2em;
  color: #888;
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
 // gap: 1em;
 
  /* Aquí puedes agregar más estilos si lo deseas */
`;
const Footer = styled.div`
   position: sticky;
   padding: 0 1em;
    bottom: 0;
    z-index: 2;
    grid-template-columns: 1fr 1fr 1fr;
    display: grid;
    align-items: center;
    
    background-color: white;
  height: 3em;
  
  
  border-top: var(--border-primary);
`;


const PaginationContainer = styled.div`
  display: flex;
  justify-self: center;
  justify-content: space-between;
  align-items: center;
 gap: 1em;
  height: 100%;
 
`;

const FooterLeftSide = styled.div``

const FooterRightSide = styled.div`
  justify-self: end;

`


const PageSwitch = styled.button`
 
  margin: 0 0.5em;
  cursor: pointer;
  height: 2em;
  width: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
  border: none;
`;