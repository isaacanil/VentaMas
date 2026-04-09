import {
  AlignLeftOutlined,
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  FireOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  fetchAccountsReceivablePaymentsByCashierAndRange,
  fetchCashCountDoc,
  fetchExpensesByCashCountId,
  fetchInvoicesByCashCountId,
  fetchUsers,
  listenBusinesses,
  listenCashCounts,
  runCashCountAudit,
} from '@/firebase/cashCount/cashCountAudit.service';
import { CashCountMetaData } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData';
import {
  getErrorMessage,
  resolveBusinessName,
  resolveCashierId,
  toRecord,
} from '@/domain/cashCount/cashCountAuditLogic';
import { toMillis } from '@/utils/date/toMillis';
import type { CashCountBanknote } from '@/utils/cashCount/types';
import type { TimestampLike } from '@/utils/date/types';

import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CashCountEmployeeRef {
  id?: string;
  uid?: string;
  _key?: {
    path?: {
      segments?: string[];
    };
  };
}

interface CashCountData {
  opening?: {
    date?: TimestampLike;
    employee?: CashCountEmployeeRef;
    banknotes?: CashCountBanknote[];
  };
  closing?: {
    date?: TimestampLike;
    banknotes?: CashCountBanknote[];
  };
  totalCard?: number;
  totalTransfer?: number;
  totalCharged?: number;
  totalReceivables?: number;
  totalSystem?: number;
  totalRegister?: number;
  totalDiscrepancy?: number;
  totalCash?: number;
}

interface CashCountListItem {
  id: string;
  number?: number;
  state?: string;
}

interface BusinessOption {
  id: string;
  name: string;
}

interface BusinessUser {
  id?: string;
  businessID?: string;
  businessId?: string;
  user?: {
    id?: string;
    uid?: string;
    name?: string;
    username?: string;
    businessID?: string;
    businessId?: string;
  };
}

interface AuditLogEntry {
  key: string;
  business: string;
  cashCountId: string;
  cashier: string | null;
  stored: CashCountData;
  recalculated: CashCountData;
  at: number;
}

interface AutoRunItem {
  cashCountId?: string;
  businessId?: string;
  discrepancy?: number;
  delta?: number;
  discrepancyStored?: number;
  discrepancyRecalc?: number;
}

interface AutoRun {
  id: string;
  businessId?: string;
  businessIds?: string[];
  status?: string;
  createdAt: number | string;
  items?: AutoRunItem[];
}

type AuditMode = 'manual' | 'auto';

interface CurrentUser {
  businessID?: string;
  uid?: string;
  id?: string;
}

interface CashCountSelectionState {
  items: CashCountListItem[];
  selectedId: string;
}

type CashCountSelectionAction =
  | { type: 'sync'; items: CashCountListItem[] }
  | { type: 'clear' }
  | { type: 'select'; id: string };

interface AuditDataState {
  key: string | null;
  stored: CashCountData | null;
  recalc: CashCountData | null;
  error: string | null;
  auditLog: AuditLogEntry[];
}

type AuditDataAction =
  | {
      type: 'success';
      key: string;
      business: string;
      cashCountId: string;
      cashier: string | null;
      stored: CashCountData;
      recalc: CashCountData;
    }
  | {
      type: 'error';
      key: string;
      error: string;
    };

interface CashCountUiState {
  business: string;
  user: string;
  businesses: BusinessOption[];
  usersState: {
    key: string | null;
    users: BusinessUser[];
  };
  mode: AuditMode;
  autoRuns: AutoRun[];
  loadingRuns: boolean;
  selectedRun: string | null;
  selectedAutoCashCount: string;
  autoRange: [Dayjs | null, Dayjs | null] | null;
  threshold: number;
}

