export interface BusinessMetadata {
  name: string | null;
  subscriptionStatus: string | null;
  subscriptionPlanId: string | null;
  ownerUid: string | null;
}

export type SubscriptionTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

export type InviteFeedbackType = 'success' | 'error' | 'info';
