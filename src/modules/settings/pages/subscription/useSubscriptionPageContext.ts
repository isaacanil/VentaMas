import { useOutletContext } from 'react-router-dom';

import type { CartSettings } from '@/features/cart/types';

import type {
  ActionKey,
  LimitRow,
  PaymentRow,
  SubscriptionPlanOption,
  SubscriptionViewModel,
} from './subscription.types';

export interface SubscriptionPageContextValue {
  activeBusinessId: string | null;
  business: unknown;
  user: unknown;
  billingSettings: CartSettings['billing'];
  canManagePayments: boolean;
  loading: ActionKey;
  loadingAction: ActionKey;
  settingsSaving: boolean;
  subscription: SubscriptionViewModel;
  availablePlans: SubscriptionPlanOption[];
  providersImplemented: string[];
  limitRows: LimitRow[];
  paymentRows: PaymentRow[];
  handleLoadOverview: () => Promise<void>;
  handleOpenCheckout: (planCode?: string | null) => Promise<boolean>;
  handleOpenPortal: () => Promise<boolean>;
  handleUpdateBillingSettings: (
    setting: Partial<CartSettings['billing']>,
  ) => Promise<void>;
}

export const useSubscriptionPageContext = () =>
  useOutletContext<SubscriptionPageContextValue>();
