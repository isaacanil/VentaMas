export const getFontSize = ({ context, variant, size, generalSize, variantToSizeMap }) => {
    const fontSize = variantToSizeMap[context]?.[variant]?.[size] || generalSize[size];
    return fontSize;
};