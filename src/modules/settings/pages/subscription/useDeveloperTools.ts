import { useCallback, useMemo, useState } from 'react';
import { notification } from 'antd';
import {
    requestDevAssignSubscription,
    requestDevDeletePlanCatalogDefinition,
    requestDevListPlanCatalog,
    requestDevPreviewPlanCatalogImpact,
    requestDevPublishPlanCatalogVersion,
    requestDevRecordPaymentHistoryItem,
    requestDevUpdatePlanCatalogLifecycle,
    requestDevUpsertPlanCatalogDefinition,
    requestDevUpsertPlanCatalogVersion,
    type BillingOverviewResponse,
} from '@/firebase/billing/billingManagement';
import {
  asRecord,
  parseJsonObject,
  toCleanString,
  validateBooleanMap,
  validateNoticeWindow,
  validateNumberMap,
} from './subscription.utils';
import {
  buildSuggestedEffectiveAt,
  buildSuggestedVersionId,
  findCatalogPlanByCode,
} from './subscriptionVersioning.utils';
import type {
  DevMaintenanceModalKey,
  PlanLifecycleStatus,
  ScopeType,
  UnknownRecord,
} from './subscription.types';

const hasImpactViolations = (preview: UnknownRecord | null): boolean => {
  const root = asRecord(preview);
  const totals = asRecord(root.totals);
  const violations = asRecord(root.violations);

  const hasTotals =
    Object.values(totals).some((value) => Number(value || 0) > 0);
  if (hasTotals) return true;

  return Object.values(violations).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Number(value || 0) > 0;
  });
};

