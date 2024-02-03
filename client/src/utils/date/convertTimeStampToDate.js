import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";

export const convertTimeStampToDate = (timestamp) => {
  if (typeof timestamp === 'string') timestamp = JSON.parse(timestamp);
  const milliseconds = (timestamp?.seconds * 1000) + (timestamp?.nanoseconds / 1000000)
  const date = DateTime.fromMillis(milliseconds)
  return date
}

export const convertTimeStampToMillis = (timestamp) => {
  if (timestamp) return null;
  if (typeof timestamp === 'string') timestamp = JSON.parse(timestamp);
  const milliseconds = (timestamp?.seconds * 1000) + (timestamp?.nanoseconds / 1000000)
  return milliseconds
}


export const fromTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  const milliseconds = DateTime.fromSeconds(timestamp.seconds).toMillis()
 
  return milliseconds
}
export const fromMillisToDateISO = (milliseconds) => {
  if (!milliseconds) return null;
  const date = DateTime.fromMillis(milliseconds).toISODate()
  return date
}
export const fromMillisToTimestamp = (milliseconds) => {
  if (!milliseconds) return null;
  const timestamp = Timestamp.fromMillis(milliseconds)
  return timestamp
}

export const convertDate = {
  fromTimestampToMillis,
  fromMillisToDateISO,
  fromMillisToTimestamp
}