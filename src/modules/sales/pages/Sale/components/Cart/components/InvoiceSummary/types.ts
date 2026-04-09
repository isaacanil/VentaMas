import type { ReactNode } from 'react';

import type { InvoiceProduct } from '@/types/invoice';

export type Authorizer = {
  displayName?: string;
  name?: string;
  username?: string;
  email?: string;
  uid?: string;
  role?: string;
};

export type DiscountAuthorizationContext = {
  authorizer?: Authorizer | null;
};

export type BillingSettings = {
  billingMode?: 'direct' | 'deferred' | string;
  quoteEnabled?: boolean;
  quoteValidity?: number | null;
  quoteDefaultNote?: string | null;
  invoiceType?: string | null;
};

export type CartSummary = {
  id?: string;
  client?: { id?: string; name?: string } | null;
  settings?: {
    billing?: BillingSettings | null;
    isInvoicePanelOpen?: boolean;
  } | null;
};

export type InsuranceValidationResult = {
  isValid: boolean;
  message: string | null;
  invalidProducts?: InvoiceProduct[];
};

export type MenuTheme = {
  background?: string;
  backgroundHover?: string;
  color?: string;
  colorHover?: string;
  iconColor?: string;
};

export type MenuOption = {
  text: string;
  action: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  theme?: MenuTheme;
};

export type PreorderConfirmationAction = 'complete' | 'update';

