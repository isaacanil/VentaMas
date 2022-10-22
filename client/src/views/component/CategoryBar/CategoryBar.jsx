import React, { useState, Fragment, useEffect } from 'react'
import styled from 'styled-components'
import { InputText } from '../../templates/system/Inputs/Input'
import { CloseButton } from '../../'
import { useDispatch } from 'react-redux'
import { openModalCategory } from '../../../features/modals/modalSlice'
import { useSelector } from 'react-redux'
import { SelectCategoryModal } from '../../../features/modals/modalSlice'
import { getCat } from '../../../firebase/firebaseconfig.js'
import { addCategory } from '../../../features/category/categorySlicer'
import { CategoryCard } from './CategoryCard'
import { SelectCategoryList, deleteAllCategoriesSelected } from '../../../features/category/categorySlicer'
export const CategoryBar = () => {
    const CategoryModalSelected = useSelector(SelectCategoryModal)
    const CategoryItemsSelected = useSelector(SelectCategoryList)
    CategoryItemsSelected.length > 0 ? console.log(CategoryItemsSelected) : null
    const [categories, setCategories] = useState('')


    const dispatch = useDispatch()
    useEffect(() => {
        getCat(setCategories)
    }, [])
    const handleOpenMenu = () => {
        dispatch(
            openModalCategory()
        )
    }
    const handleLocalSaveCategory = (category) => {
        dispatch(
            addCategory(category)
        )
    }
    return (
        <Fragment>
            <Button onClick={handleOpenMenu}>Categoría</Button>
            {
                CategoryModalSelected ? (
                    <CategoryContainer>
                        <FilterCategoryBar>
                            <Group>
                                <InputText placeholder='Buscar Categoria'></InputText>
                            </Group>
                            <CloseButton fn={handleOpenMenu}></CloseButton>
                        </FilterCategoryBar>
                        <CategoryListContainer>
                            <CategoryListHead>
                                <CategorysSelected>
                                    <h3>Categoría Seleccionados</h3>
                                    <button onClick={() => dispatch(deleteAllCategoriesSelected())}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z" /></svg>
                                        <span>
                                            Descartar
                                        </span>
                                    </button>
                                </CategorysSelected>
                                <CategorysSelectedList>
                                    {
                                        CategoryItemsSelected.length > 0 ? (
                                            CategoryItemsSelected.map((name, index) => (
                                                <CategoryCard name={name} key={index} fn={() => dispatch()} />
                                            ))
                                        ) : null
                                    }
                                </CategorysSelectedList>

                            </CategoryListHead>
                         
                            <CategoryListWrapper>
                                <h3>Lista de Categorías</h3>
                                <CategoryList>

                                    {
                                        categories.length > 0 ? (
                                            categories.map(({ category }, index) => (
                                                <li key={index} onClick={(e) => handleLocalSaveCategory(category)}>
                                                    {category.name}
                                                </li>
                                            ))
                                        ) : null
                                    }
                                </CategoryList>

                            </CategoryListWrapper>
                        </CategoryListContainer>
                    </CategoryContainer>
                ) : null
            }

        </Fragment>
    )
}
const Button = styled.button`
    height: 1.8em;
    border-radius: 50px;
    font-weight: 500;
    color: rgb(255, 255, 255);
    padding: 0 0.5em;
    border: 1px solid #00000033;
    background: rgb(66,165,245);
    display: flex;
    align-items: center;
    justify-content: center;
`
const Group = styled.div`
    display: flex;
    gap: 0.8em;
    align-items: center;

`
const CategoryContainer = styled.ul`
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(223, 223, 223, 0.274);
    backdrop-filter: blur(10px);
    padding: 0.4em;
    display: grid;
   
    grid-template-columns: 1fr;
    grid-template-rows: min-content ;
    gap: 0.5em;
   
    
`
const FilterCategoryBar = styled.div`
    background-color: #5a5a5a;
    border-radius: 100px;
    height: 2.5em;
    display: flex;
    align-items: center;
    padding: 0 0.4em;
    justify-content: space-between;
    
`
const CategoryListContainer = styled.div`
display: grid;
gap: 0.5em;
    
`
const CategoryListHead = styled.div`
    background-color: #94949486;
    border-radius: 15px;
    padding: 0 0.2em;
   
    h3{
        margin: 0.5em 0.2em;
        color: #3a3a3a;

    }
    button{
        display: flex;
        align-items: center;
        gap: 0.4em;
        border-radius: 50px;
        border: 1px solid rgba(0, 0, 0, 0.300);
        padding: 0.4em;
       
        height: 2em;
        svg{
            width: 1em;
        }
        span{
           
        }
    }
    
`
const CategorysSelected = styled.div`
     display: flex;
    justify-content: space-between;
    align-items: center;
`
const CategorysSelectedList = styled.div`
display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4em;
    padding: 1em 0;
    li{
        height: 2.2em;
        padding: 0 0.2em 0 1em;
        overflow: hidden;
        background-color: rgba(255, 255, 255, 0.767);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.050);
        color: #292929;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(5, 5, 5, 0.100);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
       

    }`
const CloseCategorySelectedButton = styled.div`
    height: 1.6em;
    width: 1.6em;
    background-color: #c53030;
    display: flex;
    border-radius: 50px;
    align-items: center;
    justify-content: center;
    svg{
        fill: white;
        width: 0.8em;
    }
`
const CategoryListWrapper = styled.div`
background-color: #94949486;
backdrop-filter: blur(2000px);
border-radius: 15px;
padding: 0.01em 0.2em;
h3{
    margin: 0.5em 0.2em;
    color: #3a3a3a;

}

`
const CategoryList = styled.ul`
    display: grid;
    gap: 0.5em;
    height: 400px;
    
    grid-template-columns: 1fr 1fr 1fr 1fr ;
    align-items: flex-start;
    align-content: flex-start;
    list-style: none;
    padding: 0;

    li{
        padding: 0.2em 1em;
        background-color: rgba(255, 255, 255, 0.767);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.050);
        color: #292929;
        text-align: center;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(5, 5, 5, 0.100);
        font-weight: 500;

    }
`