import type { TimestampLike } from '@/utils/date/types';

export interface CategoryRecord extends Record<string, unknown> {
  id?: string;
  name?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  color?: string;
  type?: string;
}

export interface CategoryDocument {
  category: CategoryRecord;
}

export interface FavoriteCategoriesDocument {
  favoriteCategories?: string[];
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}
