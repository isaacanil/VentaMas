import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Timestamp } from 'firebase/firestore';
import { DateTime } from 'luxon';
import { toMillis } from './toMillis';

dayjs.extend(customParseFormat);

const DateUtils = {
    // Convert Day.js to Milliseconds
    convertDayjsToMillis: (dateObj) => dateObj ? dateObj.valueOf() : null,

    // Convert Day.js to Firestore Timestamp
    convertDayjsToTimestamp: (dateObj) => dateObj ? Timestamp.fromMillis(dateObj.valueOf()) : null,

    // Convert Milliseconds to Firestore Timestamp
    convertMillisToTimestamp: (millis) => millis ? Timestamp.fromMillis(millis) : null,

    // Convert Firestore Timestamp to Day.js
    convertTimestampToDayjs: (timestamp) => timestamp?.seconds ? dayjs(timestamp.seconds * 1000) : null,

    // Convert Milliseconds to Day.js
    convertMillisToDayjs: (input, dateFormat = "DD-MM-YYYY") => {
        if (typeof input === 'string' && /^\d+$/.test(input)) input = Number(input);
        if (typeof input === 'number') return dayjs(input);
        if (typeof input === 'string') {
            const parsedDate = dayjs(input, dateFormat);
            return parsedDate.isValid() ? parsedDate : null;
        }
        return null;
    },

    // Convert Milliseconds to ISO Date
    convertMillisToISODate: (milliseconds, format = 'dd/MM/yyyy') => {
        if (!milliseconds) return null;
        if (typeof milliseconds === 'object' && milliseconds.seconds !== undefined) {
            milliseconds = (milliseconds.seconds * 1000) + (milliseconds.nanoseconds / 1000000);
        } else if (typeof milliseconds === 'string') {
            milliseconds = JSON.parse(milliseconds);
        }
        const date = DateTime.fromMillis(milliseconds);
        return date.toFormat(format);
    },

    // Convert Firestore Timestamp to Milliseconds
    convertTimestampToMillis: (timestamp) => {
        if (!timestamp) return null;
        return (timestamp.seconds * 1000) + (timestamp.nanoseconds / 1000000);
    },

    // Convert Milliseconds to Luxon Date
    convertMillisToLuxonDate: (millis) => {
        if (!millis) return null;
        if (typeof millis === 'string') millis = JSON.parse(millis);
        return DateTime.fromMillis(millis);
    },

    // Convert Milliseconds to Luxon DateTime
    convertMillisToLuxonDateTime: (millis) => {
        if (!millis) return null;
        if (typeof millis === 'string') millis = JSON.parse(millis);
        return DateTime.fromMillis(millis);
    },

    // Convert Milliseconds to Friendly Date
    convertMillisToFriendlyDate: (millis) => {
        if (!millis) return new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        
        // Handle Firestore Timestamp objects
        if (typeof millis === 'object' && millis.seconds !== undefined) {
            millis = (millis.seconds * 1000) + (millis.nanoseconds / 1000000);
        } else if (typeof millis === 'string') {
            millis = JSON.parse(millis);
        }
        
        const date = DateTime.fromMillis(millis);
        return date.isValid ? date.toFormat("dd/MM/yyyy HH:mm") : "Invalid milliseconds";
    },

    // Format Luxon DateTime
    formatLuxonDateTime: (dateTime) => {
        if (!dateTime) return '';
        if (!(dateTime instanceof DateTime)) dateTime = DateUtils.convertMillisToLuxonDate(dateTime);
        return dateTime?.toFormat('dd/MM/yyyy HH:mm') || '';
    },

    // Format Luxon Date to Date Only
    formatLuxonDate: (dateTime) => {
        if (!dateTime) return '';
        const millis = toMillis(dateTime);
        if (!(dateTime instanceof DateTime)) dateTime = DateUtils.convertMillisToLuxonDate(millis);
        return dateTime?.toFormat('dd/MM/yyyy') || '';
    },

    // Convert JavaScript Date to Milliseconds
    convertDateToMillis: (jsDate) => jsDate instanceof Date ? jsDate.valueOf() : null,
};

export default DateUtils;
