// @ts-nocheck
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type AuthorizationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'used'
  | 'completed';

export interface RequestedBy {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface TimestampLike {
  toMillis?: () => number;
  toDate?: () => Date;
  seconds?: number;
  [key: string]: unknown;
}

export interface AuthorizationRequest {
  id?: string;
  key?: string;
  module?: string;
  type?: string;
  collectionKey?: string;
  legacyCollectionKey?: string;
  referenceType?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  reference?: string;
  requestNote?: string;
  note?: string;
  notes?: string;
  reasons?: string[];
  status?: AuthorizationStatus;
  createdAt?: Date | string | number | TimestampLike | null;
  expiresAt?: Date | string | number | TimestampLike | null;
  requestedBy?: RequestedBy;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ModuleMeta {
  moduleKey: string;
  title: string;
  summary: string;
  referenceLabel: string;
  icon: IconDefinition;
}

export interface AuthorizationRequestListItem {
  key: string;
  raw: AuthorizationRequest;
  moduleMeta: ModuleMeta;
  reference: string;
  requestedByName: string;
  requestedByEmail: string;
  requestNote: string;
  createdStr: string;
  expiresStr: string;
  status: AuthorizationStatus;
}

export interface AppUser {
  uid: string;
  businessID?: string;
  displayName?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}