type CashCountUiAction =
  | { type: 'setBusiness'; value: string }
  | { type: 'setUser'; value: string }
  | { type: 'setBusinesses'; value: BusinessOption[] }
  | {
      type: 'setUsersState';
      value: {
        key: string | null;
        users: BusinessUser[];
      };
    }
  | { type: 'setMode'; value: AuditMode }
  | { type: 'startRuns' }
  | { type: 'finishRuns' }
  | { type: 'prependAutoRun'; value: AutoRun }
  | { type: 'setSelectedRun'; value: string | null }
  | { type: 'setSelectedAutoCashCount'; value: string }
  | { type: 'setAutoRange'; value: [Dayjs | null, Dayjs | null] | null }
  | { type: 'setThreshold'; value: number };

const initialCashCountSelectionState: CashCountSelectionState = {
  items: [],
  selectedId: '',
};

const reduceCashCountSelection = (
  state: CashCountSelectionState,
  action: CashCountSelectionAction,
): CashCountSelectionState => {
  switch (action.type) {
    case 'sync':
      return {
        items: action.items,
        selectedId: action.items.some((item) => item.id === state.selectedId)
          ? state.selectedId
          : action.items[0]?.id || '',
      };
    case 'clear':
      return initialCashCountSelectionState;
    case 'select':
      return {
        ...state,
        selectedId: action.id,
      };
    default:
      return state;
  }
};

const initialAuditDataState: AuditDataState = {
  key: null,
  stored: null,
  recalc: null,
  error: null,
  auditLog: [],
};

const initialCashCountUiState: CashCountUiState = {
  business: '',
  user: '',
  businesses: [],
  usersState: {
    key: null,
    users: [],
  },
  mode: 'manual',
  autoRuns: [],
  loadingRuns: false,
  selectedRun: null,
  selectedAutoCashCount: '',
  autoRange: null,
  threshold: 0,
};

const reduceAuditDataState = (
  state: AuditDataState,
  action: AuditDataAction,
): AuditDataState => {
  switch (action.type) {
    case 'success': {
      const nextEntry = {
        key: action.key,
        business: action.business,
        cashCountId: action.cashCountId,
        cashier: action.cashier,
        stored: action.stored,
        recalculated: action.recalc,
        at: Date.now(),
      };
      const existingIndex = state.auditLog.findIndex(
        (item) => item.key === action.key,
      );
      const auditLog =
        existingIndex >= 0
          ? state.auditLog.map((entry, index) =>
              index === existingIndex ? nextEntry : entry,
            )
          : [nextEntry, ...state.auditLog].slice(0, 20);
      return {
        key: action.key,
        stored: action.stored,
        recalc: action.recalc,
        error: null,
        auditLog,
      };
    }
    case 'error':
      return {
        ...state,
        key: action.key,
        stored: null,
        recalc: null,
        error: action.error,
      };
    default:
      return state;
  }
};

const reduceCashCountUiState = (
  state: CashCountUiState,
  action: CashCountUiAction,
): CashCountUiState => {
  switch (action.type) {
    case 'setBusiness':
      return { ...state, business: action.value };
    case 'setUser':
      return { ...state, user: action.value };
    case 'setBusinesses':
      return { ...state, businesses: action.value };
    case 'setUsersState':
      return { ...state, usersState: action.value };
    case 'setMode':
      return { ...state, mode: action.value };
    case 'startRuns':
      return { ...state, loadingRuns: true };
    case 'finishRuns':
      return { ...state, loadingRuns: false };
    case 'prependAutoRun':
      return {
        ...state,
        loadingRuns: false,
        autoRuns: [action.value, ...state.autoRuns],
        selectedRun: action.value.id,
        selectedAutoCashCount: action.value.items?.[0]?.cashCountId || '',
      };
    case 'setSelectedRun':
      return { ...state, selectedRun: action.value };
    case 'setSelectedAutoCashCount':
      return { ...state, selectedAutoCashCount: action.value };
    case 'setAutoRange':
      return { ...state, autoRange: action.value };
    case 'setThreshold':
      return { ...state, threshold: action.value };
    default:
      return state;
  }
};

