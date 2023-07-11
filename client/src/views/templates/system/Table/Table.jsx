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

const Container = styled.div`
    height: 100%;
    width: 100%;
    background-color: #ffffff;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
    
    `
const Backdrop = styled.div`
    border-radius: 8px;
    position: relative;
    background-color: #ffffff;
    
    max-width: 1300px;
    width: 100%;
    margin: 0.4em auto;
    overflow: hidden;

`

