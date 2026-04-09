import { message } from 'antd';
import { useReducer } from 'react';
import { useSelector } from 'react-redux';
import type { ChangeEvent } from 'react';

import { selectUser } from '@/features/auth/userSlice';
import { fbNormalizeAllBusinessesClients } from '@/firebase/client/fbNormalizeAllBusinessesClients';
import {
  fbFixExpenseTimestamps,
  fbFixExpenseTimestampsForAll,
} from '@/firebase/expenses/maintenance/fbFixExpenseTimestamps';
import { fbFixMissingProductIds } from '@/firebase/products/fbFixMissingProductIds';
import { normalizeAllBusinessesProductTaxes } from '@/firebase/products/fbNormalizeAllBusinessesProductTaxes';

import type {
  ClientNormalizationResult,
  ExpenseFixAllResult,
  ExpenseFixResult,
  ExpenseFixSummary,
  FixProductIdResult,
  TaxNormalizationResult,
  TestPlaygroundState,
} from '../types';

const initialState: TestPlaygroundState = {
  normalizing: false,
  progress: null,
  result: null,
  clientNormalizationState: {
    running: false,
    progress: null,
    result: null,
  },
  productIdFixState: {
    businessId: null,
    running: false,
    result: null,
  },
  expenseTimestampFixState: {
    businessId: null,
    running: false,
    result: null,
  },
  applyToAllBusinesses: false,
};

const getAsyncErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrio un error inesperado.';

