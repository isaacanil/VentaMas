import React from 'react';
import styled from 'styled-components';

import { Showcase } from './ShowCase';

type ShowcaseValueType = 'none' | 'number' | 'percent' | 'price';

type ShowcaseItem = {
  title: string;
  value: number;
  valueType?: ShowcaseValueType;
  description?: string | null;
  color?: boolean | string;
};

type ShowcaseListProps = {
  showcases: ShowcaseItem[];
};

export const ShowcaseList = ({ showcases }: ShowcaseListProps) => {
  return (
    <Container>
      {showcases.map((showcase: ShowcaseItem, index: number) => (
        <Showcase
          key={index}
          title={showcase.title}
          valueType={showcase.valueType}
          value={showcase.value}
          description={showcase.description}
          color={showcase.color}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1em;
`;
