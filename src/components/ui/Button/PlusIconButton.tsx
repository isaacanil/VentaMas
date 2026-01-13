import { Fragment } from 'react';
import styled from 'styled-components';

export const PlusIconButton = ({ fn }) => {
  const run = () => {
    fn();
  };
  return (
    <Fragment>
      <Container onClick={run}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
        </svg>
      </Container>
    </Fragment>
  );
};

const Container = styled.div`
  display: grid;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: white;
  border: 1px solid rgb(0 0 0 / 30.7%);
  border-radius: 100px;

  svg {
    width: 1.5em;
    fill: rgb(31 31 31 / 72%);
  }
`;
