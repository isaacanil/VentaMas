interface FbSignInOptions {
  name: string;
  password: string;
}

export interface FbSignInUser {
  id: string;
  displayName?: string | null;
  realName?: string | null;
  name?: string | null;
  businessID?: string | null;
  role?: string | null;
  businessHasOwners?: boolean;
  [key: string]: any;
}

export interface FbSignInResult {
  user: FbSignInUser;
  session?: unknown;
  activeSessions?: unknown[];
  businessHasOwners?: boolean;
}

export declare const fbSignIn: (
  user: FbSignInOptions,
) => Promise<FbSignInResult>;
export declare const updateAppState: (
  dispatch: unknown,
  userData: FbSignInUser,
) => void;
