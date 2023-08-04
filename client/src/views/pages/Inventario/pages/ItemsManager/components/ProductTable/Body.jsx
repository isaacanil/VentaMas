import React from 'react'
import styled from 'styled-components'

export const Body = ({ data, Item, colWidth, sort, reverse }) => {

    if (!Array.isArray(data)) {
        console.error("Data is not an array.");
        return null;
    }

    return (
        <Container>
            {data.map((item, index) => (
                <Item key={index} num={index} data={item} colWidth={colWidth} />
            ))}
        </Container>
    )
}

const Container = styled.div`
    height: 100%;
    width: 100%;
    background-color: #ffffff;

`