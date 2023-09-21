import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";


export function convertDate(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.toMillis();
}
export function convertMillisToISO(millis) {
    const date = DateTime.fromMillis(millis);
    return date.toISODate();
}