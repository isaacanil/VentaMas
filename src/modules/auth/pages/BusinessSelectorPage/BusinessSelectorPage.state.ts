import type { InviteFeedbackType } from './types';

export interface InviteFeedback {
  type: InviteFeedbackType;
  message: string;
}

export type BusinessSelectorUiState = {
  inviteCode: string;
  redeemingInvite: boolean;
  selectingBusinessId: string | null;
  inviteModalOpen: boolean;
  upgradeModalOpen: boolean;
  inviteFeedback: InviteFeedback | null;
};

export type BusinessSelectorUiAction =
  | { type: 'setInviteCode'; value: string }
  | { type: 'setRedeemingInvite'; value: boolean }
  | { type: 'setSelectingBusinessId'; value: string | null }
  | { type: 'setInviteModalOpen'; value: boolean }
  | { type: 'setUpgradeModalOpen'; value: boolean }
  | { type: 'setInviteFeedback'; value: InviteFeedback | null };

export const initialBusinessSelectorUiState: BusinessSelectorUiState = {
  inviteCode: '',
  redeemingInvite: false,
  selectingBusinessId: null,
  inviteModalOpen: false,
  upgradeModalOpen: false,
  inviteFeedback: null,
};

export const businessSelectorUiReducer = (
  state: BusinessSelectorUiState,
  action: BusinessSelectorUiAction,
): BusinessSelectorUiState => {
  switch (action.type) {
    case 'setInviteCode':
      return { ...state, inviteCode: action.value };
    case 'setRedeemingInvite':
      return { ...state, redeemingInvite: action.value };
    case 'setSelectingBusinessId':
      return { ...state, selectingBusinessId: action.value };
    case 'setInviteModalOpen':
      return { ...state, inviteModalOpen: action.value };
    case 'setUpgradeModalOpen':
      return { ...state, upgradeModalOpen: action.value };
    case 'setInviteFeedback':
      return { ...state, inviteFeedback: action.value };
    default:
      return state;
  }
};
