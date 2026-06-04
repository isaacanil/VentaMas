import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2em;
  padding: 0 1em;
  background-color: white;
  border-radius: 6px;

  input {
    outline: none;
    border: none;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.2em;
    height: 1.2em;
    padding: 0;
    cursor: pointer;
    background-color: var(--white-2, var(--white2));
    border: 0;
  }
`;
