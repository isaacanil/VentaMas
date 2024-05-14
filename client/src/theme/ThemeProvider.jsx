import { useState, useEffect } from 'react';

import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './ColorTheme';  // Asegúrate de poner el camino correcto
import { selectThemeMode, setTheme } from '../features/theme/themeSlice';
import { useDispatch, useSelector } from 'react-redux';

const ThemeColorProvider = ({ children }) => {
    const theme = useSelector(selectThemeMode);
    console.log(lightTheme)
    return (
        <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
            {/* Aquí podrías también pasar toggleTheme a los hijos si necesitas un botón para cambiar el tema */}
            {children}
        </ThemeProvider>
    );
};

export default ThemeColorProvider;
