import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  height: calc(100vh - 2.75em);
`;

export const Wrapper = styled.div`
  width: 100%;
  max-width: 900px;
  padding: 1em;
  margin: 0 auto;
  overflow: auto;

  h1,
  h2 {
    margin-left: 0;
  }
`;
