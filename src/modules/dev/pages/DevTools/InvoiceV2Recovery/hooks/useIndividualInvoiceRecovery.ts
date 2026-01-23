import { Form, message } from 'antd';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query as buildQuery,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { db } from '@/firebase/firebaseconfig';
import {
  fetchInvoiceV2Summary,
  repairInvoiceV2,
} from '@/services/invoice/invoiceV2Admin.service';
import {
  AUTO_RECOVERY_REASON,
  AUTO_RECOVERY_TASKS,
  ATTACH_TO_CASH_COUNT_TASK,
  DEFAULT_TASKS,
  MAX_INVOICE_SUGGESTIONS,
  TASK_DESCRIPTIONS,
  TASK_ORDER,
} from '@/modules/dev/pages/DevTools/InvoiceV2Recovery/constants';

import { formatDateTime, parseTimestamp } from '../utils/time';

interface InvoiceQueryForm {
  businessId?: string;
  invoiceId?: string;
}

interface BusinessRecord {
  id: string;
  name?: string;
  rnc?: string;
  business?: {
    name?: string;
    fantasyName?: string;
    RNC?: string;
    rnc?: string;
  };
}

interface OptionItem {
  value: string;
  label: string;
}

interface InvoiceOptionMeta {
  hasV2: boolean;
  v2Status: string;
  source: string;
  registeredInInvoices: boolean;
  hasDateMismatch: boolean;
  canonicalDate?: unknown;
  v2CreatedAt?: unknown;
}

interface InvoiceOptionEntry extends OptionItem {
  meta: InvoiceOptionMeta;
}

interface InvoiceSummary {
  pending?: number;
  done?: number;
  failed?: number;
}

interface OutboxTask {
  id: string;
  type?: string;
  status?: string;
  attempts?: number;
  updatedAt?: unknown;
  lastError?: string;
}

interface CashCountMeta {
  resolvedCashCountId?: string;
  relinkedAt?: unknown;
  resolvedState?: string;
  intendedCashCountId?: string;
}

interface SnapshotData {
  createdAt?: unknown;
  cashCountIdHint?: string;
  cart?: {
    numberID?: string | number;
    number?: string | number;
    NCF?: string;
    ncf?: string;
    client?: {
      name?: string;
    };
  };
  ncf?: {
    code?: string;
    type?: string;
    status?: string;
  };
  client?: {
    name?: string;
  };
  dueDate?: unknown;
  invoiceComment?: string;
  meta?: {
    cashCount?: CashCountMeta;
  };
  numberID?: string | number;
}

interface LinkedCashCount {
  id: string;
  state?: string;
  number?: string | number;
  opening?: {
    employee?: {
      name?: string;
    };
  };
}

interface StatusTimelineEntry {
  status: string;
  at?: unknown;
}

interface CanonicalInvoiceData {
  data?: Record<string, unknown> | null;
  id?: string;
  date?: unknown;
  createdAt?: unknown;
  numberID?: string | number;
  number?: string | number;
  invoiceNumber?: string | number;
  cashCountId?: string;
  cashCountID?: string;
}

interface CanonicalInvoiceWrapper {
  data?: CanonicalInvoiceData | null;
}

interface InvoiceData {
  summary?: InvoiceSummary;
  canonical?: CanonicalInvoiceWrapper;
  failedTasks?: OutboxTask[];
  invoiceId?: string;
  snapshot?: SnapshotData;
  createdAt?: unknown;
  canonicalDate?: unknown;
  cashCounts?: LinkedCashCount[];
  statusTimeline?: StatusTimelineEntry[];
  numberID?: string | number;
  number?: string | number;
  availableTasks?: string[];
}

interface RepairResult {
  results?: Array<{
    type: string;
    status: string;
    taskId?: string;
    reason?: string;
  }>;
}

interface InvoiceCounterState {
  value: number | null;
  updatedAt: unknown;
}

