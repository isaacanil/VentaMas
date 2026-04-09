import type { ModulePinDetail } from '@/firebase/authorization/pinAuth';

export type AuthorizationModuleValue = 'invoices' | 'accountsReceivable';

export interface AuthorizationModuleOption {
  value: AuthorizationModuleValue;
  label: string;
}

export interface PinUserRecord {
  id: string;
  name: string;
  displayName: string;
  role: string;
  email?: string | null;
  emailVerified?: boolean;
  hasPin: boolean;
  pinIsActive: boolean;
  pinIsExpired: boolean;
  pinExpiresAt?: Date | null;
  pinModules?: AuthorizationModuleValue[];
  moduleDetails?: Record<string, ModulePinDetail>;
  [key: string]: unknown;
}
