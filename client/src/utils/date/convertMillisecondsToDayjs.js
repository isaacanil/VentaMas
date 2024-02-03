import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const dateFormat = 'DD/MM/YYYY';

/**
 * Convierte milisegundos a un objeto dayjs formateado.
 * @param {number} milliseconds - La fecha en milisegundos desde la época Unix.
 * @returns {dayjs.Dayjs} Objeto dayjs formateado.
 */
export const fromMillisToDayjs = (input) => {
    // Si el input es una cadena y representa un número, conviértelo a número
    if (typeof input === 'string' && !isNaN(input)) {
        input = Number(input);
    }

    // Si input es un número, asume que son milisegundos y crea un objeto dayjs
    if (typeof input === 'number') {
        return dayjs(input);
    }

    // Si es una cadena que no representa un número, intenta parsearla como fecha
    if (typeof input === 'string') {
        const parsedDate = dayjs(input, dateFormat);
        if (parsedDate.isValid()) {
            return parsedDate;
        }
    }

    // Si no es un número ni una cadena válida, retorna null o un valor por defecto
    return null;
};

