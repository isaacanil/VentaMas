import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { icons } from '../../../constants/icons/icons';
import { ColumnMenu } from './ColumnMenu';
import { Button } from '../../templates/system/Button/Button';



export const AdvancedTable = ({ headerComponent, columns, data }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isReorderMenuOpen, setIsReorderMenuOpen] = useState(false);
  const [columnOrder, setColumnOrder] = useState(columns);

  const toggleReorderMenu = () => {
    setIsReorderMenuOpen(!isReorderMenuOpen);
  };

  /**************** Ordenar informarmacion ************************************************ */
  const sortedData = [...data].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });



  const handleSort = (key, sortable) => {
    if (sortable) {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
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
  const pageCount = Math.ceil(data.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const currentData = sortedData.slice(start, end);
  /****************************************************** */
  return (
    <Container>
      {headerComponent}
      <TableContainer columns={columns}>
        <Head columns={columnOrder}>
          {columnOrder.map((col, index) => (
            <HeaderCell
              key={index}
              align={col.align}
              onClick={() => handleSort(col.accessor, col.sortable)} // pasar col.sortable aquí
            >
              {col.Header}
              {sortConfig.key === col.accessor ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </HeaderCell>
          ))}
        </Head>
        <Body columns={columnOrder}>
          {currentData.map((row, rowIndex) => (
            <Row columns={columnOrder}> {/* Puedes reemplazar este div con un componente de fila estilizado si lo prefieres */}
              {columnOrder.map((col, colIndex) => (
                <BodyCell key={colIndex} align={col.align}>
                  {col.cell ? col.cell({ value: row[col.accessor] }) : row[col.accessor]}
                </BodyCell>
              ))}
            </Row>
          ))}
        </Body>
        <Footer>
          <PaginationContainer>
            {/* <PageSwitch onClick={() => setCurrentPage(0)} disabled={currentPage === 0}>Inicio</PageSwitch> */}
            <PageSwitch
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              {icons.arrows.chevronLeft}
            </PageSwitch>
            <span>Página {currentPage + 1} de {pageCount}</span>
            <PageSwitch
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount - 1))}
              disabled={currentPage === pageCount - 1}
            >
              {icons.arrows.chevronRight}
            </PageSwitch>
            {/* <PageSwitch onClick={() => setCurrentPage(pageCount - 1)} disabled={currentPage === pageCount - 1}>Final</PageSwitch> */}
          </PaginationContainer>
          <Button title={'Reubicar columnas'} onClick={toggleReorderMenu} />
        </Footer>
        <ColumnMenu isOpen={isReorderMenuOpen} toggleOpen={toggleReorderMenu} columns={columns} columnOrder={columnOrder} setColumnOrder={setColumnOrder}></ColumnMenu>
      </TableContainer>
    </Container>
  )
};

const Container = styled.div`
  border: 1px solid #ccc;

`
const TableContainer = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  overflow-y: scroll;
  overflow-x: auto;
  position: relative;
  width: 100%;
  height:calc(100vh - 6em);
`;

const HeaderCell = styled.div`
  font-weight: bold;
  padding: 10px;
  
  text-align: ${props => props.align || 'left'};
`;

const BodyCell = styled.div`
 display: flex;
  align-items: center;
  padding: 0 10px;
  height: 100%;
  justify-content: ${props => props.align || 'flex-start'};
  text-align: ${props => props.align || 'left'};

`;
const Head = styled.div`
    display: grid;
    grid-template-columns: ${props => props.columns.map(col => `minmax(${col.minWidth || 'auto'}, ${col.maxWidth || '1fr'})`).join(' ')};
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
  gap: 1em;
  height: 3.4em;
  /* Aquí puedes agregar más estilos si lo deseas */
`;
const Footer = styled.div`
   position: sticky;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
  height: 3em;
  
  
  border-top: var(--border-primary);
`;
export const ImgContainer = styled.div`
    width: 100%;
    max-height: 2.75em;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    border-radius: var(--border-radius-light);
    
`
export const Img = styled.img`
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  ${props => {
    switch (props.noFound) {
      case true:
        return `
        object-fit: contain;`;
      default:
        return ``;
    }
  }}
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 400px;
  height: 100%;
 
`;

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