const DISMISS_KEY = 'claimOwnershipDismissed';

export type ClaimOwnershipState = {
  dismissed: boolean;
  submitting: boolean;
  claimUrl: string | null;
  claimCode: string | null;
  claimExpiresAt: number | null;
};

export type ClaimOwnershipAction =
  | { type: 'dismiss' }
  | { type: 'startSubmitting' }
  | { type: 'finishSubmitting' }
  | {
      type: 'setGeneratedClaim';
      claimUrl: string | null;
      claimCode: string | null;
      claimExpiresAt: number | null;
    };

export const createInitialClaimOwnershipState = (): ClaimOwnershipState => ({
  dismissed: getClaimOwnershipDismissed(),
  submitting: false,
  claimUrl: null,
  claimCode: null,
  claimExpiresAt: null,
});

export const getClaimOwnershipDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === '1';
};

export const setClaimOwnershipDismissed = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DISMISS_KEY, '1');
};

export const claimOwnershipReducer = (
  state: ClaimOwnershipState,
  action: ClaimOwnershipAction,
): ClaimOwnershipState => {
  switch (action.type) {
    case 'dismiss':
      return {
        ...state,
        dismissed: true,
      };
    case 'startSubmitting':
      return {
        ...state,
        submitting: true,
      };
    case 'finishSubmitting':
      return {
        ...state,
        submitting: false,
      };
    case 'setGeneratedClaim':
      return {
        ...state,
        claimUrl: action.claimUrl,
        claimCode: action.claimCode,
        claimExpiresAt: action.claimExpiresAt,
      };
    default:
      return state;
  }
};
