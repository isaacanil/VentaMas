import { Timestamp } from "firebase/firestore";

/**
 * Sanitiza datos para Firebase eliminando propiedades vacías, undefined o inválidas
 * @param {Object} data - Objeto a sanitizar
 * @returns {Object} - Objeto sanitizado seguro para Firebase
 */
export const sanitizeFirebaseData = (data) => {
    // Mantener instancias especiales (Timestamp) sin modificaciones
    if (data instanceof Timestamp) {
        return data;
    }

    // Si no es un objeto o es null, devolverlo sin cambios
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        return data;
    }

    const result = {};

    // Recorrer todas las propiedades del objeto
    for (const key in data) {
        // Saltar propiedades heredadas
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

        // Ignorar campos vacíos o con valores inválidos para Firebase
        if (data[key] === undefined || data[key] === '' || key === '') continue;
        
        // Preservar Timestamps
        if (data[key] instanceof Timestamp) {
            result[key] = data[key];
            continue;
        }

        // Recursivamente sanitizar objetos anidados
        if (typeof data[key] === 'object' && data[key] !== null) {
            const sanitized = sanitizeFirebaseData(data[key]);
            
            // Solo incluir el objeto si tiene propiedades después de sanitizar
            if (Object.keys(sanitized).length > 0 || Array.isArray(data[key])) {
                result[key] = sanitized;
            }
        } else {
            // Añadir valores primitivos directamente
            result[key] = data[key];
        }
    }

    return result;
};
