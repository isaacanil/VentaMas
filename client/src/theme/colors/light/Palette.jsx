import { getContrastColorPairs } from '../../getContrastColorPairs';
import { baseColors } from './baseColors';

// Paleta de colores para la aplicación
 export const palette = {
    
    // Colores principales y secundarios, junto con sus variaciones
    colors: {
        ...getContrastColorPairs("primary",  baseColors.blue),
        ...getContrastColorPairs("secondary", baseColors.orange),
        ...getContrastColorPairs("tertiary", baseColors.purple),
        ...getContrastColorPairs("error", baseColors.red),
        ...getContrastColorPairs("warning", baseColors.amber),
        ...getContrastColorPairs("info", baseColors.sky),
        ...getContrastColorPairs("success", baseColors.green),
        ...getContrastColorPairs("slate", baseColors.slate),
        ...getContrastColorPairs("gray", baseColors.gray),
    },
    // Colores para texto en diferentes estados
    text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.54)',
        disabled: 'rgba(0, 0, 0, 0.38)',
        hint: 'rgba(0, 0, 0, 0.38)',
    },
    // Color del divisor, utilizado para separar secciones de la interfaz
    divider: 'rgba(0, 0, 0, 0.12)',
    // Fondo de diferentes secciones de la UI
    bg: {
        shade: baseColors.white,
        shade2: baseColors.blue[100],
        shade3: baseColors.blue[200],
        color: "rgb(66, 165, 245)",
        color2: baseColors.blue[50],
        color3: "#67B8DE",
        color4: baseColors.blue[500],
    },
    border: {
        base: '1px solid #ced2d6',
        highlighted: '2px solid #a0aec0',
        accent: '2px dashed #718096',
    },

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

console.log("palette", palette);