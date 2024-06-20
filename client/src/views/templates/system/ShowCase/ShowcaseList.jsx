import React from 'react';
import styled from 'styled-components';
import { Showcase } from './Showcase';


export const ShowcaseList = ({ showcases }) => {
    return (
        <Container>
            {showcases.map((showcase, index) => (
                <Showcase
                    key={index}
                    title={showcase.title}
                    valueType={showcase.valueType}
                    value={showcase.value}
                    color={showcase.color}
                />
            ))}
        </Container>
    );
};

const Container = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;