export const useTestPlaygroundController = () => {
  const [state, setState] = useReducer(
    <
      T extends Record<string, unknown>
    >(
      current: T,
      update: Partial<T> | ((prev: T) => Partial<T>),
    ) => ({
      ...current,
      ...(typeof update === 'function' ? update(current) : update),
    }),
    initialState,
  );
  const user = useSelector(selectUser);
  const defaultBusinessId = user?.businessID || '';
  const resolvedProductFixBusinessId =
    state.productIdFixState.businessId ?? defaultBusinessId;
  const resolvedExpenseFixBusinessId =
    state.expenseTimestampFixState.businessId ?? defaultBusinessId;

  const setClientNormalizationState = (
    update:
      | typeof state.clientNormalizationState
      | ((
          prev: typeof state.clientNormalizationState,
        ) => typeof state.clientNormalizationState),
  ) =>
    setState((prev) => ({
      clientNormalizationState:
        typeof update === 'function'
          ? update(prev.clientNormalizationState)
          : update,
    }));

  const setProductIdFixState = (
    update:
      | typeof state.productIdFixState
      | ((prev: typeof state.productIdFixState) => typeof state.productIdFixState),
  ) =>
    setState((prev) => ({
      productIdFixState:
        typeof update === 'function' ? update(prev.productIdFixState) : update,
    }));

  const setExpenseTimestampFixState = (
    update:
      | typeof state.expenseTimestampFixState
      | ((
          prev: typeof state.expenseTimestampFixState,
        ) => typeof state.expenseTimestampFixState),
  ) =>
    setState((prev) => ({
      expenseTimestampFixState:
        typeof update === 'function'
          ? update(prev.expenseTimestampFixState)
          : update,
    }));

  const handleNormalizeTaxes = () => {
    if (state.normalizing) return;

    setState({
      normalizing: true,
      progress: null,
      result: null,
    });

    normalizeAllBusinessesProductTaxes({
      onProgress: ({ processed, total, businessID }) => {
        setState({
          progress: { processed, total, businessID },
        });
      },
    })
      .then((response) => {
        setState({
          result: { success: true, data: response as TaxNormalizationResult },
        });
        message.success('Normalizacion completada.');
      })
      .catch((error) => {
        console.error('Error al normalizar impuestos:', error);
        setState({
          result: {
            success: false,
            error: getAsyncErrorMessage(error),
          },
        });
        message.error(
          'No se pudo normalizar el impuesto. Revisa la consola para detalles.',
        );
      })
      .finally(() => {
        setState({ normalizing: false });
      });
  };

  const handleNormalizeClients = () => {
    if (state.clientNormalizationState.running) return;

    setClientNormalizationState({
      running: true,
      progress: null,
      result: null,
    });

    fbNormalizeAllBusinessesClients({
      onProgress: ({ processed, total, businessID, summary }) => {
        setClientNormalizationState((prev) => ({
          ...prev,
          progress: {
            processed,
            total,
            businessID,
            normalized: summary?.normalized ?? null,
          },
        }));
      },
    })
      .then((response) => {
        setClientNormalizationState({
          running: false,
          progress: null,
          result: {
            success: true,
            data: response as ClientNormalizationResult,
          },
        });
        message.success('Normalizacion de clientes completada.');
      })
      .catch((error) => {
        console.error('Error al normalizar clientes:', error);
        setClientNormalizationState({
          running: false,
          progress: null,
          result: {
            success: false,
            error: getAsyncErrorMessage(error),
          },
        });
        message.error(
          'No se pudo normalizar los clientes. Revisa la consola para detalles.',
        );
      });
  };

  const handleFixProductIds = () => {
    const businessId = resolvedProductFixBusinessId.trim();
    if (!businessId) {
      message.warning('Ingresa un businessID valido.');
      return;
    }
    if (state.productIdFixState.running) return;

    setProductIdFixState((prev) => ({
      ...prev,
      running: true,
      result: null,
    }));

    fbFixMissingProductIds({ businessID: businessId })
      .then((response) => {
        const normalizedResponse = response as FixProductIdResult;
        setProductIdFixState({
          businessId,
          running: false,
          result: { success: true, data: normalizedResponse },
        });
        message.success(
          `Productos actualizados: ${normalizedResponse.updated}/${normalizedResponse.total}.`,
        );
      })
      .catch((error) => {
        console.error('Error al corregir IDs de productos:', error);
        setProductIdFixState({
          businessId,
          running: false,
          result: {
            success: false,
            error: getAsyncErrorMessage(error),
          },
        });
        message.error('No se pudo corregir los IDs de productos.');
      });
  };

  const handleBusinessIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setProductIdFixState((prev) => ({
      ...prev,
      businessId: value,
    }));
  };

  const handleExpenseTimestampBusinessChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setExpenseTimestampFixState((prev) => ({
      ...prev,
      businessId: value,
    }));
  };

  const handleExpenseTimestampFix = (dryRun: boolean) => {
    const businessId = resolvedExpenseFixBusinessId.trim();
    if (!state.applyToAllBusinesses && !businessId) {
      message.warning('Ingresa un businessID valido.');
      return;
    }
    if (state.expenseTimestampFixState.running) return;

    setExpenseTimestampFixState((prev) => ({
      ...prev,
      running: true,
      result: null,
    }));

    const isGlobal = state.applyToAllBusinesses;
    const request = isGlobal
      ? fbFixExpenseTimestampsForAll({ dryRun })
      : fbFixExpenseTimestamps({ businessID: businessId, dryRun });

    request
      .then((response) => {
        setExpenseTimestampFixState({
          businessId,
          running: false,
          result: {
            success: true,
            dryRun,
            mode: isGlobal ? 'all' : 'single',
            data: response as ExpenseFixAllResult | ExpenseFixSummary,
          },
        });

        const successMessage = dryRun
          ? isGlobal
            ? 'Analisis global completado. Revisa los resultados antes de aplicar cambios.'
            : 'Analisis completado. Revisa los resultados antes de aplicar cambios.'
          : isGlobal
            ? 'Conversion global completada. Todos los gastos ahora usan Firebase Timestamp.'
            : 'Conversion completada. Los gastos ahora usan Firebase Timestamp.';

        message.success(successMessage);
      })
      .catch((error) => {
        console.error('Error al normalizar fechas de gastos:', error);
        setExpenseTimestampFixState((prev) => ({
          ...prev,
          running: false,
          result: {
            success: false,
            error: getAsyncErrorMessage(error),
          },
        }));
        message.error('No se pudo normalizar las fechas de los gastos.');
      });
  };

  return {
    state,
    resolvedProductFixBusinessId,
    resolvedExpenseFixBusinessId,
    handleNormalizeTaxes,
    handleNormalizeClients,
    handleFixProductIds,
    handleBusinessIdChange,
    handleExpenseTimestampBusinessChange,
    handleExpenseTimestampFix,
    setApplyToAllBusinesses: (value: boolean) =>
      setState({ applyToAllBusinesses: value }),
  };
};
