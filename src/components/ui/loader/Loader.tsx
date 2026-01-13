import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import {
  selectLoaderMessage,
  selectLoaderShow,
} from '@/features/loader/loaderSlice';
import type { LoaderProps } from '@/types/ui';
const Loader = ({
  useRedux = true,
  show: propsShow,
  message: propsMessage,
  theme = 'dark',
}: LoaderProps) => {
  const reduxShow = useSelector(selectLoaderShow);
  const reduxMessage = useSelector(selectLoaderMessage);

  const show = useRedux ? reduxShow : propsShow;
  const message = useRedux ? reduxMessage : propsMessage;

  if (!show) return null;

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

const Container = styled.div<{ show?: boolean; theme?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: ${(props) => getThemeStyles(props.theme).backgroundColor};
`;
const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
  align-items: center;
`;
const Spinner = styled.div<{ theme?: string }>`
  width: 44px;
  height: 44px;
  border: ${(props) => getThemeStyles(props.theme).spinnerBorder};
  border-top-color: ${(props) => getThemeStyles(props.theme).spinnerTopColor};
  border-radius: 50%;
  animation: ${SpinnerAnimation} 0.8s linear infinite;
`;

const Message = styled.p<{ theme?: string }>`
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: ${(props) => getThemeStyles(props.theme).textColor};
  text-align: center;
  letter-spacing: 0.5px;
`;
