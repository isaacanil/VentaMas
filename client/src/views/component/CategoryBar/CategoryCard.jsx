import React from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { deleteCategorySelected } from '../../../features/category/categorySlicer'
export const CategoryCard = ({name}) => {
    const dispatch = useDispatch()
    const fn = (name) => {
    dispatch(
        deleteCategorySelected(name)
    )
    }
    return (
        <Container >
            <p>
                {name}
            </p>
            <CloseCategorySelectedButton onClick={() => fn(name)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" />
                </svg>
            </CloseCategorySelectedButton>
        </Container>
    )
}
const Container = styled.li`

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
       

    
`
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