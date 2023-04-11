import React, { useRef } from 'react'
import { Header } from './Header'
import { Body } from './Body'
import { Footer } from './Footer'
import styled from 'styled-components'
import useScroll from '../../../../hooks/useScroll'


export const Table = ({
    header,
    footer,
    body,
    bodyMessage,
    col

}) => {
    const tableRef = useRef(null)
    const scrolled = useScroll(tableRef)
    return (
        <Backdrop>
            <Container ref={tableRef}>
                <Header
                    children={header}
                    col={col}
                    scrolled={scrolled}
                />
                <Body
                    children={body}
                    message={bodyMessage}
                />
                <Footer
                    children={footer}
                />
            </Container>
        </Backdrop>
    )
}




const Container = styled.div`
    height: 100%;
    width: 100%;
    // border: 1px solid rgba(14, 14, 14, 0.100);
    overflow-y: scroll;
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    
    `
const Backdrop = styled.div`
border-radius: 8px;
position: relative;
background-color: #fff;
height: calc(100vh - 2.75em - 2.75em - 3em);
max-width: 1000px;
  width: 100%;
  margin: 1em auto;
  overflow: hidden;

`

