// Block.jsx
import React from 'react';
import styled from 'styled-components';
import Article from '../Article/Article';
import Section from '../Article/Section';

function Block({ type, content }) {
    switch (type) {
        case 'text':
            
            return <Section rawText={content}></Section>;
        case 'image':
            return <Img src={content} alt="Bloque Imagen" />;
        // ... otros casos/tipos de bloques
        default:
            return null;
    }
}

export default Block;

const Img = styled.img`
    width: 100%;
    height: auto;
`;