export function formatNumber(input) {
    const inputAsString = String(input);
    // Elimina los ceros a la izquierda solo si están antes del punto decimal y no son el único dígito antes del punto
    const formattedString = inputAsString.replace(/^(0+)(\d)/, '$2');
    const result = Number(formattedString);
    return isNaN(result) ? 0 : result;
}