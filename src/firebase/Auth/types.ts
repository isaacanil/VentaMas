import type { Timestamp } from 'firebase/firestore';

import type { UserIdentity, UserRoleLike } from '@/types/users';

export interface AuthLoginInput {
  email: string;
  password: string;
}

export interface AuthSignUpInput {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  businessID: string;
  role?: UserRoleLike | string;
  [key: string]: unknown;
}

export interface AuthUserProfile extends UserIdentity {
  email?: string | null;
  password?: string | null;
  active?: boolean;
  number?: number | null;
  createAt?: Date | Timestamp | null;
}

export interface AuthUserDoc {
  user?: AuthUserProfile;
  [key: string]: unknown;
}

export interface AuthUserSummary {
  id: string;
  displayName?: string | null;
  realName?: string | null;
  name?: string | null;
  email?: string | null;
  role?: UserRoleLike | string | null;
  businessID?: string | null;
}
