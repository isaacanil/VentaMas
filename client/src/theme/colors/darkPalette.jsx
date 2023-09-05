const darkPalette = {
    grey: {
        50: '#424242',
        100: '#616161',
        200: '#757575',
        300: '#9e9e9e',
        400: '#bdbdbd',
        500: '#e0e0e0',
        600: '#eeeeee',
        700: '#f5f5f5',
        800: '#fafafa',
        900: '#ffffff',
        A100: '#616161',
        A200: '#424242',
        A400: '#212121',
        A700: '#000000',
    },
    colors: {
        neutral: {
            light: '#616161',
            main: '#9e9e9e',
            dark: '#bdbdbd',
        },
        primary: {
            light: '#7986cb',
            main: '#3f51b5',
            dark: '#303f9f',
            contrastText: '#fff',
        },
        secondary: {
            light: '#ff4081',
            main: '#f50057',
            dark: '#c51162',
            contrastText: '#fff',
        },
        error: {
            light: '#e57373',
            main: '#f44336',
            dark: '#d32f2f',
            contrastText: '#fff',
        },
        warning: {
            light: 'rgba(255, 152, 0, 0.87)',
            main: 'rgba(255, 152, 0, 1)',
            dark: 'rgba(245, 124, 0, 1)',
            contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        info: {
            light: 'rgba(33, 150, 243, 0.7)',
            main: 'rgba(33, 150, 243, 1)',
            dark: 'rgba(25, 118, 210, 1)',
            contrastText: 'rgba(255, 255, 255, .87)',
        },
        success: {
            light: '#81c784',
            main: '#4caf50',
            dark: '#388e3c',
            contrastText: 'rgba(0,0,0,.87)'
        },
    },
    common: {
        black: '#fff',
        white: '#000',
    },

    text: {
        primary: 'rgba(255,255,255,.87)',
        secondary: 'rgba(255,255,255,.54)',
        disabled: 'rgba(255,255,255,.38)',
        hint: 'rgba(255,255,255,.38)'
    },
    divider: 'rgba(255,255,255,.12)',
    bg: {
        shade: 'rgb(20, 20, 20)',
        shade2: 'rgb(45, 45, 45)',
        shade3: 'rgb(55, 55, 55)',
        color: "#1b415f",
        color2: "#525252",
        color3: "#444444"
    },
    action: {
        active: 'rgba(255, 255, 255, 0.54)',
        hover: 'rgba(255, 255, 255, 0.04)',
        hoverOpacity: 0.04,
        selected: 'rgba(255, 255, 255, 0.08)',
        selectedOpacity: 0.08,
        disabled: 'rgba(255, 255, 255, 0.26)',
        disabledBackground: 'rgba(255, 255, 255, 0.12)',
        disabledOpacity: 0.38,
        focus: 'rgba(255, 255, 255, 0.12)',
        focusOpacity: 0.12,
        activatedOpacity: 0.12,
    },
}


export const { grey, common, colors, text, divider, background, action,  } = darkPalette;


export default darkPalette