interface UseIndividualInvoiceRecoveryProps {
  initialBusinessId?: string | null;
  initialInvoiceId?: string | null;
}

const parseCounterNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const useIndividualInvoiceRecovery = ({
  initialBusinessId,
  initialInvoiceId,
}: UseIndividualInvoiceRecoveryProps = {}) => {
  const [form] = Form.useForm<InvoiceQueryForm>();
  const watchedBusinessId = Form.useWatch('businessId', form) as
    | string
    | undefined;

  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [activeQuery, setActiveQuery] = useState<InvoiceQueryForm | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(DEFAULT_TASKS);
  const [reason, setReason] = useState('');
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [businessOptions, setBusinessOptions] = useState<OptionItem[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [invoiceOptions, setInvoiceOptions] = useState<OptionItem[]>([]);
  const [invoiceLookup, setInvoiceLookup] = useState<
    Record<string, InvoiceOptionMeta>
  >({});
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceCounterValue, setInvoiceCounterValue] = useState<number | null>(
    null,
  );
  const [invoiceCounterUpdatedAt, setInvoiceCounterUpdatedAt] =
    useState<unknown>(null);
  const [loadingInvoiceCounter, setLoadingInvoiceCounter] = useState(false);
  const [updatingInvoiceCounter, setUpdatingInvoiceCounter] = useState(false);
  const [updatingInvoiceNumber, setUpdatingInvoiceNumber] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ocurrió un error inesperado.';
  };

  useEffect(() => {
    if (initialBusinessId) {
      form.setFieldsValue({ businessId: initialBusinessId });
    }
  }, [form, initialBusinessId]);

  useEffect(() => {
    if (initialInvoiceId) {
      form.setFieldsValue({ invoiceId: initialInvoiceId });
      setActiveQuery((prev) => ({
        ...(prev ?? {}),
        invoiceId: initialInvoiceId,
        businessId: prev?.businessId || initialBusinessId || null,
      }));
    }
  }, [form, initialInvoiceId, initialBusinessId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingBusinesses(true);
      try {
        const list = (await fbGetBusinessesList()) as BusinessRecord[];
        if (!isMounted) return;
        const options = list.map((item) => {
          const name =
            item?.business?.name ||
            item?.business?.fantasyName ||
            item?.name ||
            item?.id;
          const rnc = item?.business?.RNC || item?.business?.rnc || item?.rnc;
          const label = rnc ? `${name} (${rnc})` : name;
          return { label, value: item.id };
        });
        setBusinessOptions(options);
      } catch (err: unknown) {
        console.error('[useIndividualInvoiceRecovery] load businesses', err);
        message.error(getErrorMessage(err));
      } finally {
        if (isMounted) {
          setLoadingBusinesses(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let aborted = false;
    const fetchInvoices = async () => {
      if (!watchedBusinessId) {
        setInvoiceOptions([]);
        setInvoiceLookup({});
        if (initialInvoiceId) {
          form.setFieldsValue({ invoiceId: initialInvoiceId });
          setActiveQuery((prev) => ({
            ...(prev ?? {}),
            invoiceId: initialInvoiceId,
          }));
        } else {
          form.setFieldsValue({ invoiceId: undefined });
        }
        return;
      }
      setLoadingInvoices(true);
      try {
        const canonicalIds = new Set<string>();
        const canonicalDocs: Record<string, { date?: unknown } | null> = {};
        const canonicalRef = collection(
          db,
          'businesses',
          watchedBusinessId,
          'invoices',
        );
        const canonicalSnap = await getDocs(
          buildQuery(canonicalRef, limit(MAX_INVOICE_SUGGESTIONS)),
        );
        canonicalSnap.docs.forEach((docSnap) => {
          canonicalIds.add(docSnap.id);
          const data = docSnap.data() as { data?: { date?: unknown } } | undefined;
          canonicalDocs[docSnap.id] = data?.data || null;
        });

        const v2Ref = collection(
          db,
          'businesses',
          watchedBusinessId,
          'invoicesV2',
        );
        const v2Snap = await getDocs(
          buildQuery(v2Ref, orderBy('createdAt', 'desc'), limit(MAX_INVOICE_SUGGESTIONS)),
        );
        const entries: InvoiceOptionEntry[] = v2Snap.docs.map((docSnap) => {
          const raw = (docSnap.data() || {}) as Record<string, unknown>;
          const snapshotData = (raw.snapshot as SnapshotData) || {};
          const cart = snapshotData?.cart || (raw.cart as SnapshotData['cart']) || {};
          const invoiceNumber =
            cart?.numberID ?? cart?.number ?? (raw.numberID as string | number | null) ?? null;
          const ncf =
            snapshotData?.ncf?.code || cart?.NCF || cart?.ncf || null;
          const clientName =
            snapshotData?.client?.name || cart?.client?.name || null;
          const invoiceStatus = (raw.status as string | undefined) || 'pending';
          const createdAtSource =
            (raw.createdAt as unknown) || snapshotData?.createdAt || null;
          const canonicalDoc = canonicalDocs[docSnap.id] || null;
          const canonicalDateSource = canonicalDoc?.date || null;
          const v2CreatedAtTs = parseTimestamp(createdAtSource);
          const canonicalDateTs = parseTimestamp(canonicalDateSource);
          const hasCanonical = canonicalIds.has(docSnap.id);
          const hasDateMismatch =
            hasCanonical &&
            Boolean(
              v2CreatedAtTs &&
              canonicalDateTs &&
              canonicalDateTs.toMillis() !== v2CreatedAtTs.toMillis(),
            );
          const labelParts = [];
          const createdAtLabel = formatDateTime(createdAtSource);
          const canonicalLabel = formatDateTime(canonicalDateSource);
          if (createdAtLabel && createdAtLabel !== '—') {
            labelParts.push(createdAtLabel);
          }
          if (invoiceNumber != null) labelParts.push(`#${invoiceNumber}`);
          if (ncf) labelParts.push(`NCF ${ncf}`);
          if (clientName) labelParts.push(clientName);
          if (canonicalLabel && hasDateMismatch) {
            labelParts.push(`Fecha invoices: ${canonicalLabel}`);
          }
          labelParts.push(`[V2 ${invoiceStatus}]`);
          labelParts.push(docSnap.id);
          if (hasCanonical) {
            labelParts.push('CON DOCUMENTO EN invoices');
            if (hasDateMismatch) {
              labelParts.push('FECHA DIFERENTE');
            }
          } else {
            labelParts.push('SIN DOCUMENTO EN invoices');
          }
          return {
            value: docSnap.id,
            label: labelParts.join(' · '),
            meta: {
              hasV2: true,
              v2Status: invoiceStatus,
              source: hasCanonical ? 'v2-and-invoices' : 'v2-only',
              registeredInInvoices: hasCanonical,
              hasDateMismatch,
              canonicalDate: canonicalDateSource || null,
              v2CreatedAt: createdAtSource || null,
            },
          };
        });

        if (aborted) return;
        setInvoiceOptions(entries.map(({ value, label }) => ({ value, label })));
        const lookup: Record<string, InvoiceOptionMeta> = {};
        entries.forEach((entry) => {
          lookup[entry.value] = entry.meta || {};
        });
        setInvoiceLookup(lookup);

        if (initialInvoiceId) {
          const exists = entries.some((entry) => entry.value === initialInvoiceId);
          if (exists) {
            form.setFieldsValue({ invoiceId: initialInvoiceId });
            setActiveQuery((prev) => ({
              ...(prev ?? {}),
              businessId: watchedBusinessId,
              invoiceId: initialInvoiceId,
            }));
          } else {
            form.setFieldsValue({ invoiceId: undefined });
          }
        }
      } catch (err: unknown) {
        if (!aborted) {
          console.error('[useIndividualInvoiceRecovery] load invoices', err);
          message.error(getErrorMessage(err));
          setInvoiceOptions([]);
          setInvoiceLookup({});
        }
      } finally {
        if (!aborted) {
          setLoadingInvoices(false);
        }
      }
    };
    fetchInvoices();
    return () => {
      aborted = true;
    };
  }, [form, initialInvoiceId, watchedBusinessId]);

  const fetchInvoiceCounter = useCallback(
    async (
      targetBusinessId: string | undefined = watchedBusinessId,
    ): Promise<InvoiceCounterState | null> => {
      if (!targetBusinessId) {
        setInvoiceCounterValue(null);
        setInvoiceCounterUpdatedAt(null);
        return null;
      }
      setLoadingInvoiceCounter(true);
      try {
        const counterRef = doc(
          db,
          'businesses',
          targetBusinessId,
          'counters',
          'lastInvoiceId',
        );
        const counterSnap = await getDoc(counterRef);
        if (!counterSnap.exists()) {
          setInvoiceCounterValue(null);
          setInvoiceCounterUpdatedAt(null);
          return null;
        }
        const data = (counterSnap.data() || {}) as Record<string, unknown>;
        const normalizedValue = parseCounterNumber(data.value);
        setInvoiceCounterValue(normalizedValue);
        setInvoiceCounterUpdatedAt(data.updatedAt || data.updated_at || null);
        return { value: normalizedValue, updatedAt: data.updatedAt || null };
      } catch (err: unknown) {
        console.error('[useIndividualInvoiceRecovery] fetch counter', err);
        message.error(getErrorMessage(err));
        setInvoiceCounterValue(null);
        setInvoiceCounterUpdatedAt(null);
        return null;
      } finally {
        setLoadingInvoiceCounter(false);
      }
    },
    [watchedBusinessId],
  );

  useEffect(() => {
    fetchInvoiceCounter(watchedBusinessId);
  }, [fetchInvoiceCounter, watchedBusinessId]);

  const handleFetch = useCallback(async (values: InvoiceQueryForm) => {
    setLoading(true);
    setErrorMessage(null);
    setRepairResult(null);
    try {
      const normalized = {
        businessId: String(values.businessId ?? '').trim(),
        invoiceId: String(values.invoiceId ?? '').trim(),
      };
      const response = await fetchInvoiceV2Summary(normalized);
      setInvoiceData(response as InvoiceData);
      setActiveQuery(normalized);
    } catch (err: unknown) {
      console.error('[useIndividualInvoiceRecovery] fetch error', err);
      setInvoiceData(null);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    (values: InvoiceQueryForm) => {
      if (!values.businessId || !values.invoiceId) {
        message.warning('Completa los campos requeridos.');
        return;
      }
      const meta = values.invoiceId ? invoiceLookup?.[values.invoiceId] : undefined;
      if (meta && meta.hasV2 === false) {
        message.warning(
          'Esta factura pertenece al flujo anterior y no tiene Invoice V2.',
        );
        return;
      }
      handleFetch(values);
    },
    [handleFetch, invoiceLookup],
  );

  const refreshInvoiceCounter = useCallback(() => {
    if (!watchedBusinessId) {
      message.warning('Selecciona un negocio para consultar el contador.');
      return;
    }
    return fetchInvoiceCounter(watchedBusinessId);
  }, [fetchInvoiceCounter, watchedBusinessId]);

  const updateInvoiceCounter = useCallback(
    async (nextValue: unknown) => {
      if (!watchedBusinessId) {
        message.warning('Selecciona un negocio para actualizar el contador.');
        return;
      }
      const parsedValue = parseCounterNumber(nextValue);
      if (!Number.isFinite(parsedValue)) {
        message.warning('Ingresa un número válido para el contador.');
        return;
      }
      setUpdatingInvoiceCounter(true);
      try {
        const counterRef = doc(
          db,
          'businesses',
          watchedBusinessId,
          'counters',
          'lastInvoiceId',
        );
        await setDoc(
          counterRef,
          {
            value: parsedValue,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        message.success('Contador actualizado.');
        await fetchInvoiceCounter(watchedBusinessId);
        return true;
      } catch (err: unknown) {
        console.error('[useIndividualInvoiceRecovery] update counter', err);
        message.error(getErrorMessage(err));
        return false;
      } finally {
        setUpdatingInvoiceCounter(false);
      }
    },
    [fetchInvoiceCounter, watchedBusinessId],
  );

  const runRepairTasks = useCallback(
    async ({
      tasks,
      customReason,
    }: {
      tasks: string[];
      customReason?: string;
    }) => {
      if (!activeQuery) {
        message.warning('Busca una factura antes de reintentar.');
        return;
      }
      if (!Array.isArray(tasks) || !tasks.length) {
        message.warning('Selecciona al menos una tarea para reintentar.');
        return;
      }
      setRepairing(true);
      setRepairResult(null);
      try {
        const trimmedReason =
          typeof customReason === 'string' && customReason.trim()
            ? customReason.trim()
            : undefined;
        const response = await repairInvoiceV2({
          ...activeQuery,
          tasks,
          reason: trimmedReason,
        });
        setRepairResult(response as RepairResult);
        message.success(
          'Tareas reprogramadas. El worker procesará los cambios.',
        );
        await handleFetch(activeQuery);
      } catch (err: unknown) {
        console.error('[useIndividualInvoiceRecovery] repair error', err);
        message.error(getErrorMessage(err));
      } finally {
        setRepairing(false);
      }
    },
    [activeQuery, handleFetch],
  );

  const handleRepair = useCallback(() => {
    runRepairTasks({
      tasks: selectedTasks,
      customReason: reason,
    });
  }, [reason, runRepairTasks, selectedTasks]);

  const invoiceSummary: InvoiceSummary = invoiceData?.summary ?? {};
  const canonicalData = invoiceData?.canonical?.data || null;
  const failedOutboxTasks = Array.isArray(invoiceData?.failedTasks)
    ? invoiceData.failedTasks
    : [];
  const resolvedInvoiceId =
    invoiceData?.invoiceId || activeQuery?.invoiceId || canonicalData?.id || null;
  const snapshot: SnapshotData = invoiceData?.snapshot || {};
  const v2CreatedAtSource =
    invoiceData?.createdAt || snapshot?.createdAt || null;
  const canonicalDateSource =
    invoiceData?.canonicalDate ||
    canonicalData?.date ||
    canonicalData?.createdAt ||
    null;
  const v2CreatedAtTs = parseTimestamp(v2CreatedAtSource);
  const canonicalDateTs = parseTimestamp(canonicalDateSource);
  const hasDateMismatch =
    Boolean(v2CreatedAtTs && canonicalDateTs && canonicalDateTs.toMillis() !== v2CreatedAtTs.toMillis());
  const v2CreatedAtLabel = formatDateTime(v2CreatedAtSource);
  const canonicalDateLabel = formatDateTime(canonicalDateSource);
  const cashCountMeta: CashCountMeta = snapshot?.meta?.cashCount || {};
  const linkedCashCounts = Array.isArray(invoiceData?.cashCounts)
    ? (invoiceData.cashCounts as LinkedCashCount[])
    : [];
  const isCashCountLinked =
    linkedCashCounts.length > 0 ||
    Boolean(
      cashCountMeta?.resolvedCashCountId ||
      cashCountMeta?.relinkedAt ||
      cashCountMeta?.resolvedState,
    );
  const intendedCashCountId =
    cashCountMeta?.intendedCashCountId || snapshot?.cashCountIdHint || null;
  const canonicalCashCountId =
    canonicalData?.cashCountId || canonicalData?.cashCountID || null;
  const resolvedMetaCashCountId =
    cashCountMeta?.resolvedCashCountId || null;
  const resolvedFromLinked = linkedCashCounts.length
    ? linkedCashCounts[0].id
    : null;
  const effectiveResolvedCashCountId =
    resolvedMetaCashCountId ||
    canonicalCashCountId ||
    resolvedFromLinked ||
    null;

  const resolvedInvoiceNumber =
    snapshot?.cart?.numberID ??
    snapshot?.cart?.number ??
    snapshot?.numberID ??
    invoiceData?.numberID ??
    invoiceData?.number ??
    canonicalData?.numberID ??
    canonicalData?.number ??
    null;

  const canonicalInvoiceNumber =
    canonicalData?.numberID ??
    canonicalData?.number ??
    canonicalData?.invoiceNumber ??
    null;

  const shouldWarnInvoiceNumber =
    resolvedInvoiceNumber != null &&
    invoiceCounterValue != null &&
    resolvedInvoiceNumber !== invoiceCounterValue;

  const syncCounterWithInvoiceNumber = useCallback(() => {
    if (resolvedInvoiceNumber == null) {
      message.warning('No se pudo determinar el número de factura para sincronizar.');
      return;
    }
    updateInvoiceCounter(resolvedInvoiceNumber);
  }, [resolvedInvoiceNumber, updateInvoiceCounter]);

  const updateInvoiceNumberEverywhere = useCallback(
    async (nextNumber: unknown) => {
      if (!activeQuery?.businessId || !activeQuery?.invoiceId) {
        message.warning('Busca primero una factura para actualizar su número.');
        return false;
      }
      const parsedNumber = parseCounterNumber(nextNumber);
      if (!Number.isFinite(parsedNumber)) {
        message.warning('Ingresa un número de factura válido.');
        return false;
      }
      setUpdatingInvoiceNumber(true);
      const { businessId, invoiceId } = activeQuery;
      const canonicalRef = doc(
        db,
        'businesses',
        businessId,
        'invoices',
        invoiceId,
      );
      const v2Ref = doc(
        db,
        'businesses',
        businessId,
        'invoicesV2',
        invoiceId,
      );

      const canonicalUpdates = {
        numberID: parsedNumber,
        number: parsedNumber,
        invoiceNumber: parsedNumber,
        'data.numberID': parsedNumber,
        'data.number': parsedNumber,
        'data.invoiceNumber': parsedNumber,
      };

      const v2Updates = {
        numberID: parsedNumber,
        number: parsedNumber,
        invoiceNumber: parsedNumber,
        'snapshot.numberID': parsedNumber,
        'snapshot.number': parsedNumber,
        'snapshot.cart.numberID': parsedNumber,
        'snapshot.cart.number': parsedNumber,
        'snapshot.cart.invoiceNumber': parsedNumber,
        'cart.numberID': parsedNumber,
        'cart.number': parsedNumber,
      };

      try {
        const writes = [];
        if (invoiceData?.canonical) {
          writes.push(updateDoc(canonicalRef, canonicalUpdates));
        } else {
          message.info(
            'No se encontró documento en invoices; se omitió esa actualización.',
          );
        }
        writes.push(updateDoc(v2Ref, v2Updates));
        await Promise.all(writes);
        message.success('Número sincronizado en Invoice V2.');
        await updateInvoiceCounter(parsedNumber);
        await handleFetch(activeQuery);
        return true;
      } catch (err: unknown) {
        console.error('[useIndividualInvoiceRecovery] update number', err);
        message.error(getErrorMessage(err));
        return false;
      } finally {
        setUpdatingInvoiceNumber(false);
      }
    },
    [activeQuery, handleFetch, invoiceData?.canonical, updateInvoiceCounter],
  );

  const availableTaskKeys = useMemo(() => {
    const allowedFromInvoice = Array.isArray(invoiceData?.availableTasks)
      ? invoiceData.availableTasks.filter((task) => TASK_DESCRIPTIONS[task])
      : [];
    if (allowedFromInvoice.length) {
      const allowedSet = new Set(allowedFromInvoice);
      const ordered = TASK_ORDER.filter((task) => allowedSet.has(task));
      return ordered.length ? ordered : allowedFromInvoice;
    }
    return TASK_ORDER;
  }, [invoiceData?.availableTasks]);

  useEffect(() => {
    if (
      isCashCountLinked &&
      selectedTasks.includes(ATTACH_TO_CASH_COUNT_TASK)
    ) {
      setSelectedTasks((prev) =>
        prev.filter((task) => task !== ATTACH_TO_CASH_COUNT_TASK),
      );
    }
  }, [isCashCountLinked, selectedTasks]);

  useEffect(() => {
    setSelectedTasks((prev) => {
      const filtered = prev.filter((task) => availableTaskKeys.includes(task));
      if (filtered.length === prev.length && filtered.length > 0) {
        return prev;
      }
      if (filtered.length > 0) {
        return filtered;
      }
      const defaults = DEFAULT_TASKS.filter((task) =>
        availableTaskKeys.includes(task),
      );
      if (defaults.length > 0) {
        return defaults;
      }
      return availableTaskKeys.length ? [availableTaskKeys[0]] : [];
    });
  }, [availableTaskKeys]);

  const cashCountMismatch =
    intendedCashCountId &&
    effectiveResolvedCashCountId &&
    effectiveResolvedCashCountId !== intendedCashCountId;
  const cashCountMissing = intendedCashCountId && !effectiveResolvedCashCountId;
  const cashCountTimelineIssue = (invoiceData?.statusTimeline || []).some(
    (entry) => entry?.status === 'cash_count_relinked',
  );
  const shouldWarnCashCount =
    cashCountMismatch || cashCountMissing || cashCountTimelineIssue;

  const availableAutoRecoveryTasks = useMemo(() => {
    const availableSet = new Set(availableTaskKeys);
    return AUTO_RECOVERY_TASKS.filter((task) => availableSet.has(task));
  }, [availableTaskKeys]);

  const handleSingleAutoRecovery = useCallback(() => {
    if (!availableAutoRecoveryTasks.length) {
      message.warning('No hay tareas automáticas disponibles para esta factura.');
      return;
    }
    runRepairTasks({
      tasks: availableAutoRecoveryTasks,
      customReason: reason?.trim() || AUTO_RECOVERY_REASON,
    });
  }, [availableAutoRecoveryTasks, reason, runRepairTasks]);

  const showEmptyState = !invoiceData && !loading && !errorMessage;

  return {
    form,
    watchedBusinessId,
    loading,
    errorMessage,
    showEmptyState,
    businessOptions,
    loadingBusinesses,
    invoiceOptions,
    loadingInvoices,
    handleSubmit,
    handleFetch,
    invoiceData,
    summary: invoiceSummary,
    canonicalData,
    failedOutboxTasks,
    resolvedInvoiceId,
    snapshot,
    v2CreatedAtLabel,
    canonicalDateLabel,
    shouldWarnDateMismatch: hasDateMismatch,
    shouldWarnCashCount,
    selectedTasks,
    setSelectedTasks,
    reason,
    setReason,
    handleRepair,
    repairing,
    availableTaskKeys,
    availableAutoRecoveryTasks,
    handleSingleAutoRecovery,
    repairResult,
    linkedCashCounts,
    intendedCashCountId,
    effectiveResolvedCashCountId,
    isCashCountLinked,
    statusTimeline: (invoiceData?.statusTimeline as StatusTimelineEntry[]) || [],
    activeQuery,
    resolvedInvoiceNumber,
    canonicalInvoiceNumber,
    invoiceCounterValue,
    invoiceCounterUpdatedAt,
    loadingInvoiceCounter,
    updatingInvoiceCounter,
    refreshInvoiceCounter,
    syncCounterWithInvoiceNumber,
    updateInvoiceCounter,
    shouldWarnInvoiceNumber,
    updateInvoiceNumberEverywhere,
    updatingInvoiceNumber,
  };
};

