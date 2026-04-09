import type { UserIdentity, UserRoleLike } from '@/types/users';

export type AbilityLike = {
  can: (action: string, subject: string) => boolean;
};

export type TimestampLike =
  | number
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number }
  | { toMillis: () => number }
  | null
  | undefined;

export type TimestampSeconds = { seconds: number; nanoseconds: number };
export type TimestampUnderscore = { _seconds: number; _nanoseconds: number };
export type TimestampWithToMillis = { toMillis: () => number };

export interface UserProfile extends UserIdentity {
  activeRole?: UserRoleLike;
  email?: string;
  username?: string;
  active?: boolean;
  isBusinessOwner?: boolean;
  createAt?: TimestampLike;
  activeBusinessId?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  number?: number;
}

export interface BusinessUserRecord {
  id?: string;
  number?: number;
  uid?: string;
  user?: UserProfile;
  [key: string]: unknown;
}

export interface PresenceConnection {
  state?: string;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface PresenceStatus {
  state: string;
  lastUpdated: number | null;
}

export type PresenceMap = Record<string, PresenceStatus>;

export interface UserListRow extends Record<string, unknown> {
  id: string;
  number?: number;
  name: {
    displayName: string;
    email: string;
  };
  createAt?: TimestampLike;
  role?: UserRoleLike;
  isBusinessOwner: boolean;
  status: {
    active: boolean;
    label: string;
  };
  presence: PresenceStatus;
  user?: UserProfile;
  searchText: string;
}

export interface UserFilters {
  role: string;
  status: string;
  presence: string;
}

export type UserListModalName = 'password' | 'status' | 'permissions';
