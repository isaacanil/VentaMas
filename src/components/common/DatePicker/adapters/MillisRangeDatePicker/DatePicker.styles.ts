import type { CSSProperties } from 'react';

import styled from 'styled-components';

export const RANGE_PICKER_STYLE: CSSProperties = {
  width: '200px',
};

export const Container = styled.div`
  display: grid;
  grid-template-columns: max-content;
  gap: 0.4em;
  width: 100%;
`;

export const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  justify-content: end;
`;
