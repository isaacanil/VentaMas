import type { HrEmployeeInput } from '@/types/hrPayroll';

export type HrEmployeeFormValues = HrEmployeeInput;

export interface HrLinkedUserOption {
  code?: string | null;
  email?: string | null;
  label: string;
  phone?: string | null;
  value: string;
}
