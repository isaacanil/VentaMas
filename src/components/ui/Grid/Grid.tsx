import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';

const GridList = styled(m.ul)`
  position: relative;
  display: grid;
  padding: 0;
  gap: 0.7em;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));

  ${(props) => {
    switch (props.padding) {
      case 'bottom':
        return `
                    padding-bottom: 2.75em;
                `;
      default:
        return '';
    }
  }}

  ${(props) => {
    switch (props.isRow) {
      case true:
        return `
                    grid-template-columns: 1fr;
                    transition: all 400ms ease-in-out;
                `;
      default:
        return '';
    }
  }}
`;

export const Grid = (props: ComponentPropsWithoutRef<typeof GridList>) => (
  <LazyMotion features={domAnimation}>
    <GridList {...props} />
  </LazyMotion>
);
