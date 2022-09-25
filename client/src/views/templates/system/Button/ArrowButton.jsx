import React from 'react'
import styled from 'styled-components'
export const ArrowRightButton = ({funct}) => {

    return (
        <Container onClick={funct}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L274.7 256 105.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" /></svg>

        </Container>
    )
}
export const ArrowLeftButton = ({funct}) => {
    return (
        <Container onClick={funct}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 278.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" /></svg>
        </Container>
    )
}

const Container = styled.div`
    width: 1.5em;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border: none;
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        margin-left: 2px;
    }
`