import styled from 'styled-components';
import type { ReactNode } from 'react';

interface RowProps {
  cols?: number | string;
  space?: boolean;
  children?: ReactNode;
}

export const Row = ({ cols, space, children }: RowProps) => {
  return (
    <Container cols={cols} space={space}>
      {children}
    </Container>
  );
};
// Object to handle padding styles
const paddingStyles = {
  true: 'padding: 0.4em 0;',
  false: '',
};

// Object to handle column styles
const columnStyles = {
  3: 'grid-template-columns: 1fr 0.8fr 0.8fr;',
  default: 'grid-template-columns: 1fr;',
};

const Container = styled.div<{ cols?: number | string; space?: boolean }>`
  align-items: center;
  display: grid;
  gap: 0.4em;
  ${({ space }: { space?: boolean }) =>
    space ? paddingStyles.true : paddingStyles.false}
  ${({ cols }: { cols?: number | string }) =>
    columnStyles[cols as keyof typeof columnStyles] || columnStyles.default}
`;
