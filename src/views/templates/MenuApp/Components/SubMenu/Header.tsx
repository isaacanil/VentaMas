// @ts-nocheck
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

export const Header = ({ item = { title: '' } }) => {
  return (
    <Container>
      <Button
        startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        title="atrás"
        variant="contained"
      />
      <Title>{item.title}</Title>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5em 0 1em;
  margin: 0 0 1em;

  button {
    justify-self: flex-start;
    color: rgb(66 165 245);
  }
`;
const Title = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  text-align: end;
`;
