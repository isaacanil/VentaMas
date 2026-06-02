import type { HrEmployeeDocumentType } from '@/types/hrPayroll';

import type {
  HrEmployeeFormValues,
  HrLinkedUserOption,
} from './HrEmployeeEditorModal.types';

export const toFiniteNumber = (
  value: number | string | null | undefined,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getOptionLabel = <T extends string>(
  options: Record<T, string>,
  value?: T | null,
) => (value ? options[value] : undefined) ?? 'Seleccionar';

export const DOCUMENT_PLACEHOLDERS: Record<HrEmployeeDocumentType, string> = {
  cedula: '000-0000000-0',
  passport: 'Pasaporte',
  rnc: '000000000',
  other: 'Documento',
};

export const UNSPECIFIED_GENDER_KEY = 'unspecified';

export const applyLinkedUserDefaults = (
  current: HrEmployeeFormValues,
  linkedUser: HrLinkedUserOption | null,
): HrEmployeeFormValues => {
  if (!linkedUser) return { ...current, linkedUserId: null };
  return {
    ...current,
    linkedUserId: linkedUser.value,
    code: current.code || linkedUser.code,
    fullName: current.fullName || linkedUser.label,
    email: current.email || linkedUser.email,
    phone: current.phone || linkedUser.phone,
  };
};
