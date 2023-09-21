import { DateTime } from 'luxon';
import { truncateString } from '../utils/text/truncateString';

export function getTimeElapsed(timestamp) {
  const now = DateTime.now();
  const diff = now.diff(DateTime.fromMillis(timestamp));
  const elapsedSeconds = Math.floor(diff.as('seconds'));
  const elapsedMinutes = Math.floor(diff.as('minutes'));
  const elapsedHours = Math.floor(diff.as('hours'));
  
  if (elapsedSeconds < 60) {
    return truncateString(`Hace ${elapsedSeconds} segundo${elapsedSeconds > 1 ? 's' : ''}`, 12);
  } else if (elapsedMinutes < 60) {
    const minutes = elapsedMinutes === 1 ? 'minuto' : 'minutos';
    return truncateString(`Hace ${elapsedMinutes} ${minutes}`, 12);
  } else if (elapsedHours <= 2 && elapsedHours < 24) {
    const hours = elapsedHours === 1 ? 'hora' : 'horas';
    return truncateString(`Hace ${elapsedHours} ${hours}`, 12);
  } else {
    const date = DateTime.fromMillis(timestamp);
    return `${date.toLocaleString(DateTime.DATETIME_SHORT)}`;
  }
}
export function useFormatDate(timestamp) {
  const date = DateTime.fromMillis(timestamp);
  return `${date.toLocaleString(DateTime.DATETIME_SHORT)}`;
}


export const convertMillisToDate = (milliseconds, format = 'default', locale = 'es') => {
  //const date = DateTime.fromMillis(milliseconds).setLocale(locale);
  if (!milliseconds || !typeof milliseconds === 'number') return null;
  const dateFormatted = DateTime.fromMillis(milliseconds).toFormat('dd/MM/yyyy');
  return dateFormatted; 
  // Aquí puedes definir tus propios formatos personalizados
  // const formats = {
  //   default: DateTime.DATETIME_MED,
  //   short: DateTime.DATETIME_SHORT,
  //   full: DateTime.DATETIME_FULL,
  //   dateOnly: DateTime.DATE_MED,
  //   timeOnly: DateTime.TIME_MED,
  //   // ... otros formatos personalizados que desees
  // };

  // return date.toLocaleString(formats[format] || format);
};
