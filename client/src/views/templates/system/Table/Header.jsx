import React from 'react'
import styled from 'styled-components'
import { Row } from './Row'


export const Header = ({ children, col, scrolled }) => {
    return (
        <Container scrolled={scrolled}>
            <Row element='header' col={col}>
                {children}
            </Row>
        </Container>
    )
}
const Container = styled.div`
    position: sticky;
    top: 0;
    height: 2.4em;
    display: flex;
    align-items: center;
    z-index: 1;
    background-color: var(--White);
    color: var(--Gray7);
    font-family: 'montserrat', sans-serif ;

                border-bottom: 1px solid var(--Gray-300);
                padding: 0em 1em;
                font-weight: 500;
    ${props => props.scrolled && `
        background-color: var(--White); 
        box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.249);
        `
    }
 `