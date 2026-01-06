import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, List, Pagination } from 'antd';
import { useState, type ReactNode } from 'react';
import styled from 'styled-components';

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.4em;
  align-content: start;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5em;
  color: #333;
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
`;

const SectionFooter = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

interface SectionContainerProps<T> {
  title: string;
  items?: T[];
  onAdd?: () => void;
  renderItem: (item: T) => ReactNode;
}

export default function SectionContainer<T>({
  title,
  items = [],
  onAdd,
  renderItem,
}: SectionContainerProps<T>) {
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const pageSize = 5; // Número de elementos por página

  // Calcular el número de páginas totales
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Filtrar los elementos que se mostrarán en la página actual
  const paginatedItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Cambiar la página actual
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <AddButton
          type="primary"
          icon={<FontAwesomeIcon icon={faPlusCircle} />}
          onClick={onAdd}
        >
          Añadir
        </AddButton>
      </SectionHeader>
      <List dataSource={paginatedItems} renderItem={renderItem} />
      {totalPages > 1 && (
        <SectionFooter>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
          />
        </SectionFooter>
      )}
    </Container>
  );
}
