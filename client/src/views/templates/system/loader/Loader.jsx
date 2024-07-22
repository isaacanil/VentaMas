
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { selectLoaderMessage, selectLoaderShow } from '../../../../features/loader/loaderSlice';

const Loader = ({ useRedux = true, show: propsShow, message: propsMessage, theme = 'dark', minDisplayTime = 0 }) => {
  const reduxShow = useSelector(selectLoaderShow);
  const reduxMessage = useSelector(selectLoaderMessage);

  const externalShow = useRedux ? reduxShow : propsShow;
  const message = useRedux ? reduxMessage : propsMessage;

  const [internalShow, setInternalShow] = useState(false);

  useEffect(() => {
    let timer;
    if (externalShow) {
      setInternalShow(true);
    } else if (minDisplayTime > 0) {
      timer = setTimeout(() => {
        setInternalShow(false);
      }, minDisplayTime);
    } else {
      setInternalShow(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [externalShow, minDisplayTime]);

  if (!internalShow) return null;


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

const getThemeStyles = (theme) => {
  const themes = {
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.39)',
      spinnerBorder: '4px solid rgba(255, 255, 255, 0.3)',
      spinnerTopColor: '#fff',
      textColor: '#fff',
    },
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.719)',
      spinnerBorder: '4px solid rgba(0, 0, 0, 0.3)',
      spinnerTopColor: '#000',
      textColor: '#000',
    },
  };

  return themes[theme] || themes.dark;
};

const SpinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => getThemeStyles(theme).backgroundColor};
  z-index: 999;
`;
const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
`;
const Spinner = styled.div`
  border: ${({ theme }) => getThemeStyles(theme).spinnerBorder};
  border-top-color: ${({ theme }) => getThemeStyles(theme).spinnerTopColor};
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
  color: ${({ theme }) => getThemeStyles(theme).textColor};
`;