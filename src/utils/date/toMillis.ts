import type { TimestampLike } from '@/utils/date/types';

export const toMillis = (d: TimestampLike): number | undefined => {
  if (d === null || d === undefined) return undefined;
  if (typeof d === 'number') return d;
  if (typeof d === 'string') {
    const int = parseInt(d.split('.')[0], 10);
    return Number.isNaN(int) ? new Date(d).getTime() : int;
  }
  if (typeof (d as { toDate?: () => Date }).toDate === 'function') {
    return (d as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof (d as { toMillis?: () => number }).toMillis === 'function') {
    return (d as { toMillis: () => number }).toMillis();
  }
  if (typeof (d as { valueOf?: () => number }).valueOf === 'function') {
    return (d as { valueOf: () => number }).valueOf();
  }
  if (typeof (d as { seconds?: number }).seconds === 'number') {
    const nanos = typeof (d as { nanoseconds?: number }).nanoseconds === 'number'
      ? (d as { nanoseconds?: number }).nanoseconds
      : 0;
    return (d as { seconds: number }).seconds * 1000 + (nanos as number) / 1e6;
  }
  return new Date(d as string | number | Date).getTime();
};
