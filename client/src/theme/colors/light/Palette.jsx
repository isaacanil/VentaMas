
const grey = {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    A100: '#f5f5f5',
    A200: '#eeeeee',
    A400: '#bdbdbd',
    A700: '#616161',
}

// Paleta de colores para la aplicación
export const palette = {
    // Escala de grises utilizada en toda la aplicación
    grey,
    // Colores principales y secundarios, junto con sus variaciones
    colors: {
        neutral: {
            light: '#f5f5f5',
            main: '#9e9e9e',
            dark: '#616161',
            contrastText: '#fff',
        },
        primary: {
            light: '#7986cb',
            main: '#3f51b5',
            dark: '#303f9f',
            contrastText: '#fff',
        },
        secondary: {
            light: '#fd96ba',
            main: '#f50057',
            dark: '#c51162',
            contrastText: '#fff',
        },
        error: {
            light: '#FBE9E7',
            main: '#f44336',
            dark: '#d32f2f',
            contrastText: '#fff',
        },
        warning: {
            light: '#ffb74d',
            main: '#ff9800',
            dark: '#f57c00',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        info: {
            light: '#64b5f6',
            main: '#2196f3',
            dark: '#1976d2',
            contrastText: '#fff',
        },
        success: {
            light: '#81c784',
            main: '#4caf50',
            dark: '#388e3c',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        light: {
            light: '#ffffff',
            main: '#ffffff',
            dark: '#f2f2f2',
            contrastText: '#2c2c2c',
        }

    },
    common: {
        black: '#000',
        white: '#fff',
    },
    // Colores para texto en diferentes estados
    text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.54)',
        disabled: grey[500],
        hint: 'rgba(0, 0, 0, 0.38)',
    },
    // Color del divisor, utilizado para separar secciones de la interfaz
    divider: 'rgba(0, 0, 0, 0.12)',
    // Fondo de diferentes secciones de la UI
    bg: {
        shade: 'rgb(255, 255, 255)',
        shade2: 'rgb(245, 245, 245)',
        shade3: 'rgb(235, 235, 235)',
        color: "#42a5f5",
        color2: "#f2f7fa",
        color3: "#67B8DE",
    },
    borders: {
        basic: '1px solid #e2e8f0',
        highlighted: '2px solid #a0aec0',
        accent: '2px dashed #718096',
    },
    // Colores para diferentes acciones e interacciones
    action: {
        active: 'rgba(0, 0, 0, 0.54)',
        hover: 'rgba(0, 0, 0, 0.04)',
        hoverOpacity: 0.04,
        selected: 'rgba(0, 0, 0, 0.08)',
        selectedOpacity: 0.08,
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: 'rgba(0, 0, 0, 0.12)',
        disabledOpacity: 0.38,
        focus: 'rgba(0, 0, 0, 0.12)',
        focusOpacity: 0.12,
        activatedOpacity: 0.12,
    },
}

export const { action, background, colors, common, } = palette;

export default palette;


