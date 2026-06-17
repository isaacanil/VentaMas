import type { ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

type LoaderTheme = 'dark' | 'light';

interface LoaderProps {
  show?: boolean;
  message?: ReactNode;
  theme?: LoaderTheme;
}

const Loader = ({
  show = false,
  message,
  theme = 'dark',
}: LoaderProps) => {
  const resolvedTheme: LoaderTheme = theme === 'light' ? 'light' : 'dark';

  if (!show) return null;

  return (
    <Container $loaderTheme={resolvedTheme}>
      <LoaderWrapper>
        <Spinner $loaderTheme={resolvedTheme} />
        {message && <Message $loaderTheme={resolvedTheme}>{message}</Message>}
      </LoaderWrapper>
    </Container>
  );
};

export default Loader;

const getThemeStyles = (theme?: LoaderTheme) => {
  const themes: Record<
    LoaderTheme,
    {
      backgroundColor: string;
      spinnerBorder: string;
      spinnerTopColor: string;
      textColor: string;
    }
  > = {
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

  return themes[theme || 'dark'] || themes.dark;
};

const SpinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div<{ $loaderTheme?: LoaderTheme }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: ${({ $loaderTheme }) =>
    getThemeStyles($loaderTheme).backgroundColor};
`;
const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
  align-items: center;
`;
const Spinner = styled.div<{ $loaderTheme?: LoaderTheme }>`
  width: 44px;
  height: 44px;
  border: ${({ $loaderTheme }) => getThemeStyles($loaderTheme).spinnerBorder};
  border-top-color: ${({ $loaderTheme }) =>
    getThemeStyles($loaderTheme).spinnerTopColor};
  border-radius: 50%;
  animation: ${SpinnerAnimation} 0.8s linear infinite;
`;

const Message = styled.p<{ $loaderTheme?: LoaderTheme }>`
  font-family: Poppins, sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: ${({ $loaderTheme }) => getThemeStyles($loaderTheme).textColor};
  text-align: center;
  letter-spacing: 0;
`;
