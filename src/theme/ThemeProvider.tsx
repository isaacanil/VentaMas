import type { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { selectThemeMode } from '@/features/theme/themeSlice';
import { shouldUseFirebaseEmulators } from '@/firebase/emulatorConfig';

import { lightTheme, darkTheme } from './ColorTheme'; // Asegúrate de poner el camino correcto

const ThemeColorProvider = ({ children }: PropsWithChildren) => {
  const mode = useSelector(selectThemeMode);
  const isEmulator = shouldUseFirebaseEmulators();

  const baseTheme = mode === 'light' ? lightTheme : darkTheme;

  // Si estamos en modo emulador, inyectamos el color naranja globalmente en el tema
  const theme = isEmulator
    ? {
        ...baseTheme,
        bg: {
          ...baseTheme.bg,
          color: '#d46b08', // Naranja fuerte para headers/branding
          color2: '#fff7ed', // Naranja muy claro para fondos de página (orange[50])
        },
        background: {
          ...baseTheme.background,
          color: '#d46b08',
          color2: '#fff7ed',
        },
      }
    : baseTheme;

  return (
    <ThemeProvider theme={theme}>
      {/* Aquí podrías también pasar toggleTheme a los hijos si necesitas un botón para cambiar el tema */}
      {children}
    </ThemeProvider>
  );
};

export default ThemeColorProvider;
