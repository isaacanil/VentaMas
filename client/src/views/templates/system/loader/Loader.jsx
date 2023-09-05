import { useSelect } from '@mui/base';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { selectLoaderMessage, selectLoaderShow } from '../../../../features/loader/loaderSlice';



const Loader = ({ useRedux = true, show: propsShow, message: propsMessage, theme = 'dark' }) => {
  const show = useRedux ? useSelector(selectLoaderShow) : propsShow;
  const message = useRedux ? useSelector(selectLoaderMessage) : propsMessage;

  return (
    <Container show={show} theme={theme}>
      <LoaderWrapper>
        <Spinner theme={theme} />
        {message && <Message theme={theme}>{message}</Message>}
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  justify-content: center;
  align-items: center;
  ${({ theme }) => {
    switch (theme) {
      case 'dark':
        return `
          background-color: rgba(0, 0, 0, 0.5);
        `
      case 'light':
        return `
          background-color: rgba(255, 255, 255, 0.719);
        `
      default:
        `
          background-color: rgba(0, 0, 0, 0.5);
        `
        break;
    }
  }}
 
  z-index: 999;
  opacity: ${({ show }) => (show ? 1 : 0)};
  pointer-events: ${({ show }) => (show ? 'all' : 'none')};
  transition: opacity 1000ms ease-in-out;
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
${({ theme }) => {
    switch (theme) {
      case 'light':
        return `
        border: 4px solid rgba(0, 0, 0, 0.3);
        border-top-color: #000;
      `
      case 'dark':
        return `
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
      `
      default:
        `
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
      `
        break;

    }
  }}

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
  ${({ theme }) => {
    switch (theme) {
      case 'light':
        return `
          color: #000;
        `
      case 'dark':
        return `
  color: #fff;
        `
      default:
        `
  color: #fff;
        `
        break;
    }
  }}
`;