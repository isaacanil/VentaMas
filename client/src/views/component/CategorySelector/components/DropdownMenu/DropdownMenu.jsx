import React, { forwardRef, useState } from 'react'
import styled from 'styled-components'
import { Category } from './Category';
import * as antd from 'antd';
import { filterData } from '../../../../../hooks/search/useSearch';
import { icons } from '../../../../../constants/icons/icons';
const { Input, Typography, Button } = antd;

export const DropdownMenu = forwardRef(({
    setOpen,
    sectionsConfig = {},
    deleteAllItems = () => { },

}, ref) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filterItems = (items) => filterData(items, searchTerm);

    return (
        <Container ref={ref}>
            <Wrapper>
                <Header>
                    <Input
                        placeholder='Buscar Categoría'
                        value={searchTerm}
                        allowClear
                        style={{ maxWidth: '300px' }}
                        addonBefore={icons.operationModes.search}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        onClick={() => setOpen(false)}
                        icon={icons.operationModes.cancel}
                        type='text'
                        size='small'
                    >
                    </Button>
                </Header>
                <Body>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.4em 0.4em '
                        }}
                    >
                        <Button onClick={deleteAllItems}>Deselecionar todo</Button>
                        <Typography.Text type='secondary'>
                            {Object.values(sectionsConfig).reduce((total, section) => total + section.items.length, 0)} categorías
                        </Typography.Text>
                    </div>
                    <CategoriesContainer>
                        {Object.keys(sectionsConfig).map((sectionKey) => {
                            const {
                                title,
                                items,
                                onSelect,
                                onToggleFavorite,
                                color
                            } = sectionsConfig[sectionKey];

                            const filteredItems = filterItems(items);

                            return filteredItems.length > 0 && (
                                <Categories key={sectionKey}>
                                    <Typography.Title level={5}>
                                        {title}
                                    </Typography.Title>
                                    <CategoryList>
                                        {filteredItems
                                            .sort((a, b) => {
                                                const nameA = a.name || '';  // Si 'name' es undefined, usa un string vacío para evitar el error
                                                const nameB = b.name || '';
                                                return nameA.localeCompare(nameB);
                                            })
                                            .map((item) => (
                                                <Category
                                                    key={item.id}
                                                    item={item}
                                                    selected={item.selected}
                                                    isFavorite={item.isFavorite}
                                                    color={color}
                                                    toggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
                                                    onClick={() => onSelect(item)}
                                                />
                                            ))}

                                    </CategoryList>
                                </Categories>
                            );
                        })}

                        {/* Mensaje cuando no hay resultados */}
                        {Object.keys(sectionsConfig).every((sectionKey) => filterItems(sectionsConfig[sectionKey].items).length === 0) && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Typography.Text type='secondary' style={{ padding: '1em' }}>
                                    No se encontraron resultados, intenta con otra búsqueda o agrega una nueva categoría
                                </Typography.Text>
                            </div>
                        )}
                    </CategoriesContainer>
                </Body>
            </Wrapper>
        </Container>
    )
})

const Container = styled.div`
 
    position: absolute;
    top: 100%;
    left: 0;
    border-radius: 10px;
    border: 1px solid #ccc;
    z-index: 1000;
    overflow: hidden;
    width: 100%;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    `;
const Wrapper = styled.div`
    display: grid;
    grid-template-rows: min-content 1fr;
    
    top: 100%;
    left: 0;
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
    padding: 0 0.4em;
    align-content: start;
    overflow-y: auto;
    height: calc(100vh - 9em);
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
    align-content: start;

    overflow-y: auto;
    gap: 0.6em;
    padding-bottom: 1em;
`;

const Header = styled.div`
    /* estilos para el header */
    padding: 0.4em ;
    display: grid;
    grid-template-columns: 1fr min-content;

    align-items: center;
    font-weight: bold;
    border-bottom: 1px solid #ccc;
`;