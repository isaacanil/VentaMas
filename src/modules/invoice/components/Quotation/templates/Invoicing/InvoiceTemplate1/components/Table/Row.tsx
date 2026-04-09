import type { ReactNode } from 'react';
import styled from 'styled-components';

type RowProps = {
  cols?: number | string;
  space?: boolean;
  children?: ReactNode;
};

export const Row = ({ cols, space, children }: RowProps) => {
  return (
    <Container cols={cols} space={space}>
      {children}
    </Container>
  );
};
// Object to handle padding styles
const paddingStyles: Record<'true' | 'false', string> = {
  true: 'padding: 0.4em 0;',
  false: '',
};

// Object to handle column styles
const columnStyles: Record<string, string> = {
  3: 'grid-template-columns: 1fr 0.8fr 0.8fr;',
  default: 'grid-template-columns: 1fr;',
};

type ContainerProps = Pick<RowProps, 'cols' | 'space'>;

const Container = styled.div<ContainerProps>`
  align-items: center;
  display: grid;
  gap: 0.4em;
  ${({ space }) => paddingStyles[String(space) as 'true' | 'false']}
  ${({ cols }) => columnStyles[String(cols ?? '')] || columnStyles.default}
`;
