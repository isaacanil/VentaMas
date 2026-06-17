import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAccountReceivableAudit,
  type AdjustmentNoteFinancialEffectsIndicator,
} from '../services/accountReceivableAuditHttp';
import { DEFAULT_SAMPLE_LIMIT, MAX_SAMPLE_LIMIT } from '../constants';

interface UseAccountReceivableAuditIndicatorsOptions {
  defaultLimit?: number;
}

interface AccountReceivableAuditIndicatorsState {
  requestKey: string | null;
  adjustmentNoteFinancialEffects: AdjustmentNoteFinancialEffectsIndicator | null;
  generatedAt: string | null;
  lastUpdated: number | null;
  error: string | null;
}

const INITIAL_AUDIT_INDICATORS_STATE: AccountReceivableAuditIndicatorsState = {
  requestKey: null,
  adjustmentNoteFinancialEffects: null,
  generatedAt: null,
  lastUpdated: null,
  error: null,
};

const normalizeLimitValue = (value?: number | string): number => {
  const numericValue =
    value !== undefined && value !== null
      ? Number(value)
      : DEFAULT_SAMPLE_LIMIT;
  const fallback = Number.isFinite(numericValue)
    ? numericValue
    : DEFAULT_SAMPLE_LIMIT;
  return Math.min(Math.max(Math.floor(fallback), 1), MAX_SAMPLE_LIMIT);
};

export const useAccountReceivableAuditIndicators = (
  businessId: string | null,
  options: UseAccountReceivableAuditIndicatorsOptions = {},
) => {
  const defaultLimit =
    options?.defaultLimit && Number.isFinite(options.defaultLimit)
      ? Number(options.defaultLimit)
      : DEFAULT_SAMPLE_LIMIT;

  const [state, setState] = useState<AccountReceivableAuditIndicatorsState>(
    INITIAL_AUDIT_INDICATORS_STATE,
  );
  const [loadingRequestKey, setLoadingRequestKey] = useState<string | null>(
    null,
  );

  const fetchAuditIndicators = useCallback(
    async (limitValue?: number | string) => {
      if (!businessId) return;

      const requestKey = businessId;
      const normalizedLimit = normalizeLimitValue(limitValue ?? defaultLimit);

      setLoadingRequestKey(requestKey);
      try {
        const response = await fetchAccountReceivableAudit({
          businessId: requestKey,
          sampleLimit: normalizedLimit,
        });

        setState({
          requestKey,
          adjustmentNoteFinancialEffects:
            response.indicators.adjustmentNoteFinancialEffects ?? null,
          generatedAt: response.generatedAt || null,
          lastUpdated: Date.now(),
          error: null,
        });
      } catch (err: unknown) {
        const errorObj = err as {
          status?: number;
          code?: string;
          message?: string;
        };
        console.error(
          '[useAccountReceivableAuditIndicators] Failed to load AR audit indicators',
          err,
        );
        const friendlyMessage =
          errorObj?.status === 401
            ? 'Debes iniciar sesión para ejecutar la auditoría de CxC.'
            : errorObj?.status === 403 || errorObj?.code === 'permission-denied'
              ? 'No tienes permisos para ejecutar la auditoría de CxC.'
              : errorObj?.message || 'No se pudo ejecutar la auditoría de CxC.';

        setState({
          requestKey,
          adjustmentNoteFinancialEffects: null,
          generatedAt: null,
          lastUpdated: null,
          error: friendlyMessage,
        });
      } finally {
        setLoadingRequestKey((currentRequestKey) =>
          currentRequestKey === requestKey ? null : currentRequestKey,
        );
      }
    },
    [businessId, defaultLimit],
  );

  useEffect(() => {
    if (!businessId) return;
    void fetchAuditIndicators(defaultLimit);
  }, [businessId, defaultLimit, fetchAuditIndicators]);

  const hasCurrentResult =
    Boolean(businessId) && state.requestKey === businessId;
  const adjustmentNoteFinancialEffects = hasCurrentResult
    ? state.adjustmentNoteFinancialEffects
    : null;
  const generatedAt = hasCurrentResult ? state.generatedAt : null;
  const lastUpdated = hasCurrentResult ? state.lastUpdated : null;
  const error = hasCurrentResult ? state.error : null;
  const loading = Boolean(businessId) && loadingRequestKey === businessId;

  return useMemo(
    () => ({
      adjustmentNoteFinancialEffects,
      error,
      fetchAuditIndicators,
      generatedAt,
      lastUpdated,
      loading,
    }),
    [
      adjustmentNoteFinancialEffects,
      error,
      fetchAuditIndicators,
      generatedAt,
      lastUpdated,
      loading,
    ],
  );
};