const CashCountAudit: React.FC = () => {
  const currentUser = useSelector(selectUser) as CurrentUser | null;
  const currentBusinessId = currentUser?.businessID || '';
  const [cashCountSelection, dispatchCashCountSelection] = useReducer(
    reduceCashCountSelection,
    initialCashCountSelectionState,
  );
  const [auditDataState, dispatchAuditData] = useReducer(
    reduceAuditDataState,
    initialAuditDataState,
  );
  const [uiState, dispatchUi] = useReducer(
    reduceCashCountUiState,
    initialCashCountUiState,
  );
  const {
    business,
    user,
    businesses,
    usersState,
    mode,
    autoRuns,
    loadingRuns,
    selectedRun,
    selectedAutoCashCount,
    autoRange,
    threshold,
  } = uiState;

  const selectedBusiness =
    mode === 'manual'
      ? business || currentBusinessId
      : business || 'ALL';

  const dataBusinessId =
    mode === 'manual' && selectedBusiness && selectedBusiness !== 'ALL'
      ? selectedBusiness
      : '';

  const usersKey = dataBusinessId ? `users:${dataBusinessId}` : null;
  const fallbackBusinessUserId =
    usersKey && usersState.key === usersKey
      ? usersState.users[0]?.user?.id || usersState.users[0]?.user?.uid || ''
      : '';
  const selectedUser =
    user || currentUser?.uid || currentUser?.id || fallbackBusinessUserId || '';
  const cashCountId = cashCountSelection.selectedId;
  const dataKey =
    dataBusinessId && cashCountId ? `${dataBusinessId}/${cashCountId}` : null;

  useEffect(() => {
    if (!dataBusinessId) return undefined;

    return listenCashCounts({
      businessId: dataBusinessId,
      max: 25,
      onData: (docs) => {
        const items = docs.map((d) => {
          const raw = toRecord(d.data);
          const data = (raw.cashCount ?? {}) as CashCountData & {
            incrementNumber?: number;
            state?: string;
          };
          return {
            id: d.id,
            number: data.incrementNumber,
            state: data.state,
          };
        });

        dispatchCashCountSelection({ type: 'sync', items });
      },
      onError: (err) => {
        console.error('Error listening cashCounts', err);
        dispatchCashCountSelection({ type: 'clear' });
      },
    });
  }, [dataBusinessId]);

  useEffect(() => {
    return listenBusinesses({
      max: 100,
      onData: (docs) => {
        dispatchUi({
          type: 'setBusinesses',
          value:
          docs.map((d) => ({ id: d.id, name: resolveBusinessName(d.id, d.data) })),
        });
      },
      onError: (err) => {
        console.error('Error listening businesses', err);
        dispatchUi({ type: 'setBusinesses', value: [] });
      },
    });
  }, []);

  useEffect(() => {
    if (!usersKey || !dataBusinessId) return;

    Promise.resolve()
      .then(() => fetchUsers(500))
      .then((docs) => {
        const list = docs.map((d) => toRecord(d.data) as BusinessUser);
        const filtered = list.filter((u) => {
          const dataBiz =
            u?.user?.businessID ||
            u?.user?.businessId ||
            u?.businessID ||
            u?.businessId;
          return dataBiz === dataBusinessId;
        });

        dispatchUi({
          type: 'setUsersState',
          value: { key: usersKey, users: filtered },
        });
      })
      .catch((err: unknown) => {
        console.error('Error loading users for business', err);
        dispatchUi({
          type: 'setUsersState',
          value: { key: usersKey, users: [] },
        });
      });
  }, [usersKey, dataBusinessId]);

  useEffect(() => {
    if (!dataKey || !dataBusinessId || !cashCountId) return;

    Promise.resolve()
      .then(() =>
        fetchCashCountDoc({
          businessId: dataBusinessId,
          cashCountId,
        }),
      )
      .then(async (rawCashCountDoc) => {
        if (!rawCashCountDoc) {
          throw new Error('No se encontró el cuadre seleccionado');
        }

        const ccData = (toRecord(rawCashCountDoc).cashCount ??
          {}) as CashCountData;

        const [invoices, expensesRaw] = await Promise.all([
          fetchInvoicesByCashCountId({ businessId: dataBusinessId, cashCountId }),
          fetchExpensesByCashCountId({ businessId: dataBusinessId, cashCountId }),
        ]);

        const expenses = expensesRaw.map((d) => toRecord(d).expense);

        const openingTs = ccData?.opening?.date;
        const closingTs = ccData?.closing?.date;
        const resolvedStart = openingTs ? toMillis(openingTs) : undefined;
        const resolvedEnd = closingTs ? toMillis(closingTs) : undefined;
        const start =
          typeof resolvedStart === 'number' ? resolvedStart : undefined;
        const end = typeof resolvedEnd === 'number' ? resolvedEnd : Date.now();

        const cashierId = resolveCashierId(ccData);

        const arPayments =
          cashierId && typeof start === 'number'
            ? await fetchAccountsReceivablePaymentsByCashierAndRange({
                businessId: dataBusinessId,
                cashierId,
                startMillis: start,
                endMillis: end,
              }).catch((err: unknown) => {
                console.warn('No se pudieron cargar pagos CxC:', err);
                return [];
              })
            : [];

        const meta = CashCountMetaData(
          ccData,
          invoices || [],
          expenses || [],
          arPayments || [],
        ) as CashCountData;

        dispatchAuditData({
          type: 'success',
          key: dataKey,
          business: dataBusinessId,
          cashCountId,
          cashier: selectedUser || cashierId || null,
          stored: ccData,
          recalc: meta,
        });
      })
      .catch((err: unknown) => {
        console.error(err);
        dispatchAuditData({
          type: 'error',
          key: dataKey,
          error: getErrorMessage(err),
        });
      });
  }, [dataKey, dataBusinessId, cashCountId, selectedUser]);

  const businessOptions = useMemo(() => {
    const base = businesses.map((b) => ({
      value: b.id,
      label: b.name || b.id,
    }));
    if (currentBusinessId && !base.some((b) => b.value === currentBusinessId)) {
      base.unshift({
        value: currentBusinessId,
        label: currentBusinessId,
      });
    }
    return base;
  }, [businesses, currentBusinessId]);
  const autoBusinessOptions = useMemo(
    () => [{ value: 'ALL', label: 'Todos los negocios' }, ...businessOptions],
    [businessOptions],
  );

  const loadingUsers = !!usersKey && usersState.key !== usersKey;
  const loadingData = !!dataKey && auditDataState.key !== dataKey;

  const cashCountDoc =
    dataKey && auditDataState.key === dataKey ? auditDataState.stored : null;
  const recalc =
    dataKey && auditDataState.key === dataKey ? auditDataState.recalc : null;
  const dataError =
    dataKey && auditDataState.key === dataKey ? auditDataState.error : null;

  const userOptions = useMemo(() => {
    const businessUsers =
      usersKey && usersState.key === usersKey ? usersState.users : [];
    if (!Array.isArray(businessUsers)) return [];
    return businessUsers.map((u) => ({
      value: u.user?.id || u.user?.uid || u.id,
      label: [
        u.user?.name || u.user?.username || 'Usuario',
        u.user?.id || u.user?.uid || '',
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [usersKey, usersState.key, usersState.users]);

  const cashCountOptions = useMemo(() => {
    return cashCountSelection.items.map((cc) => ({
      value: cc.id,
      label: cc.number ? `#${cc.number} (${cc.state || 'n/a'})` : cc.id,
    }));
  }, [cashCountSelection.items]);

  const autoRunOptions = useMemo(
    () =>
      autoRuns.map((run) => ({
        value: run.id,
        label: `${run.businessId} · ${new Date(run.createdAt).toLocaleString()} (${run.status || 'pending'})`,
      })),
    [autoRuns],
  );

  const autoCashCountOptions = useMemo(() => {
    if (!selectedRun) return [];
    const run = autoRuns.find((r) => r.id === selectedRun);
    if (!run?.items) return [];
    return run.items
      .filter(
        (item) => Math.abs(Number(item.discrepancy || item.delta || 0)) > 0,
      )
      .map((item) => ({
        value: item.cashCountId,
        label: `${item.businessId || run.businessId} · ${item.cashCountId} · Δ ${fmt(item.discrepancy || item.delta)}`,
      }));
  }, [selectedRun, autoRuns]);

  const handleRunAuto = async () => {
    const biz = selectedBusiness || 'ALL';
    if (!business) {
      dispatchUi({ type: 'setBusiness', value: 'ALL' });
    }
    dispatchUi({ type: 'startRuns' });
    const payload = {
      businessId: biz === 'ALL' ? 'ALL' : biz,
      allBusinesses: biz === 'ALL',
      from: autoRange?.[0]?.valueOf?.() || null,
      to: autoRange?.[1]?.valueOf?.() || null,
      threshold: Number(threshold) || 0,
    };

    runCashCountAudit(payload)
      .then((data) => {
        const response = toRecord(data);
        const run = {
          id: (response.runId as string | undefined) || `run-${Date.now()}`,
          businessId:
            (response.businessId as string | undefined) ||
            (biz === 'ALL' ? 'ALL' : biz),
          businessIds:
            (response.businessIds as string[] | undefined) ||
            (biz === 'ALL' ? ['ALL'] : [biz]),
          status: (response.status as string | undefined) || 'done',
          createdAt:
            (response.createdAt as number | string | undefined) || Date.now(),
          items: (response.discrepancies as AutoRunItem[] | undefined) || [],
        };
        dispatchUi({ type: 'prependAutoRun', value: run });
        if ((run.items || []).length === 0) {
          message.info('No se encontraron cuadres con discrepancia en el rango.');
        } else {
          message.success(
            `Se encontraron ${run.items.length} cuadres con discrepancia.`,
          );
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        message.error(getErrorMessage(err));
      })
      .finally(() => {
        dispatchUi({ type: 'finishRuns' });
      });
  };

  const handleSelectAutoItem = (cashCountId: string) => {
    dispatchUi({ type: 'setSelectedAutoCashCount', value: cashCountId });
    const run = autoRuns.find((r) => r.id === selectedRun);
    const item = run?.items?.find((i) => i.cashCountId === cashCountId);
    if (item?.businessId) {
      dispatchUi({ type: 'setBusiness', value: item.businessId });
    } else if (run?.businessId) {
      dispatchUi({ type: 'setBusiness', value: run.businessId });
    }
    if (cashCountId) {
      dispatchCashCountSelection({ type: 'select', id: cashCountId });
      dispatchUi({ type: 'setMode', value: 'manual' });
    }
  };

  return (
    <PageWrapper>
      <Hero>
        <div>
          <Title level={2}>Cash count audit</Title>
        </div>
        <SummaryCard>
          <Title level={4}>Contexto</Title>
          <Space orientation="vertical" size={6}>
            <Inline>
              <Text type="secondary">Negocio</Text>
              {selectedBusiness ? (
                <Tag color="blue" variant="filled">
                  {selectedBusiness}
                </Tag>
              ) : (
                <Text type="secondary">Sin negocio</Text>
              )}
            </Inline>
            <Inline>
              <Text type="secondary">Cajero</Text>
              {selectedUser ? (
                <Tag color="processing" variant="filled">
                  {selectedUser}
                </Tag>
              ) : (
                <Text type="secondary">Sin cajero</Text>
              )}
            </Inline>
            <Inline>
              <Text type="secondary">Cuadre</Text>
              {cashCountId ? (
                <Tag color="purple" variant="filled">
                  {cashCountId}
                </Tag>
              ) : (
                <Text type="secondary">Sin cuadre</Text>
              )}
            </Inline>
          </Space>
        </SummaryCard>
      </Hero>

      <FiltersCard>
        <Inline $gap={12}>
          <Field>
            <FieldLabel>Modo</FieldLabel>
            <Space>
              <Button
                type={mode === 'manual' ? 'primary' : 'default'}
                icon={<AlignLeftOutlined />}
                onClick={() => {
                  dispatchUi({ type: 'setMode', value: 'manual' });
                  if (business === 'ALL') {
                    dispatchUi({
                      type: 'setBusiness',
                      value: currentBusinessId,
                    });
                  }
                }}
              >
                Manual
              </Button>
              <Button
                type={mode === 'auto' ? 'primary' : 'default'}
                icon={<ApiOutlined />}
                onClick={() => {
                  dispatchUi({ type: 'setMode', value: 'auto' });
                  if (!business) {
                    dispatchUi({ type: 'setBusiness', value: 'ALL' });
                  }
                }}
              >
                Autom&aacute;tico
              </Button>
            </Space>
          </Field>
        </Inline>

        <Divider />

        {mode === 'manual' ? (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Negocio</FieldLabel>
              <Select
                value={selectedBusiness}
                onChange={(value) =>
                  dispatchUi({ type: 'setBusiness', value })
                }
                options={businessOptions}
                style={{ minWidth: 200 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
            <Field>
              <FieldLabel>Cajero</FieldLabel>
              <Select
                value={selectedUser}
                onChange={(value) =>
                  dispatchUi({ type: 'setUser', value })
                }
                options={userOptions}
                style={{ minWidth: 200 }}
                loading={loadingUsers}
                placeholder={
                  dataBusinessId
                    ? 'Selecciona cajero'
                    : 'Selecciona negocio primero'
                }
                showSearch
                optionFilterProp="label"
                disabled={!dataBusinessId}
                notFoundContent={
                  dataBusinessId
                    ? 'Sin usuarios en el negocio'
                    : 'Selecciona un negocio'
                }
              />
            </Field>
            <Field>
              <FieldLabel>Cuadre</FieldLabel>
              <Select
                value={cashCountId}
                onChange={(value) =>
                  dispatchCashCountSelection({ type: 'select', id: value })
                }
                options={cashCountOptions}
                style={{ minWidth: 240 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
          </Inline>
        ) : (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Negocio</FieldLabel>
              <Select
                value={selectedBusiness}
                onChange={(value) =>
                  dispatchUi({ type: 'setBusiness', value })
                }
                options={autoBusinessOptions}
                style={{ minWidth: 200 }}
                showSearch
                optionFilterProp="label"
              />
            </Field>
            <Field>
              <FieldLabel>
                Ejecutar auditor&iacute;a autom&aacute;tica
              </FieldLabel>
              <Space>
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  loading={loadingRuns}
                  onClick={handleRunAuto}
                >
                  Lanzar job
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  loading={loadingRuns}
                  onClick={handleRunAuto}
                >
                  Actualizar jobs
                </Button>
              </Space>
            </Field>
            <Field>
              <FieldLabel>Rango de fechas</FieldLabel>
              <RangePicker
                style={{ minWidth: 260 }}
                value={autoRange}
                onChange={(value) =>
                  dispatchUi({ type: 'setAutoRange', value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Umbral (abs) DOP</FieldLabel>
              <InputNumber
                min={0}
                value={threshold}
                onChange={(value) =>
                  dispatchUi({ type: 'setThreshold', value: value ?? 0 })
                }
                style={{ width: 140 }}
              />
            </Field>
          </Inline>
        )}

        <Divider />

        {mode === 'manual' ? (
          <Space size="middle" wrap>
            <Button icon={<SyncOutlined />}>Recalcular</Button>
            <Button type="primary" icon={<BranchesOutlined />}>
              Abrir reporte detallado
            </Button>
          </Space>
        ) : (
          <Inline $gap={18}>
            <Field>
              <FieldLabel>Jobs de auditor&iacute;a</FieldLabel>
              <Select
                value={selectedRun}
                onChange={(value) =>
                  dispatchUi({ type: 'setSelectedRun', value })
                }
                options={autoRunOptions}
                style={{ minWidth: 260 }}
                placeholder="Selecciona un job"
                loading={loadingRuns}
              />
            </Field>
            <Field>
              <FieldLabel>Cuadres con discrepancia</FieldLabel>
              <Select
                value={selectedAutoCashCount}
                onChange={handleSelectAutoItem}
                options={autoCashCountOptions}
                style={{ minWidth: 240 }}
                placeholder="Selecciona un cuadre"
                disabled={!selectedRun}
              />
            </Field>
          </Inline>
        )}
      </FiltersCard>

      {mode === 'manual' ? (
        <>
          <ComparisonGrid>
            <DataCard>
              <CardHeader>
                <Space>
                  <CheckCircleOutlined />
                  <Text strong>Datos guardados (Firestore)</Text>
                </Space>
                {loadingData && (
                  <Tag icon={<SyncOutlined spin />}>Cargando</Tag>
                )}
              </CardHeader>
              {dataError ? (
                <ErrorText>{dataError}</ErrorText>
              ) : cashCountDoc ? (
                <Metrics>
                  <MetricRow>
                    <Label>Total tarjeta</Label>
                    <Value>{fmt(cashCountDoc?.totalCard)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total transferencia</Label>
                    <Value>{fmt(cashCountDoc?.totalTransfer)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total facturado (snapshot)</Label>
                    <Value>{fmt(cashCountDoc?.totalCharged)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total cobrado CxC</Label>
                    <Value>{fmt(cashCountDoc?.totalReceivables)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total sistema</Label>
                    <Value>{fmt(cashCountDoc?.totalSystem)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total registro</Label>
                    <Value>{fmt(cashCountDoc?.totalRegister)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Discrepancia</Label>
                    <Value>{fmt(cashCountDoc?.totalDiscrepancy)}</Value>
                  </MetricRow>
                </Metrics>
              ) : (
                <Text type="secondary">
                  Selecciona un negocio y cuadre para ver los datos guardados.
                </Text>
              )}
            </DataCard>

            <DataCard>
              <CardHeader>
                <Space>
                  <FireOutlined />
                  <Text strong>Recalculado (CashRegisterClosure)</Text>
                </Space>
                {loadingData && (
                  <Tag icon={<SyncOutlined spin />}>Recalculando</Tag>
                )}
              </CardHeader>
              {dataError ? (
                <ErrorText>{dataError}</ErrorText>
              ) : recalc ? (
                <Metrics>
                  <MetricRow>
                    <Label>Total tarjeta</Label>
                    <Value>{fmt(recalc.totalCard)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total transferencia</Label>
                    <Value>{fmt(recalc.totalTransfer)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total facturado (snapshot)</Label>
                    <Value>{fmt(recalc.totalCharged)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total cobrado CxC</Label>
                    <Value>{fmt(recalc.totalReceivables)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total sistema</Label>
                    <Value>{fmt(recalc.totalSystem)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Total registro</Label>
                    <Value>{fmt(recalc.totalRegister)}</Value>
                  </MetricRow>
                  <MetricRow>
                    <Label>Discrepancia</Label>
                    <Value>{fmt(recalc.totalDiscrepancy)}</Value>
                  </MetricRow>
                </Metrics>
              ) : (
                <Text type="secondary">
                  Selecciona un negocio y cuadre para recalcular.
                </Text>
              )}
            </DataCard>
          </ComparisonGrid>

          {auditDataState.auditLog.length > 0 && (
            <HistoryCard>
              <CardHeader>
                <Space>
                  <BranchesOutlined />
                  <Text strong>Resultados recientes</Text>
                </Space>
              </CardHeader>
              <HistoryGrid>
                {auditDataState.auditLog.map((entry) => (
                  <HistoryItem key={entry.key}>
                    <Label>
                      {entry.business} · {entry.cashCountId}
                    </Label>
                    <MetricRow>
                      <Label>Discrepancia guardada</Label>
                      <Value>{fmt(entry.stored?.totalDiscrepancy)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Discrepancia recalculada</Label>
                      <Value>{fmt(entry.recalculated?.totalDiscrepancy)}</Value>
                    </MetricRow>
                    <MetaText>
                      Cajero: {entry.cashier || '—'} ·{' '}
                      {new Date(entry.at).toLocaleString()}
                    </MetaText>
                  </HistoryItem>
                ))}
              </HistoryGrid>
            </HistoryCard>
          )}
        </>
      ) : (
        <ComparisonGrid>
          <DataCard>
            <CardHeader>
              <Space>
                <ApiOutlined />
                <Text strong>Resultados autom&aacute;ticos</Text>
              </Space>
              {loadingRuns && <Tag icon={<SyncOutlined spin />}>Cargando</Tag>}
            </CardHeader>
            {selectedRun && selectedAutoCashCount ? (
              (() => {
                const run = autoRuns.find((r) => r.id === selectedRun);
                const item = run?.items?.find(
                  (i) => i.cashCountId === selectedAutoCashCount,
                );
                return item ? (
                  <>
                    <MetricRow>
                      <Label>Job</Label>
                      <Value>{selectedRun}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Cuadre</Label>
                      <Value>{selectedAutoCashCount}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Discrepancia detectada</Label>
                      <Value>{fmt(item.delta)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Guardada</Label>
                      <Value>{fmt(item.discrepancyStored)}</Value>
                    </MetricRow>
                    <MetricRow>
                      <Label>Recalculada</Label>
                      <Value>{fmt(item.discrepancyRecalc)}</Value>
                    </MetricRow>
                    <Space>
                      <Button
                        type="primary"
                        onClick={() =>
                          handleSelectAutoItem(selectedAutoCashCount)
                        }
                      >
                        Abrir en modo manual
                      </Button>
                    </Space>
                  </>
                ) : (
                  <Text type="secondary">
                    Selecciona un cuadre con discrepancia.
                  </Text>
                );
              })()
            ) : (
              <Text type="secondary">
                Selecciona un job y luego un cuadre con discrepancia para verlo.
              </Text>
            )}
          </DataCard>
        </ComparisonGrid>
      )}
    </PageWrapper>
  );
};

const fmt = (value: unknown): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(num);
};

const PageWrapper = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
  background: #f7f9fc;
  min-height: 100vh;
  color: #1f2937;
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: start;
`;

const SummaryCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 6%);
`;

const FiltersCard = styled(Card)`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(0 0 0 / 6%);
  color: #1f2937;

  .ant-card-body {
    padding: 16px;
  }
`;

interface InlineProps {
  $gap?: number | string;
}

const Inline = styled.div<InlineProps>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 8 }) => (typeof $gap === 'number' ? `${$gap}px` : $gap)};
  justify-content: flex-start;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  min-width: 180px;
`;

const FieldLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #6b7280;
`;

const ComparisonGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
`;

const DataCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 8%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Metrics = styled.div`
  display: grid;
  gap: 8px;
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed rgb(148 163 184 / 40%);
`;

const Label = styled.span`
  font-size: 13px;
  color: #4b5563;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const ErrorText = styled.span`
  color: #b91c1c;
`;

const HistoryCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 20px rgb(0 0 0 / 6%);
`;

const HistoryGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const HistoryItem = styled.div`
  display: grid;
  gap: 6px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed rgb(148 163 184 / 50%);
`;

const MetaText = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

export default CashCountAudit;
