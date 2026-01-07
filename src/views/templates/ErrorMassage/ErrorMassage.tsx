import { Fragment } from 'react';
import styled from 'styled-components';

export const ErrorMessage = ({ text }) => {
  return (
    <Fragment>
      <Container>
        <label htmlFor="">{text}</label>
      </Container>
    </Fragment>
  );
};
const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 1em;

  label {
    width: 100%;
    min-width: 200px;
    max-width: 800px;
    padding: 0.4em 1em;
    font-weight: 700;
    color: white;
    text-align: center;
    letter-spacing: 0.8pt;
    background-color: rgb(227 81 81);
    border-radius: 100px;
  }
`;
