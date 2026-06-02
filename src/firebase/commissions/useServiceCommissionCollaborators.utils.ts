import type {
  ServiceCommissionCollaboratorRecord,
  ServiceCommissionType,
} from '@/types/commissions';
import {
  cleanCommissionString,
  normalizeCommissionCollaborator,
  toFiniteCommissionNumber,
} from '@/utils/commissions/serviceCommissions';

const normalizeServiceCommissionType = (
  value: unknown,
  fallback: ServiceCommissionType = 'percentage',
): ServiceCommissionType =>
  value === 'fixed' || value === 'percentage' ? value : fallback;

export const normalizeServiceCommissionCollaboratorRecord = (
  id: string,
  data: Record<string, unknown>,
): ServiceCommissionCollaboratorRecord => {
  const collaborator = normalizeCommissionCollaborator({ ...data, id });
  const code = collaborator.code ?? id;
  const name =
    collaborator.name ??
    cleanCommissionString(data.displayName) ??
    cleanCommissionString(data.email) ??
    code;
  const defaultRate =
    data.defaultRate == null
      ? null
      : Math.max(0, toFiniteCommissionNumber(data.defaultRate));

  return {
    ...data,
    id,
    businessId: cleanCommissionString(data.businessId) ?? '',
    code,
    name,
    documentType: collaborator.documentType,
    documentId: collaborator.documentId,
    linkedUserId: collaborator.linkedUserId,
    hrEmployeeId: collaborator.hrEmployeeId,
    partyId: collaborator.partyId,
    defaultType: normalizeServiceCommissionType(data.defaultType),
    defaultRate,
    active: data.active !== false,
    notes: cleanCommissionString(data.notes),
  };
};
