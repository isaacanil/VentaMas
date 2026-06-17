import styled from 'styled-components';

import { Showcase, type ShowcaseProps } from './ShowCase';

type ShowcaseItem = Pick<
  ShowcaseProps,
  'color' | 'description' | 'title' | 'value' | 'valueType'
>;

export type ShowcaseListProps = {
  showcases: ShowcaseItem[];
};

export const ShowcaseList = ({ showcases }: ShowcaseListProps) => {
  return (
    <Container>
      {showcases.map((showcase: ShowcaseItem) => (
        <Showcase
          key={showcase.title}
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
