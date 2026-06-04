import styled from 'styled-components';

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0.5em;
  width: 100%;
  height: 100%;
`;

export const Body = styled.div`
  width: 100%;
  background-color: #fff;
  border-radius: var(--border-radius);
`;

export const Categories = styled.div`
  display: grid;
  gap: 1em;
  padding: 1em;
`;
