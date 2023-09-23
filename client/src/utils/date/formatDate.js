import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";


export function convertDate(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.toMillis();
}
export  function convertMillisToFriendly(millis) {
    const date = DateTime.fromMillis(millis);
    return date.toFormat("dd/MM/yyyy HH:mm");
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