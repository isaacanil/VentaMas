import type { ReactNode } from 'react';

export interface FeatureCardData {
  id?: number | string;
  title: string;
  icon: ReactNode;
  route?: string;
  action?: string;
  category: string;
  [key: string]: unknown;
}
