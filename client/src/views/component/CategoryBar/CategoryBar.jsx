import React, {useState, Fragment} from 'react'
import styled from 'styled-components'
import { InputText } from '../../templates/system/Inputs/Input'
export const CategoryBar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const handleOpenMenu = () => {
        setIsOpen(!isOpen)
    }
    const categorys = [
        {
            id: 323422,
            name: 'Higiene'
        },
        {
            id: 777422,
            name: 'Bebidas'
        },
        {
            id: 893162,
            name: 'Hogar'
        },
        {
            id: 700352,
            name: 'Comestible',
            subCategory: [
                {
                    id: 435343,
                    name: 'pizza'
                },
                {
                    id: 800731,
                    name: 'Helado'
                }
            ]
        },
        {
            id: 323422,
            name: 'Higiene'
        },
        {
            id: 777422,
            name: 'Bebidas'
        },
        {
            id: 893162,
            name: 'Hogar'
        },
        {
            id: 700352,
            name: 'Comestible',
            subCategory: [
                {
                    id: 435343,
                    name: 'pizza'
                },
                {
                    id: 800731,
                    name: 'Helado'
                }
            ]
        }
    ]
    return (
        <Fragment>
            <Button onClick={handleOpenMenu}>Categoría</Button>
            {
                isOpen ? (
                    <CategoryContainer>
                        <FilterCategoryContainer>
                            <InputText placeholder='Buscar Categoria'></InputText>
                        </FilterCategoryContainer>
                        <CategoryList>

                        {categorys.map((cat, index) => (
                            <li key={index}>
                                {cat.name}
                            </li>
                        ))}
                        </CategoryList>
                    </CategoryContainer>
                ) : null
            }

        </Fragment>
    )
}
const Button = styled.button`
    height: 2em;
    border-radius: 50px;
    padding: 0 0.5em;
    border: 1px solid rgba(0, 0, 0, 0.200);
    display: flex;
    align-items: center;
    justify-content: center;
`
const CategoryContainer = styled.ul`
    position: absolute;
    z-index: 1;
    top: 3em;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgb(223, 223, 223);
    
    padding: 0.4em;
    display: grid;
   
    grid-template-columns: 1fr;
    grid-template-rows: min-content ;
    gap: 1em;
   
    
`
const FilterCategoryContainer = styled.div`
    background-color: #5a5a5a;
    border-radius: 100px;
    height: 2.5em;
    display: flex;
    align-items: center;
    padding: 0 0.4em;
    
`
const CategoryList = styled.ul`
    display: grid;
    gap: 1em;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 2em);
    list-style: none;
    padding: 0;
    li{
        padding: 0.2em 1em;
        background-color: #555555;
        color: #e0e0e0;
        text-align: center;
        border-radius: 50px;

    }
`