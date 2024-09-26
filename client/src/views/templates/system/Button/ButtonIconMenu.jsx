import React from 'react'
import styled from 'styled-components'

export const ButtonIconMenu = ({icon, onClick}) => {
    return (
        <Container onClick={onClick}>
            {icon}
        </Container>
    )
}
const Container = styled.button`
    border: none;
    color: white;
    width: 2em;
    height: 2em;
    padding: 0;
    display: grid;
    justify-items: center;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background-color: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    svg {
        font-size: 1.2em;
    }
`