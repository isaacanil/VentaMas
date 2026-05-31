import type { ReactNode } from 'react';

export type ModuleStatus = 'active' | 'inactive' | 'config-pending';

export interface ModuleCardSummaryItem {
  label: string;
  value: ReactNode;
}

export interface ModuleCardProps {
  checked: boolean;
  configureDisabled?: boolean;
  description: ReactNode;
  helperText?: ReactNode;
  icon: ReactNode;
  loading?: boolean;
  onConfigure?: () => void;
  onToggle: (checked: boolean) => void;
  status: ModuleStatus;
  summary: ModuleCardSummaryItem[];
  title: string;
}
