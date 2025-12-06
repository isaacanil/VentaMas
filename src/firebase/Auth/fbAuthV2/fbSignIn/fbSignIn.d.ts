type FbSignInOptions = {
  name: string;
  password: string;
};

export type FbSignInUser = {
  id: string;
  displayName?: string | null;
  realName?: string | null;
  name?: string | null;
};

export type FbSignInResult = {
  user: FbSignInUser;
  session?: unknown;
  activeSessions: unknown[];
};

export declare const fbSignIn: (
  user: FbSignInOptions,
) => Promise<FbSignInResult>;
export declare const updateAppState: (
  dispatch: unknown,
  userData: FbSignInUser,
) => void;
