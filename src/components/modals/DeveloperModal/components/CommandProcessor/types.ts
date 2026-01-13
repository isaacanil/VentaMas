import type { UserIdentity } from '@/types/users';

export interface ExtendedUserIdentity extends UserIdentity {
  displayName?: string | null;
  email?: string | null;
}

export interface CommandProcessorInterface {
  dispatch: (action: any) => void;
  navigate: (path: string) => void;
  user: ExtendedUserIdentity | null;
  isTestMode: boolean;
  isTemporaryMode: boolean;
  originalBusinessId: string | null;
  isTemporaryRoleMode: boolean;
  originalRole: string | null;
  addOutput: (message: string, type?: 'info' | 'error' | 'warning' | 'success') => void;
  addCommandEcho: (command: string) => void;
  setReactScanLoaded: (loaded: boolean) => void;
  reactScanLoaded: boolean;
  setBusinesses: (businesses: any[]) => void;
  businesses: any[];
  enterSelectionMode: (
    items: any[],
    title: string,
    callback: (item: any) => void,
    command: string,
  ) => void;
  loadBusinessesList: () => Promise<any[]>;
  loadUsersList: () => Promise<any[]>;
  loadProductsForLookup: () => Promise<any[]>;
  findProductsByName: (searchTerm: string) => Promise<any[]>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
}
