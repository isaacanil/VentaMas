import {
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
} from '../functionsApiClient';

export const fetchInvoiceV2Summary = async ({ businessId, invoiceId }) => {
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

  return parseFunctionsResponse(response);
};

export const repairInvoiceV2 = async ({
  businessId,
  invoiceId,
  tasks,
  reason,
}) => {
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

  return parseFunctionsResponse(response);
};

export const autoRepairInvoiceV2 = async (payload) => {
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

  return parseFunctionsResponse(response);
};
