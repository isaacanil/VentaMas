// BlockList.jsx
import React from 'react';
import Block from './Block';
import styled from 'styled-components';

function BlockList({ blocks }) {
    return (
        <Container>
            {blocks.map(block => (
                <Block key={block.id} type={block.type} content={block.content} />
            ))}
        </Container>
    );
}

export default BlockList;

const Container = styled.div`
    width: 100%;
    max-width: 600px;
    height: 100%;
    display: flex;
    flex-direction: column;
   
`;
