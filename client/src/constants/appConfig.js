import { OPERATION_MODES } from './modes';
const APP_CONFIG = {
    APP_MODE: {
        TEST_MODE: false
    },
    THEME_MODE: {
        DARK: 'dark',
        LIGHT: 'light'
    }
};

// Exportación de la configuración y los modos de operación.
export const CONFIG = Object.freeze({
    OPERATION_MODES,
    ...APP_CONFIG
});




