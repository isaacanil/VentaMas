import { DateTime } from "luxon";

export const convertTimeStampToDate = (timestamp) => {
    if (typeof timestamp === 'string') timestamp = JSON.parse(timestamp);
    const milliseconds = (timestamp?.seconds * 1000) + (timestamp?.nanoseconds / 1000000)
    const date = DateTime.fromMillis(milliseconds)
    return date
  }