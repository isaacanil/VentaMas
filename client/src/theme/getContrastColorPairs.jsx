import { baseColors } from "./colors/light/baseColors";

export const getContrastColorPairs = (name = "primary", color, theme = "light") => {
    if (!color) { return }
    const { white } = baseColors;

    const variants = {
        [`${name}`]: {
            bg: color[600],
            text: white,
            hover: color[600],
            disabled: color[400]
        },
        [`on-${name}`]: {
            bg: white,
            text: color[500],
            hover: color[400],
            disabled: color[300]},
        [`${name}-contained`]: {
            bg: color[200],
            text: color[800],
            hover: color[300],
            disabled: color[100]
        },
        [`on-${name}-contained`]: {
            bg: color[800],
            text: color[200],
            hover: color[700],
            disabled: color[600]
        }
    };

    const variantsDark = {
        [`${name}`]: {
            bg: color[300],
            text: color[900],
            hover: color[400],
            disabled: color[200]
        },
        [`on-${name}`]: {
            bg: color[900],
            text: color[300],
            hover: color[800],
            disabled: color[700]
        },
        [`${name}-contained`]: {
            bg: color[800],
            text: color[200],
            hover: color[700],
            disabled: color[600]
        },
        [`on-${name}-contained`]: {
            bg: color[200],
            text: color[800],
            hover: color[300],
            disabled: color[100]
        }
    };

    return theme === "dark" ? variantsDark : variants;
}

