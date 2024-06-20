import React from 'react'
import styled from 'styled-components';

export const Header = ({
    title
}) => {
    return (
        <Container> {title}</Container>
    )
}

const Container = styled.div`
    padding: 10px;
    border-bottom: 1px solid #ddd;
    font-size: 1.5em;
    text-align: center;
`;