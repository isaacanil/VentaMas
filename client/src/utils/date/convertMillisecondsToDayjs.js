import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Convierte milisegundos a un objeto dayjs formateado.
 * @param {number} milliseconds - La fecha en milisegundos desde la época Unix.
 * @returns {dayjs.Dayjs} Objeto dayjs formateado.
 */

export const fromMillisToDayjs = (input, dateFormat = "DD-MM-YYYY") => {
    // Si el input es una cadena y representa un número entero, conviértelo a número
    if (typeof input === 'string' && /^\d+$/.test(input)) {
        input = Number(input);
    }

    // Si input es un número, asume que son milisegundos y crea un objeto dayjs
    if (typeof input === 'number') {
        return dayjs(input);
    }

    // Si es una cadena y se ha proporcionado un formato, intenta parsearla como fecha
    if (typeof input === 'string') {
        const parsedDate = dayjs(input, dateFormat);
        if (parsedDate.isValid()) {
            return parsedDate;
        }
    }

    // Si no es un número ni una cadena válida, retorna null
    return null;
};

