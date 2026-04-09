import React from 'react';
import styled from 'styled-components';

type RowProps = {
  cols?: number | string;
  space?: boolean;
  children: React.ReactNode;
};

const columnStyles: Record<string, string> = {
  '3': 'grid-template-columns: 1fr 0.8fr 0.8fr;',
  default: 'grid-template-columns: 1fr;',
};

const resolveColumns = (cols?: string) =>
  columnStyles[cols ?? 'default'] ?? columnStyles.default;

const resolvePadding = (space?: boolean) => (space ? 'padding: 0.4em 0;' : '');

export const Row = ({ cols, space = false, children }: RowProps) => {
  const normalizedCols = typeof cols === 'number' ? String(cols) : cols;
  return (
    <Container $cols={normalizedCols} $space={space}>
      {children}
    </Container>
  );
};

const Container = styled.div<{ $cols?: string; $space: boolean }>`
  display: grid;
  align-items: center;
  gap: 0.4em;
  ${({ $space }) => resolvePadding($space)}
  ${({ $cols }) => resolveColumns($cols)}
`;
