import React, { useState } from 'react'
import styled from 'styled-components'
import { Category } from './Category';
import * as antd from 'antd';
import { filterData } from '../../../../../hooks/search/useSearch';
import { icons } from '../../../../../constants/icons/icons';
import { useWindowWidth } from '../../../../../hooks/useWindowWidth';
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth';
const { Input, Typography, Button } = antd;

export const DropdownMenu = ({
    open,
    setOpen,
    categories = [],
    categoriesSelected = [],
    favoriteCategories = [],
    deleteAllCategoriesSelected = () => { },
    handleCategoryClick = () => { },
    addFavoriteCategory = () => { },
    deleteFavoriteCategory = () => { }
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [maxCategoriesToShow, setMaxCategoriesToShow] = useState(20);

    const adjustLists = () => {
        // Copia para evitar la mutación del estado original
        let adjustedFavoriteCategories = [...favoriteCategories];
        let adjustedNormalCategories = categories.filter(category =>
            !favoriteCategories.some(favoriteCategory => favoriteCategory.category.id === category.category.id)
        );

        // Si hay 20 o más favoritos, no mostramos las categorías normales
        if (adjustedFavoriteCategories.length >= maxCategoriesToShow) {
            adjustedNormalCategories = [];
        } else {
            // Asegurarnos de que el total no exceda 20 elementos
            adjustedNormalCategories = adjustedNormalCategories.slice(0, maxCategoriesToShow - adjustedFavoriteCategories.length);
        }
        return { adjustedFavoriteCategories, adjustedNormalCategories };
    };

    const { adjustedFavoriteCategories, adjustedNormalCategories } = adjustLists();

    //quiero quitar una propiedad que me createAt como seria?
    const favoriteCategoriesDelete = adjustedFavoriteCategories.map(({ category: { createdAt, ...restCategory }, ...rest }) => ({
        category: restCategory,
        ...rest
    }));
    const categoriesDelete = adjustedNormalCategories.map(({ category: { createdAt, ...restCategory }, ...rest }) => ({
        category: restCategory,
        ...rest
    }));

    const filteredFavoriteCategories = filterData(favoriteCategoriesDelete, searchTerm);
    const filteredNormalCategories = filterData(categoriesDelete, searchTerm);

    return (
        <Container>
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
                          <Button
                            onClick={deleteAllCategoriesSelected}
                          >
                            Deselecionar todo
                        </Button>
                        <Typography.Text type='secondary' style={{ padding: ' 0.2em 0.4em', }} >
                            {filteredFavoriteCategories.length + filteredNormalCategories.length} / {categories.length} categorías
                        </Typography.Text>
                    </div>
                    {filteredFavoriteCategories.length > 0 && (
                        <Categories>
                            <Typography.Title level={5}>
                                Favoritos
                            </Typography.Title>
                            <CategoryList>
                                {filteredFavoriteCategories
                                    .sort((a, b) => a.category.name.localeCompare(b.category.name))
                                    .map(({ category }) => (
                                        <Category
                                            searchTerm={searchTerm}
                                            key={category.id}
                                            category={category}
                                            selected={categoriesSelected.some(selectedCategory => selectedCategory.id === category.id)}
                                            isFavorite
                                            toggleFavoriteCategory={deleteFavoriteCategory}
                                            onClick={() => handleCategoryClick(category)}
                                        />
                                    ))}
                            </CategoryList>
                        </Categories>
                    )}
                    {filteredNormalCategories.length > 0 && (
                        <Categories>
                            <Typography.Title level={5}>
                                Categorías
                            </Typography.Title>
                            <CategoryList>
                                {filteredNormalCategories
                                    .sort((a, b) => a.category.name.localeCompare(b.category.name))
                                    .map(({ category }) => (
                                        <Category
                                        searchTerm={searchTerm}
                                            key={category.id}
                                            category={category}
                                            selected={categoriesSelected.some(selectedCategory => selectedCategory.id === category.id)}
                                            toggleFavoriteCategory={addFavoriteCategory}
                                            onClick={() => handleCategoryClick(category)}
                                        />
                                    ))}
                            </CategoryList>
                        </Categories>
                    )}
                    {
                        filteredFavoriteCategories.length === 0 && filteredNormalCategories.length === 0 &&
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography.Text type='secondary' style={{ padding: '1em' }}>
                                No se encontraron resultados, intenta con otra búsqueda o agrega una nueva categoría
                            </Typography.Text>
                        </div>
                    }
                </Body>
            </Wrapper>
        </Container>
    )
}

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