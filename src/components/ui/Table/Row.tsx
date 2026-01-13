import styled from 'styled-components';
import type { ReactNode } from 'react';

interface ColumnSize {
  min: string | number;
  max: string | number;
}

interface RowProps {
  children: ReactNode;
  col?: ColumnSize[];
  element?: string;
}

export const Row = ({ children, col, element }: RowProps) => {
  return (
    <Container col={col} element={element}>
      {children}
    </Container>
  );
};

const Container = styled.div<{ col?: ColumnSize[]; element?: string }>`
  display: grid;
  grid-template-columns: ${(props) => {
    if (props.col) {
      return props.col.map(({ min, max }) => `minmax(${min},${max})`);
    }
    return 'none';
  }};
  gap: 1em;
  width: 100%;
`;
