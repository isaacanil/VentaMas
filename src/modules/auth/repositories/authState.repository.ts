import {
  updateAppState,
  type FbSignInUser,
} from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';

type ApplyAuthenticatedUserStateOptions = {
  businessHasOwners?: boolean;
};

export const applyAuthenticatedUserState = (
  dispatch: unknown,
  user: FbSignInUser,
  options: ApplyAuthenticatedUserStateOptions = {},
) => {
  updateAppState(dispatch, {
    ...user,
    ...(typeof options.businessHasOwners === 'boolean'
      ? { businessHasOwners: options.businessHasOwners }
      : {}),
  });
};
