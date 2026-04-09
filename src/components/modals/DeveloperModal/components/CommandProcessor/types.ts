import type { UserIdentity } from '@/types/users';
import type { SelectionItem } from '../../types';

export interface ExtendedUserIdentity extends UserIdentity {
  displayName?: string | null;
  email?: string | null;
}

export interface DeveloperBusinessImpersonationStatus {
  ok?: boolean;
  active?: boolean;
  restored?: boolean;
  expired?: boolean;
  currentBusinessId?: string | null;
  originalBusinessId?: string | null;
  overrideBusinessId?: string | null;
  expiresAtMs?: number | null;
  ttlMinutes?: number | null;
  remainingMs?: number | null;
}

export interface CommandProcessorDeps {
  dispatch: (action: any) => void;
  navigate: (path: string) => void;
  user: ExtendedUserIdentity | null;
  isTestMode: boolean;
  isTemporaryMode: boolean;
  originalBusinessId: string | null;
  isTemporaryRoleMode: boolean;
  originalRole: string | null;
  addOutput: (
    message: string,
    type?: 'info' | 'error' | 'warning' | 'success',
  ) => void;
  addCommandEcho: (command: string) => void;
  setReactScanLoaded: (loaded: boolean) => void;
  reactScanLoaded: boolean;
  setBusinesses: (businesses: SelectionItem[]) => void;
  businesses: SelectionItem[];
  enterSelectionMode: (
    items: SelectionItem[],
    title: string,
    callback: (item: SelectionItem) => void,
    command: string,
  ) => void;
}

export interface CommandProcessorInterface extends CommandProcessorDeps {
  loadBusinessesList: () => Promise<any[]>;
  loadUsersList: () => Promise<any[]>;
  loadProductsForLookup: () => Promise<any[]>;
  findProductsByName: (searchTerm: string) => Promise<any[]>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  switchCurrentUserRole: (targetRole: string) => Promise<boolean>;
  startBusinessImpersonation: (params: {
    targetBusinessId: string;
    ttlMinutes?: number;
  }) => Promise<DeveloperBusinessImpersonationStatus>;
  stopBusinessImpersonation: () => Promise<DeveloperBusinessImpersonationStatus>;
  getBusinessImpersonationStatus: () => Promise<DeveloperBusinessImpersonationStatus>;
}
