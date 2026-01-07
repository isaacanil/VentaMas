export type TimestampLike =
  | { toDate?: () => Date; toMillis?: () => number; seconds?: number; nanoseconds?: number }
  | Date
  | string
  | number
  | null
  | undefined;
