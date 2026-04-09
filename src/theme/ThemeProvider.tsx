import type { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { selectThemeMode } from '@/features/theme/themeSlice';

import { lightTheme, darkTheme } from './ColorTheme'; // Asegúrate de poner el camino correcto

const ThemeColorProvider = ({ children }: PropsWithChildren) => {
  const theme = useSelector(selectThemeMode);
  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      {/* Aquí podrías también pasar toggleTheme a los hijos si necesitas un botón para cambiar el tema */}
      {children}
    </ThemeProvider>
  );
};

export default ThemeColorProvider;
