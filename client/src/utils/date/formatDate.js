import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";


export function convertDate(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.toMillis();
}

export function convertMillisToFriendly(millis) {
    // Si millis no está definido, retorna la fecha y hora actual
    if (!millis) {
        return new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    }

    // Intenta crear una fecha a partir de los milisegundos
    const date = DateTime.fromMillis(millis);

    // Verifica si la fecha es válida
    if (date.isValid) {
        // Retorna la fecha en el formato especificado si es válida
        return date.toFormat("dd/MM/yyyy HH:mm");
    } else {
        // Retorna un mensaje de error si los milisegundos no son válidos
        return "Invalid milliseconds";
    }
}

export function convertMillisToISO(millis) {
    const date = DateTime.fromMillis(millis);
    return date.toISODate();
}
class DateUtils {
    static convertDate(dateString) {
        const date = DateTime.fromISO(dateString);
        return date.toMillis();
    }
    static convertMillisToFriendly(timestamp) {

    }
    static convertMillisToISO(millis) {
        const date = DateTime.fromMillis(millis);
        return date.toISODate();
    }
}