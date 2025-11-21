import {
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
} from '../functionsApiClient';

export interface AuditRequestPayload {
  businessId: string;
  days?: number;
  sampleLimit?: number;
  since?: number;
}

export const fetchAccountsReceivableAudit = async (
  payload: AuditRequestPayload,
) => {
  if (!payload?.businessId) {
    throw new Error('Debes indicar el businessId para ejecutar la auditoría.');
  }

  const authHeaders = await buildFunctionsAuthHeaders();
  const baseUrl = getFunctionsBaseUrl();
  const response = await fetch(`${baseUrl}/auditAccountsReceivableHttp`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      sessionToken: authHeaders['X-Session-Token'],
    }),
  });

  return parseFunctionsResponse(response);
};

