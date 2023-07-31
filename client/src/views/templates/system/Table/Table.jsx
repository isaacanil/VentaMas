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
    messageNoData,
    colWidth

}) => {
    const tableRef = useRef(null)
    const scrolled = useScroll(tableRef)
    return (
        <Backdrop>
            <Container ref={tableRef}>
                <Header
                    children={header}
                    colWidth={colWidth}
                    scrolled={scrolled}
                />
                <Body
                    children={body}
                    messageNoData={messageNoData}
                />
                <Footer
                    children={footer}
                />
            </Container>
        </Backdrop>
    )
}


const Backdrop = styled.div`
    position: relative;
    width: 100%;
    height: 100%;

    margin: 0 auto;
    padding: 0.4em 0.6em;
    overflow: hidden;
    
    
    `
const Container = styled.div`
    border-radius: 8px;
    overflow-x: auto;
    height: 100%;
    width: 100%;
    background-color: #ffffff;
    display: grid;
    grid-template-rows: auto 1fr auto;
  
    
    `

