import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";

export const convertMillisToDate = (millis) => {
  // Verifica si millis es una cadena y conviértelo si es necesario
  if (typeof millis === 'string') {
    millis = JSON.parse(millis);
  }
  
  // Asegúrate de que millis sea un objeto con las propiedades esperadas
  if (!millis || typeof millis.seconds !== 'number' || typeof millis.nanoseconds !== 'number') {
    throw new Error('El parámetro proporcionado no tiene el formato esperado.');
  }

  // Calcula los milisegundos totales
  const milliseconds = (millis.seconds * 1000) + (millis.nanoseconds / 1000000);

  // Convierte los milisegundos a fecha y formatea
  const date = DateTime.fromMillis(milliseconds).toFormat("dd/MM/yyyy");

  return date;
}

export const convertTimeStampToMillis = (timestamp) => {
  // if (timestamp) return null;
  // if (typeof timestamp === 'string') timestamp = JSON.parse(timestamp);
   const milliseconds = (timestamp?.seconds * 1000) + (timestamp?.nanoseconds / 1000000)
  return milliseconds
}


export const fromTimestampToMillis = (timestamp) => {
  if (!timestamp) return null;
  const milliseconds = DateTime.fromSeconds(timestamp.seconds).toMillis()
 
  return milliseconds
}
export const fromMillisToDateISO = (milliseconds, format) => {
  if (!milliseconds) return null;
  if (typeof milliseconds === 'string') milliseconds = JSON.parse(milliseconds);
  const date = DateTime.fromMillis(milliseconds).toISODate()
  if(format) return DateTime.fromMillis(milliseconds).toFormat(format)
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