import { Timestamp } from 'firebase/firestore';
import { DateTime } from 'luxon';

// utils/format.ts
export const formatDate = (
  value?: Timestamp | number | Date | null,
): string => {
  if (!value) return 'N/A';

  let millis: number;
  if (typeof value === 'number') {
    millis = value;
  } else if (value instanceof Date) {
    millis = value.getTime();
  } else if (value instanceof Timestamp) {
    millis = value.seconds * 1000;
  } else {
    return 'N/A';
  }

  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
};
