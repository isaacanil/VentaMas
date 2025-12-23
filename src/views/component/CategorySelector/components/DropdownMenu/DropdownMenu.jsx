import { Input, Typography, Button } from 'antd';
import { forwardRef, useState } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { filterData } from '@/hooks/search/useSearch';

import { Category } from './Category';

const DropdownMenuComponent = forwardRef(
  ({ setOpen, sectionsConfig = {}, deleteAllItems }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filterItems = (items) => filterData(items, searchTerm);

    return (
      <Container ref={ref}>
        <Wrapper>
          <Header>
            <Input
              placeholder="Buscar Categoría"
              value={searchTerm}
              allowClear
              style={{ maxWidth: '300px' }}
              addonBefore={icons.operationModes.search}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              onClick={() => setOpen(false)}
              icon={icons.operationModes.cancel}
              type="text"
              size="small"
            ></Button>
          </Header>
          <Body>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4em',
              }}
            >
              <Button onClick={deleteAllItems}>Deselecionar todo</Button>
              <Typography.Text type="secondary">
                {Object.values(sectionsConfig).reduce(
                  (total, section) => total + section.items.length,
                  0,
                )}{' '}
                categorías
              </Typography.Text>
            </div>
            <CategoriesContainer>
              {Object.keys(sectionsConfig).map((sectionKey) => {
                const { title, items, onSelect, onToggleFavorite, color } =
                  sectionsConfig[sectionKey];

                const filteredItems = filterItems(items);

                return (
                  filteredItems.length > 0 && (
                    <Categories key={sectionKey}>
                      <Typography.Title level={5}>{title}</Typography.Title>
                      <CategoryList>
                        {filteredItems
                          .sort((a, b) => {
                            const nameA = a.name || ''; // Si 'name' es undefined, usa un string vacío para evitar el error
                            const nameB = b.name || '';
                            return nameA.localeCompare(nameB);
                          })
                          .map((item) => (
                            <Category
                              key={item.id}
                              item={item}
                              selected={item.selected}
                              isFavorite={item.isFavorite}
                              searchTerm={searchTerm}
                              color={color}
                              toggleFavorite={
                                onToggleFavorite
                                  ? () => onToggleFavorite(item)
                                  : undefined
                              }
                              onClick={() => onSelect(item)}
                            />
                          ))}
                      </CategoryList>
                    </Categories>
                  )
                );
              })}

              {/* Mensaje cuando no hay resultados */}
              {Object.keys(sectionsConfig).every(
                (sectionKey) =>
                  filterItems(sectionsConfig[sectionKey].items).length === 0,
              ) && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography.Text type="secondary" style={{ padding: '1em' }}>
                    No se encontraron resultados, intenta con otra búsqueda o
                    agrega una nueva categoría
                  </Typography.Text>
                </div>
              )}
            </CategoriesContainer>
          </Body>
        </Wrapper>
      </Container>
    );
  },
);

DropdownMenuComponent.displayName = 'DropdownMenu';
export const DropdownMenu = DropdownMenuComponent;

const Container = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  width: 100%;
  overflow: hidden;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgb(0 0 0 / 10%);
`;
const Wrapper = styled.div`
  top: 100%;
  left: 0;
  display: grid;
  grid-template-rows: min-content 1fr;
  height: calc(100vh - 9em);
`;
const CategoryList = styled.div`
  /* estilos para las categorías */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.4em;
`;
const CategoriesContainer = styled.div`

  /* estilos para el contenedor de las categorías */
  display: grid;
  gap: 2em;
  align-content: start;
  height: calc(100vh - 9em);
  padding: 0 0.4em;
  overflow-y: auto;
`;

const Categories = styled.div`
  /* estilos para las categorías */
  display: grid;
  gap: 0.4em;
  padding: 0 0.4em;
`;
const Body = styled.div`

  /* estilos para el cuerpo del menú desplegable */

  display: grid;
  gap: 0.6em;
  align-content: start;
  padding-bottom: 1em;
  overflow-y: auto;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  align-items: center;

  /* estilos para el header */
  padding: 0.4em;
  font-weight: bold;
  border-bottom: 1px solid #ccc;
`;
