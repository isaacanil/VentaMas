export type ServiceCommissionType = 'percentage' | 'fixed';

export type ServiceCommissionSource =
  | 'service'
  | 'collaborator'
  | 'business-default'
  | 'manual';

export type ServiceCommissionCalculationBase = 'netSubtotalWithoutTax';

export type ServiceCommissionCollaboratorDocumentType =
  | 'cedula'
  | 'passport'
  | 'rnc'
  | 'other';

export interface ServiceCommissionCollaboratorSnapshot {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  documentType?: ServiceCommissionCollaboratorDocumentType | null;
  documentId?: string | null;
  hrEmployeeId?: string | null;
  partyId?: string | null;
  linkedUserId?: string | null;
  defaultType?: ServiceCommissionType | null;
  defaultRate?: number | null;
  active?: boolean;
}

export interface ServiceCommissionCollaboratorRecord extends ServiceCommissionCollaboratorSnapshot {
  id: string;
  businessId: string;
  code: string;
  name: string;
  linkedUserId?: string | null;
  notes?: string | null;
  createdAt?: unknown;
  createdBy?: string | null;
  updatedAt?: unknown;
  updatedBy?: string | null;
}

export interface ServiceCommissionLineSnapshot {
  collaborator?: ServiceCommissionCollaboratorSnapshot | null;
  collaboratorId?: string | null;
  collaboratorCode?: string | null;
  collaboratorName?: string | null;
  hrEmployeeId?: string | null;
  partyId?: string | null;
  type?: ServiceCommissionType;
  rateValue?: number | null;
  source?: ServiceCommissionSource;
  calculationBase?: ServiceCommissionCalculationBase;
  estimatedBaseAmount?: number | null;
  estimatedCommissionAmount?: number | null;
}

export interface ServiceCommissionsBillingSettings {
  enabled?: boolean;
  appliesTo?: 'services';
  calculationBase?: ServiceCommissionCalculationBase;
  defaultType?: ServiceCommissionType;
  defaultRate?: number;
  requireCollaboratorOnService?: boolean;
  showOnPrintedInvoice?: boolean;
}

export interface ServiceCommissionRecord {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber?: string | number | null;
  date: unknown;
  lineId: string;
  serviceId?: string | null;
  serviceName?: string | null;
  collaboratorId?: string | null;
  collaboratorCode?: string | null;
  collaboratorName?: string | null;
  hrEmployeeId?: string | null;
  partyId?: string | null;
  billedAmount: number;
  amountFactured?: number;
  commissionAmount: number;
  status: 'active' | 'voided';
  service?: {
    id?: string | null;
    name?: string | null;
    sku?: string | null;
  };
  collaborator?: ServiceCommissionCollaboratorSnapshot | null;
  commission?: {
    type: ServiceCommissionType;
    rateValue: number;
    source: ServiceCommissionSource;
    calculationBase: ServiceCommissionCalculationBase;
  };
  voidedAt?: unknown;
  voidedBy?: string | null;
  voidReason?: string | null;
  [key: string]: unknown;
}