export const useDeveloperTools = (
  isDeveloper: boolean,
  activeBusinessId: string | null,
  overview: BillingOverviewResponse | null,
  handleLoadOverview: () => Promise<void>,
) => {
  const [plans, setPlans] = useState<Array<UnknownRecord>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [devBusy, setDevBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<
    'apply' | 'preview' | 'publish' | 'draft' | null
  >(null);
  const [scope, setScope] = useState<ScopeType>('account');
  const [assignPlanCode, setAssignPlanCode] = useState('');
  const [assignTargetBusinessId, setAssignTargetBusinessId] = useState(activeBusinessId || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(1500);
  const [paymentDescription, setPaymentDescription] = useState('Ajuste manual de pago');
  const [definitionPlanCode, setDefinitionPlanCode] = useState('');
  const [definitionDisplayName, setDefinitionDisplayName] = useState('');
  const [definitionCatalogStatus, setDefinitionCatalogStatus] =
    useState<PlanLifecycleStatus>('active');
  const [definitionIsNew, setDefinitionIsNew] = useState(true);

  const [editorPlanCode, setEditorPlanCode] = useState('');
  const [editorPlanLocked, setEditorPlanLocked] = useState(false);
  const [editorVersionId, setEditorVersionId] = useState('');
  const [editorVersionIdMode, setEditorVersionIdMode] =
    useState<'auto' | 'manual'>('auto');
  const [editorDisplayName, setEditorDisplayName] = useState('');
  const [editorPriceMonthly, setEditorPriceMonthly] = useState<number>(0);
  const [editorNoticeWindowDays, setEditorNoticeWindowDays] = useState<number>(30);
  const [editorEffectiveAt, setEditorEffectiveAt] = useState<string>('');
  const [editorEffectiveAtMode, setEditorEffectiveAtMode] =
    useState<'auto' | 'manual'>('auto');

  const [editorLimitsJson, setEditorLimitsJson] = useState('{}');
  const [editorModulesJson, setEditorModulesJson] = useState('{}');
  const [editorAddonsJson, setEditorAddonsJson] = useState('{}');

  const [impactPreview, setImpactPreview] = useState<UnknownRecord | null>(null);
  const [activeDevModal, setActiveDevModal] = useState<DevMaintenanceModalKey>(null);

  const selectedCatalogPlan = useMemo(
    () => findCatalogPlanByCode(plans, editorPlanCode),
    [editorPlanCode, plans],
  );

  const resolvedEditorEffectiveAt = useMemo(
    () => {
      if (editorNoticeWindowDays === 0) return '';
      return editorEffectiveAtMode === 'manual'
        ? editorEffectiveAt
        : buildSuggestedEffectiveAt(editorNoticeWindowDays);
    },
    [editorEffectiveAt, editorEffectiveAtMode, editorNoticeWindowDays],
  );

  const resolvedEditorVersionId = useMemo(
    () =>
      editorVersionIdMode === 'manual'
        ? editorVersionId
        : buildSuggestedVersionId({
            planCode: editorPlanCode,
            effectiveAt: resolvedEditorEffectiveAt,
            versions: Array.isArray(asRecord(selectedCatalogPlan).versions)
              ? (asRecord(selectedCatalogPlan).versions as Array<UnknownRecord>)
              : [],
          }),
    [editorPlanCode, editorVersionId, editorVersionIdMode, resolvedEditorEffectiveAt, selectedCatalogPlan],
  );

  const loadPlans = useCallback(async () => {
    if (!isDeveloper) return;
    setPlansLoading(true);
    try {
      const data = await requestDevListPlanCatalog();
      const list = Array.isArray(data.plans) ? data.plans : [];
      setPlans(list);
      if (list.length > 0) {
        const firstActivePlanCode = list
          .map((item) => asRecord(item))
          .find((item) => toCleanString(item.catalogStatus) === 'active');
        const fallbackPlanCode = firstActivePlanCode || asRecord(list[0]);
        const nextPlanCode = toCleanString(fallbackPlanCode.planCode);
        if (nextPlanCode) {
          setAssignPlanCode((current) => current || nextPlanCode);
          setEditorPlanCode((current) => current || nextPlanCode);
        }
      }
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo cargar catálogo',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setPlansLoading(false);
  }, [isDeveloper]);



  const handleAssignSubscription = useCallback(async () => {
        if (!overview?.billingAccountId) {
            notification.error({ message: 'Sin billingAccountId', description: 'Debes cargar un negocio con cuenta de facturación.' });
            return;
        }
        setDevBusy(true);
        try {
            await requestDevAssignSubscription({
                billingAccountId: overview.billingAccountId,
                planCode: assignPlanCode,
                scope,
                targetBusinessId: scope === 'business' ? assignTargetBusinessId : undefined,
                provider: 'cardnet',
                status: 'active',
            });
            notification.success({ message: 'Suscripción asignada', description: 'El snapshot fue actualizado.' });
            await handleLoadOverview();
            await loadPlans();
        } catch (error: unknown) {
            notification.error({ message: 'No se pudo asignar suscripción', description: error instanceof Error ? error.message : 'Error inesperado.' });
        }
        setDevBusy(false);
  }, [assignPlanCode, assignTargetBusinessId, handleLoadOverview, loadPlans, overview, scope]);

  const handleRecordPayment = useCallback(async () => {
        if (!overview?.billingAccountId) {
            notification.error({ message: 'Sin billingAccountId', description: 'Debes cargar un negocio con cuenta de facturación.' });
            return;
        }
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            notification.error({ message: 'Monto inválido', description: 'El monto debe ser mayor que cero.' });
            return;
        }
        setDevBusy(true);
        try {
            await requestDevRecordPaymentHistoryItem({
                billingAccountId: overview.billingAccountId,
                amount: paymentAmount,
                provider: 'cardnet',
                status: 'paid',
                description: paymentDescription,
            });
            notification.success({ message: 'Pago registrado', description: 'Se agregó al historial de pagos.' });
            await handleLoadOverview();
        } catch (error: unknown) {
            notification.error({ message: 'No se pudo registrar pago', description: error instanceof Error ? error.message : 'Error inesperado.' });
        }
        setDevBusy(false);
  }, [handleLoadOverview, overview, paymentAmount, paymentDescription]);

  const handleEditorVersionIdChange = useCallback((value: string) => {
    setEditorVersionId(value);
    setEditorVersionIdMode('manual');
  }, []);

  const resetEditorVersionIdToAuto = useCallback(() => {
    setEditorVersionId('');
    setEditorVersionIdMode('auto');
  }, []);

  const handleEditorEffectiveAtChange = useCallback((value: string) => {
    setEditorEffectiveAt(value);
    setEditorEffectiveAtMode('manual');
  }, []);

  const resetEditorEffectiveAtToAuto = useCallback(() => {
    setEditorEffectiveAt('');
    setEditorEffectiveAtMode('auto');
  }, []);

  const buildPlanEditorPayload = useCallback(() => {
    const limits = parseJsonObject(editorLimitsJson, 'limits');
    const modules = parseJsonObject(editorModulesJson, 'modules');
    const addons = parseJsonObject(editorAddonsJson, 'addons');

    validateNumberMap(limits, 'limits');
    validateBooleanMap(modules, 'modules');
    validateBooleanMap(addons, 'addons');
    validateNoticeWindow(editorNoticeWindowDays);

    return {
      displayName: toCleanString(editorDisplayName) || editorPlanCode.toUpperCase(),
      priceMonthly: Number(editorPriceMonthly || 0),
      currency: 'DOP',
      noticeWindowDays: editorNoticeWindowDays,
      effectiveAt: resolvedEditorEffectiveAt,
      state: 'draft',
      limits,
      modules,
      addons,
    };
  }, [
    editorAddonsJson,
    editorDisplayName,
    editorLimitsJson,
    editorModulesJson,
    editorNoticeWindowDays,
    editorPlanCode,
    editorPriceMonthly,
    resolvedEditorEffectiveAt,
  ]);

  const handlePreviewImpact = useCallback(async () => {
    setDevBusy(true);
    setBusyAction('preview');
    try {
      const payload = buildPlanEditorPayload();
      const result = await requestDevPreviewPlanCatalogImpact({
        planCode: editorPlanCode,
        payload: { limits: payload.limits },
      });
      setImpactPreview(asRecord(result));
      notification.success({
        message: 'Preflight completado',
        description: 'Se evaluó impacto con los límites propuestos.',
      });
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo ejecutar preflight',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
    setBusyAction(null);
  }, [buildPlanEditorPayload, editorPlanCode]);

  const runImpactPreview = useCallback(async () => {
    const payload = buildPlanEditorPayload();
    const result = await requestDevPreviewPlanCatalogImpact({
      planCode: editorPlanCode,
      payload: { limits: payload.limits },
    });
    const preview = asRecord(result);
    setImpactPreview(preview);
    return preview;
  }, [buildPlanEditorPayload, editorPlanCode]);

  const handleSaveDraftVersion = useCallback(async () => {
    setDevBusy(true);
    setBusyAction('draft');
    try {
      const payload = buildPlanEditorPayload();
      const resolvedVersionId = toCleanString(resolvedEditorVersionId);
      const response = await requestDevUpsertPlanCatalogVersion({
        planCode: editorPlanCode,
        versionId: resolvedVersionId || undefined,
        payload,
      });
      const savedVersionId = toCleanString(response.versionId) || resolvedVersionId || '';
      if (savedVersionId) {
        setEditorVersionId(savedVersionId);
        setEditorVersionIdMode('manual');
      }
      notification.success({
        message: 'Versión guardada',
        description: `Plan ${editorPlanCode} en draft actualizado.`,
      });
      await loadPlans();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo guardar versión',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
    setBusyAction(null);
  }, [buildPlanEditorPayload, editorPlanCode, loadPlans, resolvedEditorVersionId]);

  const handlePublishVersion = useCallback(async () => {
    const versionId = toCleanString(resolvedEditorVersionId);
    if (!versionId) {
      notification.error({
        message: 'versionId requerido',
        description: 'No se pudo resolver el ID de versión para publicar.',
      });
      return;
    }
    setDevBusy(true);
    setBusyAction('publish');
    try {
      validateNoticeWindow(editorNoticeWindowDays);
      const response = await requestDevPublishPlanCatalogVersion({
        planCode: editorPlanCode,
        versionId,
        effectiveAt: resolvedEditorEffectiveAt,
        noticeWindowDays: editorNoticeWindowDays as 0 | 7 | 15 | 30 | 90,
      });
      const delivered = Number(response.notifications?.delivered || 0);
      const recipientCount = Number(response.notifications?.recipientCount || 0);
      notification.success({
        message: 'Versión publicada',
        description:
          recipientCount > 0
            ? `Plan ${editorPlanCode} programado correctamente. Correos enviados: ${delivered}/${recipientCount}.`
            : `Plan ${editorPlanCode} programado correctamente.`,
      });
      await loadPlans();
      await handleLoadOverview();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo publicar versión',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
    setBusyAction(null);
  }, [
    editorNoticeWindowDays,
    editorPlanCode,
    handleLoadOverview,
    loadPlans,
    resolvedEditorEffectiveAt,
    resolvedEditorVersionId,
  ]);

  const handleApplyVersionNow = useCallback(async () => {
    setDevBusy(true);
    setBusyAction('apply');
    try {
      const preview = await runImpactPreview();
      if (hasImpactViolations(preview)) {
        notification.warning({
          message: 'Cambios bloqueados por impacto',
          description:
            'El preflight detectó violaciones en negocios existentes. Corrige los límites antes de aplicar.',
        });
        return;
      }

      const payload = buildPlanEditorPayload();
      const resolvedVersionId = toCleanString(resolvedEditorVersionId);
      const response = await requestDevUpsertPlanCatalogVersion({
        planCode: editorPlanCode,
        versionId: resolvedVersionId || undefined,
        payload,
      });
      const savedVersionId =
        toCleanString(response.versionId) || resolvedVersionId || '';
      if (!savedVersionId) {
        throw new Error('No se pudo resolver versionId para publicar.');
      }

      setEditorVersionId(savedVersionId);
      setEditorVersionIdMode('manual');

      const publishResponse = await requestDevPublishPlanCatalogVersion({
        planCode: editorPlanCode,
        versionId: savedVersionId,
        effectiveAt: resolvedEditorEffectiveAt,
        noticeWindowDays: editorNoticeWindowDays as 0 | 7 | 15 | 30 | 90,
      });

      const delivered = Number(publishResponse.notifications?.delivered || 0);
      const recipientCount = Number(publishResponse.notifications?.recipientCount || 0);
      notification.success({
        message: 'Cambios aplicados',
        description:
          recipientCount > 0
            ? `Plan ${editorPlanCode} publicado. Correos enviados: ${delivered}/${recipientCount}.`
            : `Plan ${editorPlanCode} publicado inmediatamente.`,
      });

      await loadPlans();
      await handleLoadOverview();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudieron aplicar los cambios',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
    setBusyAction(null);
  }, [
    buildPlanEditorPayload,
    editorNoticeWindowDays,
    editorPlanCode,
    handleLoadOverview,
    loadPlans,
    resolvedEditorEffectiveAt,
    resolvedEditorVersionId,
    runImpactPreview,
  ]);

  const handleSavePlanDefinition = useCallback(async () => {
    const planCode = toCleanString(definitionPlanCode);
    if (!planCode) {
      notification.error({
        message: 'Código requerido',
        description: 'Debes indicar un código para la suscripción base.',
      });
      return;
    }
    setDevBusy(true);
    try {
      await requestDevUpsertPlanCatalogDefinition({
        planCode,
        payload: {
          displayName: toCleanString(definitionDisplayName) || planCode.toUpperCase(),
          catalogStatus: definitionCatalogStatus,
        },
      });
      notification.success({
        message: definitionIsNew ? 'Suscripción creada' : 'Suscripción actualizada',
        description: `${planCode} quedó lista para administrar sus versiones.`,
      });
      await loadPlans();
      setDefinitionIsNew(false);
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo guardar la suscripción',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
  }, [definitionCatalogStatus, definitionDisplayName, definitionIsNew, definitionPlanCode, loadPlans]);

  const handleUpdatePlanLifecycle = useCallback(async ({
    planCode,
    lifecycleStatus,
    versionId,
  }: {
    planCode: string;
    lifecycleStatus: PlanLifecycleStatus;
    versionId?: string;
  }) => {
    setDevBusy(true);
    try {
      await requestDevUpdatePlanCatalogLifecycle({
        planCode,
        lifecycleStatus,
        versionId,
      });
      notification.success({
        message: versionId ? 'Versión actualizada' : 'Suscripción actualizada',
        description: versionId
          ? `${planCode}/${versionId} quedó en estado ${lifecycleStatus}.`
          : `${planCode} quedó en estado ${lifecycleStatus}.`,
      });
      await loadPlans();
      await handleLoadOverview();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo actualizar el estado',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
  }, [handleLoadOverview, loadPlans]);

  const handleDeletePlanDefinition = useCallback(async (planCode: string) => {
    setDevBusy(true);
    try {
      const response = await requestDevDeletePlanCatalogDefinition({ planCode });
      const deletedVersions = Number(response.deletedVersions || 0);
      notification.success({
        message: 'Suscripción eliminada',
        description:
          deletedVersions > 0
            ? `${planCode} fue eliminada junto con ${deletedVersions} versiones.`
            : `${planCode} fue eliminada por completo.`,
      });
      await loadPlans();
      await handleLoadOverview();
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo eliminar la suscripción',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    }
    setDevBusy(false);
  }, [handleLoadOverview, loadPlans]);

  const planOptions = useMemo(
    () =>
      plans
        .map((item) => asRecord(item))
        .filter((item) => toCleanString(item.catalogStatus) === 'active')
        .map((item) => {
          const planCode = toCleanString(item.planCode);
          if (!planCode) return null;
          const displayName = toCleanString(item.displayName) || planCode.toUpperCase();
          return { label: `${displayName} (${planCode})`, value: planCode };
        })
        .filter((item): item is { label: string; value: string } => Boolean(item)),
    [plans],
  );

  const catalogPlanOptions = useMemo(
    () =>
      plans
        .map((item) => asRecord(item))
        .map((item) => {
          const planCode = toCleanString(item.planCode);
          if (!planCode) return null;
          const displayName = toCleanString(item.displayName) || planCode.toUpperCase();
          return { label: `${displayName} (${planCode})`, value: planCode };
        })
        .filter((item): item is { label: string; value: string } => Boolean(item)),
    [plans],
  );

  const openDevModal = useCallback(
    (modal: Exclude<DevMaintenanceModalKey, null>) => setActiveDevModal(modal),
    [],
  );
  const closeDevModal = useCallback(() => setActiveDevModal(null), []);

  return {
    plans,
    plansLoading,
    devBusy,
    busyAction,
    scope,
    setScope,
    assignPlanCode,
    setAssignPlanCode,
    assignTargetBusinessId,
    setAssignTargetBusinessId,
    paymentAmount,
    setPaymentAmount,
    definitionPlanCode,
    setDefinitionPlanCode,
    definitionDisplayName,
    setDefinitionDisplayName,
    definitionCatalogStatus,
    setDefinitionCatalogStatus,
    definitionIsNew,
    setDefinitionIsNew,
    paymentDescription,
    setPaymentDescription,
    editorPlanCode,
    setEditorPlanCode,
    editorPlanLocked,
    setEditorPlanLocked,
    editorVersionId: resolvedEditorVersionId,
    editorVersionIdMode,
    setEditorVersionIdMode,
    handleEditorVersionIdChange,
    resetEditorVersionIdToAuto,
    editorDisplayName,
    setEditorDisplayName,
    editorPriceMonthly,
    setEditorPriceMonthly,
    editorNoticeWindowDays,
    setEditorNoticeWindowDays,
    editorEffectiveAt: resolvedEditorEffectiveAt,
    editorEffectiveAtMode,
    setEditorEffectiveAtMode,
    handleEditorEffectiveAtChange,
    resetEditorEffectiveAtToAuto,
    editorLimitsJson,
    setEditorLimitsJson,
    editorModulesJson,
    setEditorModulesJson,
    editorAddonsJson,
    setEditorAddonsJson,
    impactPreview,
    activeDevModal,
    openDevModal,
    closeDevModal,
    planOptions,
    catalogPlanOptions,
    handleAssignSubscription,
    handleRecordPayment,
    handlePreviewImpact,
    handleSaveDraftVersion,
    handlePublishVersion,
    handleApplyVersionNow,
    handleSavePlanDefinition,
    handleUpdatePlanLifecycle,
    handleDeletePlanDefinition,
    loadPlans,
  };
};
