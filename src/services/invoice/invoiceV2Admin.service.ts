import {
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
} from '@/services/functionsApiClient';

export interface InvoiceV2SummaryRequest {
  businessId: string;
  invoiceId: string;
}

export type InvoiceV2SummaryResponse = unknown;

export interface InvoiceV2RepairRequest {
  businessId: string;
  invoiceId: string;
  tasks?: string[] | null;
  reason?: string | null;
}

export type InvoiceV2RepairResponse = unknown;

export type InvoiceV2AutoRepairPayload = Record<string, unknown>;

export const fetchInvoiceV2Summary = async ({
  businessId,
  invoiceId,
}: InvoiceV2SummaryRequest): Promise<InvoiceV2SummaryResponse> => {
  if (!businessId || !invoiceId) {
    throw new Error('Debes indicar businessId e invoiceId.');
  }
  const authHeaders = await buildFunctionsAuthHeaders();
  const baseUrl = getFunctionsBaseUrl();
  const url = new URL(`${baseUrl}/getInvoiceV2Http`);
  url.searchParams.set('businessId', businessId);
  url.searchParams.set('invoiceId', invoiceId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      ...authHeaders,
    },
  });

  return parseFunctionsResponse<InvoiceV2SummaryResponse>(response);
};

export const repairInvoiceV2 = async ({
  businessId,
  invoiceId,
  tasks,
  reason,
}: InvoiceV2RepairRequest): Promise<InvoiceV2RepairResponse> => {
  if (!businessId || !invoiceId) {
    throw new Error('Debes indicar businessId e invoiceId.');
  }
  const authHeaders = await buildFunctionsAuthHeaders();
  const baseUrl = getFunctionsBaseUrl();
  const response = await fetch(`${baseUrl}/repairInvoiceV2Http`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessId,
      invoiceId,
      tasks,
      reason,
      sessionToken: authHeaders['X-Session-Token'],
    }),
  });

  return parseFunctionsResponse<InvoiceV2RepairResponse>(response);
};

export const autoRepairInvoiceV2 = async (
  payload: InvoiceV2AutoRepairPayload | null | undefined,
): Promise<InvoiceV2RepairResponse> => {
  const authHeaders = await buildFunctionsAuthHeaders();
  const baseUrl = getFunctionsBaseUrl();
  const response = await fetch(`${baseUrl}/autoRepairInvoiceV2Http`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });

  return parseFunctionsResponse<InvoiceV2RepairResponse>(response);
};
