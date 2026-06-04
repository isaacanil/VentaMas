import styled from 'styled-components';

export const CategoryContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  padding: 10px;
  margin: 0 auto;
  background-color: var(--color2);
  border-radius: var(--border-radius);
`;

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
  width: 100%;
  padding: 10px 0 0;
  margin: 0 auto;
`;
