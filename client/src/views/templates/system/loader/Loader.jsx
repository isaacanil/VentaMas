import { useSelect } from '@mui/base';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { selectLoaderMessage, selectLoaderShow } from '../../../../features/loader/loaderSlice';



const Loader = () => {
  const show = useSelector(selectLoaderShow)
  const message = useSelector(selectLoaderMessage)
  return (
    <Container show={show}>
    <LoaderWrapper>
      <Spinner />
      {message && <Message>{message}</Message>}
    </LoaderWrapper>
    </Container>
  );
};

export default Loader;

const SpinnerAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;
const Container = styled.div`
position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  opacity: ${({ show }) => (show ? 1 : 0)};
  pointer-events: ${({ show }) => (show ? 'all' : 'none')};
  transition: opacity 0.3s ease-in-out;
`
const LoaderWrapper = styled.div`
  display: grid;
  justify-content: center;
  justify-items: center;
  align-content: center;
  align-items: center;
  gap: 1em;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  animation: ${SpinnerAnimation} 0.8s linear infinite;
`;

const Message = styled.p`
  font-size: 20px;
  font-family: 'Lato', sans-serif;
  text-align: center;
  letter-spacing: 0.5px;
  font-weight: bold;
  color: #fff;
`;