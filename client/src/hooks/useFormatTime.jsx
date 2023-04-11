import { DateTime } from 'luxon';

export function getTimeElapsed(timestamp) {
  const now = DateTime.now();
  const diff = now.diff(DateTime.fromMillis(timestamp));
  const elapsedSeconds = Math.floor(diff.as('seconds'));
  const elapsedMinutes = Math.floor(diff.as('minutes'));
  const elapsedHours = Math.floor(diff.as('hours'));
  
  if (elapsedSeconds < 60) {
    return `Hace ${elapsedSeconds} segundo${elapsedSeconds > 1 ? 's' : ''}`;
  } else if (elapsedMinutes < 60) {
    const minutes = elapsedMinutes === 1 ? 'minuto' : 'minutos';
    return `Hace ${elapsedMinutes} ${minutes}`;
  } else if (elapsedHours <= 2 && elapsedHours < 24) {
    const hours = elapsedHours === 1 ? 'hora' : 'horas';
    return `Hace ${elapsedHours} ${hours}`;
  } else {
    const date = DateTime.fromMillis(timestamp);
    return `${date.toLocaleString(DateTime.DATETIME_SHORT)}`;
  }
}
export function useFormatDate(timestamp) {
  const date = DateTime.fromMillis(timestamp);
  return `${date.toLocaleString(DateTime.DATETIME_SHORT)}`;
}
