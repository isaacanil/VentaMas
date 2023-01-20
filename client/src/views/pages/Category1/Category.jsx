import React, { Fragment } from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { Link } from 'react-router-dom'
import { Button } from '../../templates/system/Button/Button'
import { AddCategory } from './AddCategory'
import { getCat } from '../../../firebase/firebaseconfig'
import { useState } from 'react'
import { useEffect } from 'react'
export const Category = () => {
    const [categories, setCategories] = useState([])
    useEffect(() => {
        getCat(setCategories)
    }, [])
    console.log(categories)
    return (
        <Fragment>
            <MenuApp />
            <Container>
                <CategoryWrapper>
                    <Head>
                        <Group>
                            <h2>Categorías</h2>
                        </Group>
                        <Group>

                            <AddCategoryLink to={'/app/category/add'}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
                                <span>
                                    Nueva Categoría
                                </span>
                            </AddCategoryLink >
                        </Group>
                    </Head>
                    <Body>
                        <CategoryList>
                            <CategoryListHead>
                                <Row col='3'>
                                    <Col>Nombre</Col>
                                    <Col>Acción</Col>
                                </Row>
                            </CategoryListHead>

                            <CategoryListBody>
                                {categories.length > 0 ? (
                                    categories.map(({category}, index) => (

                                        <Row col='3' key={index}>
                                            <Col>
                                                {category.name}
                                            </Col>
                                            <Col>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.8 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" /></svg>
                                            </Col>
                                        </Row>
                                    ))
                                ) : null}
                            </CategoryListBody>
                        </CategoryList>
                        <AddCategory></AddCategory>
                    </Body>

                </CategoryWrapper>
            </Container>

        </Fragment>
    )
}
const Container = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`
const CategoryWrapper = styled.div`
width: 100%;
max-width: 900px;

`
const Head = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2em;
    height: 4em;
    h2{
        margin: 0;
    }
`
const Body = styled.div` 
    padding: 0.4em;
    display: grid;
    grid-template-columns: 1fr 0.5fr;
    width: 100%;
    gap: 1em;
    align-items: flex-start;
`
const CategoryList = styled.div`
    background-color: rgb(218,216,216);
    width: 100%;
    padding: 0.4em;
    border-radius: 10px;
    display: grid;
    gap: 0.4em;
`
const CategoryListHead = styled.div`
    display: grid;
    align-items: center;
    align-content: center;
    background-color: white;
    height: 3em;
    border-radius: 10px;
    font-weight: 600;
`
const CategoryListBody = styled.div`
    display: grid;
    align-items: flex-start;
    align-content: flex-start;
    gap: 0.2em;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.100);
    min-height: 300px;
    padding: 0.2em;
    `
const Row = styled.div`
    height: 3em;
    display: grid;
    grid-template-columns: 3fr 1fr;
    padding: 0 0.6em;
    background-color: rgb(230,230,230);
    border-radius: 10px;
    border: 1px;
    
    align-content: center;
    gap: 1em;
    
    ${(props) => {
        switch (props.col) {
            case '2':
                return `
                grid-template-columns:  repeat(2, 1fr);
                `


        }
    }}
  
   
    
    
`
const Col = styled.div`
    display: grid;
    align-items: center;
    &:nth-child(2){
        justify-items: right;
        justify-content: right;
    }
    svg{
        width: 1.2em;
    }
`
const AddCategoryLink = styled(Link)`
    display: flex;
    height: 1.8em;
    align-items: center;
    gap: 0.4em;
    color: #3d3d3d;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 100px;
    padding: 0 0.6em;
    svg{
        width: 1em;
        fill: #313131;
    }
    span{
        font-weight: 500;
    }


`
const Group = styled.div`
    
`