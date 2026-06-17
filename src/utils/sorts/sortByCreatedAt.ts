import type { TimestampLike } from '@/utils/date/types';
import { toMillis } from '@/utils/date/toMillis';

export type SortableByCreatedAt = {
  createdAt?: TimestampLike;
};

const toCreatedAtMillis = (value: SortableByCreatedAt['createdAt']): number =>
  toMillis(value) ?? 0;

export const compareByCreatedAt = <T extends SortableByCreatedAt>(
  a: T,
  b: T,
  isAscending: boolean,
): number => {
  const dateA = toCreatedAtMillis(a.createdAt);
  const dateB = toCreatedAtMillis(b.createdAt);

  return isAscending ? dateA - dateB : dateB - dateA;
};

export const sortByCreatedAt = <T extends SortableByCreatedAt>(
  items: readonly T[] | null | undefined,
  isAscending: boolean,
): readonly T[] | null | undefined => {
  if (!items?.length) return items;

  return [...items].sort((a, b) => compareByCreatedAt(a, b, isAscending));
};
