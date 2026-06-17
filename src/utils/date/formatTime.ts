import { DateTime } from 'luxon';

export function getTimeElapsed(timestamp: number, friendlyLimit = 1440) {
  const now = DateTime.now();
  const diff = now.diff(DateTime.fromMillis(timestamp));
  const elapsedMinutes = Math.floor(diff.as('minutes'));

  if (elapsedMinutes < 1) {
    const elapsedSeconds = Math.floor(diff.as('seconds'));
    return `Hace ${elapsedSeconds} segundo${elapsedSeconds !== 1 ? 's' : ''}`;
  } else if (elapsedMinutes < friendlyLimit) {
    return `Hace ${elapsedMinutes} minuto${elapsedMinutes !== 1 ? 's' : ''}`;
  } else {
    const date = DateTime.fromMillis(timestamp);
    return date.toLocaleString(DateTime.DATETIME_SHORT);
  }
}

export const convertMillisToDate = (
  milliseconds: number | null | undefined,
) => {
  if (!milliseconds || typeof milliseconds !== 'number') return null;
  const dateFormatted =
    DateTime.fromMillis(milliseconds).toFormat('dd/MM/yyyy');
  return dateFormatted;
};
