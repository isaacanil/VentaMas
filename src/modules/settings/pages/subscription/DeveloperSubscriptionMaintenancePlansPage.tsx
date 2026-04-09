import {
  faBox,
  faBoxArchive,
  faCheck,
  faCircleInfo,
  faClockRotateLeft,
  faCopy,
  faEllipsisVertical,
  faFileInvoice,
  faFlaskVial,
  faInfinity,
  faLayerGroup,
  faPen,
  faPlus,
  faSliders,
  faStore,
  faTrash,
  faUsers,
  faWrench,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, Modal, Spin, Tooltip } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { useDeveloperSubscriptionMaintenanceContext } from './useDeveloperSubscriptionMaintenanceContext';
import { DeveloperFieldCatalogModal } from './components/DeveloperFieldCatalogModal';
import { ENTITLEMENT_LABELS, normalizeSubscriptionEntitlements } from './subscriptionEntitlements';
import {
  asRecord,
  formatDate,
  toCleanString,
  toFiniteNumber,
  toMillis,
} from './subscription.utils';
import type { UnknownRecord } from './subscription.types';

const PREVIEW_LIMIT_KEYS: Array<{
  key: string;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: 'maxBusinesses', label: 'Negocios', icon: <FontAwesomeIcon icon={faStore} /> },
  { key: 'maxUsers', label: 'Usuarios', icon: <FontAwesomeIcon icon={faUsers} /> },
  { key: 'maxProducts', label: 'Productos', icon: <FontAwesomeIcon icon={faBox} /> },
  { key: 'maxMonthlyInvoices', label: 'Facturas/mes', icon: <FontAwesomeIcon icon={faFileInvoice} /> },
];

const formatPrice = (amount: number | null): string => {
  if (!amount) return 'Gratis';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatLimitValue = (value: unknown): React.ReactNode => {
  const num = toFiniteNumber(value);
  if (num === null) return <Muted>—</Muted>;
  if (num < 0) return <FontAwesomeIcon icon={faInfinity} style={{ color: '#0f766e' }} />;
  return num.toLocaleString('es-DO');
};

const getBadgeLabel = (status: string | null) => {
  if (status === 'active') return 'Activa';
  if (status === 'deprecated') return 'Deprecada';
  if (status === 'retired') return 'Retirada';
  if (status === 'scheduled') return 'Programada';
  if (status === 'draft') return 'Borrador';
  return status || 'Sin estado';
};

const getEnabledEntitlements = (source: UnknownRecord) =>
  Object.entries(source).filter(([, value]) => value === true);

const truncateVersionId = (id: string): string => {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
};

const PlanTooltipContent = ({
  limits,
  allEntitlements,
}: {
  limits: UnknownRecord;
  allEntitlements: [string, unknown][];
}) => (
  <TooltipContent>
    <TooltipSectionTitle>Límites</TooltipSectionTitle>
    <TooltipRows>
      {PREVIEW_LIMIT_KEYS.map(({ key, label, icon }) => (
        <TooltipRow key={key}>
          <TooltipRowIcon>{icon}</TooltipRowIcon>
          <TooltipRowLabel>{label}</TooltipRowLabel>
          <TooltipRowValue>{formatLimitValue(limits[key])}</TooltipRowValue>
        </TooltipRow>
      ))}
    </TooltipRows>
    {allEntitlements.length > 0 && (
      <>
        <TooltipDivider />
        <TooltipSectionTitle>Módulos habilitados</TooltipSectionTitle>
        <TooltipModuleList>
          {allEntitlements.map(([key]) => (
            <TooltipModuleItem key={key}>
              <FontAwesomeIcon icon={faCheck} />
              {ENTITLEMENT_LABELS[key] ?? key}
            </TooltipModuleItem>
          ))}
        </TooltipModuleList>
      </>
    )}
  </TooltipContent>
);

interface VersionRowProps {
  planCode: string;
  version: UnknownRecord;
  onEditVersion: (version: UnknownRecord) => void;
  onRetireVersion: (versionId: string) => void;
}

const VersionRow = ({
  planCode,
  version,
  onEditVersion,
  onRetireVersion,
}: VersionRowProps) => {
  const versionId =
    toCleanString(version.versionId) ?? toCleanString(version.version) ?? 'sin-id';
  const state = toCleanString(version.state) ?? 'draft';
  const effectiveAt = toMillis(version.effectiveAt);
  const priceMonthly = toFiniteNumber(version.priceMonthly);

  return (
    <VersionRowContainer>
      <VersionRowMain>
        <VersionIdentity>
          <VersionCode>{versionId}</VersionCode>
          <StatusBadge $status={state}>{getBadgeLabel(state)}</StatusBadge>
        </VersionIdentity>
        <VersionMeta>
          <span>{formatPrice(priceMonthly)}</span>
          <span>
            {effectiveAt ? `Vigencia: ${formatDate(effectiveAt)}` : 'Sin fecha efectiva'}
          </span>
        </VersionMeta>
      </VersionRowMain>

      <VersionFooterRow>
        <VersionHint>{planCode}</VersionHint>
        <VersionActions>
          {state === 'draft' || state === 'scheduled' ? (
            <Button size="small" onClick={() => onEditVersion(version)}>
              Editar
            </Button>
          ) : null}
          {state === 'deprecated' ? (
            <Button
              size="small"
              danger
              onClick={() => onRetireVersion(versionId)}
            >
              Retirar versión
            </Button>
          ) : null}
        </VersionActions>
      </VersionFooterRow>
    </VersionRowContainer>
  );
};

interface PlanDetailModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  planCode: string;
  catalogStatus: string;
  currentPrice: number | null;
  limits: UnknownRecord;
  moduleEntries: [string, unknown][];
  addonEntries: [string, unknown][];
}

const PlanDetailModal = ({
  open,
  onClose,
  displayName,
  planCode,
  catalogStatus,
  currentPrice,
  limits,
  moduleEntries,
  addonEntries,
}: PlanDetailModalProps) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    title={
      <DetailModalTitle>
        <span>{displayName}</span>
        <StatusBadge $status={catalogStatus}>{getBadgeLabel(catalogStatus)}</StatusBadge>
      </DetailModalTitle>
    }
    width={560}
  >
    <DetailModalBody>
      <DetailSection>
        <DetailSectionTitle>Precio</DetailSectionTitle>
        <DetailPrice>
          {formatPrice(currentPrice)}
          {currentPrice ? <DetailPricePeriod>/mes</DetailPricePeriod> : null}
        </DetailPrice>
      </DetailSection>

      <DetailSection>
        <DetailSectionTitle>Límites</DetailSectionTitle>
        <DetailLimitsGrid>
          {PREVIEW_LIMIT_KEYS.map(({ key, label, icon }) => (
            <DetailLimitItem key={key}>
              <DetailLimitIcon>{icon}</DetailLimitIcon>
              <DetailLimitLabel>{label}</DetailLimitLabel>
              <DetailLimitValue>{formatLimitValue(limits[key])}</DetailLimitValue>
            </DetailLimitItem>
          ))}
        </DetailLimitsGrid>
      </DetailSection>

      {moduleEntries.length > 0 && (
        <DetailSection>
          <DetailSectionTitle>Módulos habilitados</DetailSectionTitle>
          <DetailChipGrid>
            {moduleEntries.map(([key]) => (
              <DetailChip key={key} $variant="module">
                <FontAwesomeIcon icon={faCheck} />
                {ENTITLEMENT_LABELS[key] ?? key}
              </DetailChip>
            ))}
          </DetailChipGrid>
        </DetailSection>
      )}

      {addonEntries.length > 0 && (
        <DetailSection>
          <DetailSectionTitle>Add-ons</DetailSectionTitle>
          <DetailChipGrid>
            {addonEntries.map(([key]) => (
              <DetailChip key={key} $variant="addon">
                <FontAwesomeIcon icon={faCheck} />
                {ENTITLEMENT_LABELS[key] ?? key}
              </DetailChip>
            ))}
          </DetailChipGrid>
        </DetailSection>
      )}

      {moduleEntries.length === 0 && addonEntries.length === 0 && (
        <EmptyInline>Sin módulos ni add-ons configurados.</EmptyInline>
      )}
    </DetailModalBody>
  </Modal>
);

interface PlanCardProps {
  plan: UnknownRecord;
  onEditDefinition: (plan: UnknownRecord) => void;
  onNewVersion: (plan: UnknownRecord) => void;
  onEditVersion: (version: UnknownRecord) => void;
  onUpdateLifecycle: (input: {
    planCode: string;
    lifecycleStatus: 'active' | 'deprecated' | 'retired';
    versionId?: string;
  }) => Promise<void>;
  onDeleteDefinition: (planCode: string) => Promise<void>;
}

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  planCode: string;
  versionItems: UnknownRecord[];
  onEditVersion: (version: UnknownRecord) => void;
  onUpdateLifecycle: (input: {
    planCode: string;
    lifecycleStatus: 'active' | 'deprecated' | 'retired';
    versionId?: string;
  }) => Promise<void>;
}

const VersionHistoryModal = ({
  open,
  onClose,
  planCode,
  versionItems,
  onEditVersion,
  onUpdateLifecycle,
}: VersionHistoryModalProps) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    title={`Historial de versiones · ${planCode}`}
    width={560}
  >
    <ModalVersionList>
      {versionItems.length > 0 ? (
        versionItems.map((version) => {
          const versionId =
            toCleanString(version.versionId) ?? toCleanString(version.version);
          if (!versionId) return null;
          return (
            <VersionRow
              key={versionId}
              planCode={planCode}
              version={version}
              onEditVersion={onEditVersion}
              onRetireVersion={(targetVersionId) =>
                void onUpdateLifecycle({
                  planCode,
                  versionId: targetVersionId,
                  lifecycleStatus: 'retired',
                })
              }
            />
          );
        })
      ) : (
        <EmptyInline>Sin versiones cargadas.</EmptyInline>
      )}
    </ModalVersionList>
  </Modal>
);

const PlanCard = ({
  plan,
  onEditDefinition,
  onNewVersion,
  onEditVersion,
  onUpdateLifecycle,
  onDeleteDefinition,
}: PlanCardProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const record = asRecord(plan);
  const planCode = toCleanString(record.planCode) ?? '(sin código)';
  const displayName = toCleanString(record.displayName) ?? planCode.toUpperCase();
  const catalogStatus = toCleanString(record.catalogStatus) ?? 'active';
  const isSystemBuiltin = record.isSystemBuiltin === true;
  const currentVersion = asRecord(record.currentVersion);
  const limits = asRecord(currentVersion.limits);
  const entitlements = normalizeSubscriptionEntitlements(currentVersion);
  const versionItems = Array.isArray(record.versions)
    ? record.versions.map((item) => asRecord(item))
    : [];
  const versionCount = toFiniteNumber(record.versionCount) ?? versionItems.length;
  const moduleEntries = getEnabledEntitlements(entitlements.modules);
  const addonEntries = getEnabledEntitlements(entitlements.addons);
  const currentVersionId =
    toCleanString(currentVersion.versionId) ?? toCleanString(currentVersion.version);
  const currentPrice = toFiniteNumber(currentVersion.priceMonthly);
  const allEntitlements = [...moduleEntries, ...addonEntries];

  const handleCopy = () => {
    if (!currentVersionId) return;
    void navigator.clipboard.writeText(currentVersionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const menuItems: {
    key: string;
    label: string;
    danger?: boolean;
    icon?: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      key: 'edit',
      label: 'Editar base',
      icon: <FontAwesomeIcon icon={faPen} />,
      onClick: () => onEditDefinition(record),
    },
    {
      key: 'new-version',
      label: 'Nueva versión',
      icon: <FontAwesomeIcon icon={faPlus} />,
      onClick: () => onNewVersion(record),
    },
  ];
  if (catalogStatus === 'active') {
    menuItems.push({
      key: 'deprecate',
      label: 'Deprecar base',
      icon: <FontAwesomeIcon icon={faBoxArchive} />,
      onClick: () => void onUpdateLifecycle({ planCode, lifecycleStatus: 'deprecated' }),
    });
  }
  if (catalogStatus !== 'retired') {
    menuItems.push({
      key: 'retire',
      label: 'Retirar base',
      danger: true,
      icon: <FontAwesomeIcon icon={faXmark} />,
      onClick: () => void onUpdateLifecycle({ planCode, lifecycleStatus: 'retired' }),
    });
  }
  if (catalogStatus === 'retired' && !isSystemBuiltin) {
    menuItems.push({
      key: 'delete',
      label: 'Eliminar definitivo',
      danger: true,
      icon: <FontAwesomeIcon icon={faTrash} />,
      onClick: () =>
        Modal.confirm({
          title: 'Eliminar suscripción definitivamente',
          content:
            'Solo se eliminará si no tiene historial, referencias activas ni es un plan default hardcodeado.',
          okText: 'Eliminar',
          cancelText: 'Cancelar',
          okButtonProps: { danger: true },
          onOk: () => onDeleteDefinition(planCode),
        }),
    });
  }
  if (isSystemBuiltin) {
    menuItems.push({
      key: 'builtin-info',
      label: 'Builtin del sistema',
      icon: <FontAwesomeIcon icon={faCircleInfo} />,
      onClick: () =>
        Modal.info({
          title: 'Plan builtin',
          content:
            'Este plan está marcado como builtin del sistema en Firestore y no puede eliminarse definitivamente desde el panel.',
        }),
    });
  }

  return (
    <Tooltip
      title={<PlanTooltipContent limits={limits} allEntitlements={allEntitlements} />}
      placement="right"
      overlayStyle={{ maxWidth: 340 }}
    >
    <Card>
      <CardMeta>
        <PlanCode>{planCode}</PlanCode>
        <StatusBadge $status={catalogStatus}>{getBadgeLabel(catalogStatus)}</StatusBadge>
      </CardMeta>

      <CardNamePrice>
        <PlanName>{displayName}</PlanName>
        <PriceRow>
          <PriceAmount>{formatPrice(currentPrice)}</PriceAmount>
          {currentPrice ? <PricePeriod>/mes</PricePeriod> : null}
        </PriceRow>
      </CardNamePrice>

      <Divider />

      <CardFooter>
        <FooterLeft>
          {currentVersionId ? (
            <VersionIdChip>
              <VersionIdText>{truncateVersionId(currentVersionId)}</VersionIdText>
              <CopyButton onClick={handleCopy} title="Copiar ID completo">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              </CopyButton>
            </VersionIdChip>
          ) : (
            <VersionIdEmpty>Sin versión vigente</VersionIdEmpty>
          )}
        </FooterLeft>
        <FooterRight>
          {(versionItems.length > 0 || versionCount > 0) && (
            <HistoryLink onClick={() => setHistoryOpen(true)}>
              <FontAwesomeIcon icon={faClockRotateLeft} />
              {versionCount} {versionCount === 1 ? 'versión' : 'versiones'}
            </HistoryLink>
          )}
          <InfoButton onClick={() => setDetailOpen(true)} title="Ver detalle del plan">
            <FontAwesomeIcon icon={faCircleInfo} />
          </InfoButton>
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <CardMenuButton icon={<FontAwesomeIcon icon={faEllipsisVertical} />} size="small" />
          </Dropdown>
        </FooterRight>
      </CardFooter>

      <VersionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        planCode={planCode}
        versionItems={versionItems}
        onEditVersion={(version) => {
          setHistoryOpen(false);
          onEditVersion(version);
        }}
        onUpdateLifecycle={onUpdateLifecycle}
      />
      <PlanDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        displayName={displayName}
        planCode={planCode}
        catalogStatus={catalogStatus}
        currentPrice={currentPrice}
        limits={limits}
        moduleEntries={moduleEntries}
        addonEntries={addonEntries}
      />
    </Card>
    </Tooltip>
  );
};

const DeveloperSubscriptionMaintenancePlansPage = () => {
  const {
    plans = [],
    plansLoading,
    loadPlans,
    openDefinitionForPlan,
    openVersioningForPlan,
    updatePlanLifecycle,
    deletePlanDefinition,
    fieldCatalog,
    saveFieldCatalog,
    openDevModal,
  } = useDeveloperSubscriptionMaintenanceContext();

  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <>
      <PageContent>
      <PageHeader>
        <HeaderText>
          <PageTitle>
            <TitleIcon>
              <FontAwesomeIcon icon={faLayerGroup} />
            </TitleIcon>
            Mantenimiento de Suscripciones
          </PageTitle>
        </HeaderText>
        <HeaderActions>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'sandbox-checkout',
                  icon: <FontAwesomeIcon icon={faFlaskVial} />,
                  label: 'Simular checkout',
                  onClick: () => openDevModal('sandbox-checkout'),
                },
                {
                  key: 'sandbox-flow',
                  icon: <FontAwesomeIcon icon={faFlaskVial} />,
                  label: 'Escenarios mock',
                  onClick: () => openDevModal('sandbox-flow'),
                },
                {
                  key: 'assignment',
                  icon: <FontAwesomeIcon icon={faWrench} />,
                  label: 'Asignación de suscripción',
                  onClick: () => openDevModal('assignment'),
                },
                {
                  key: 'payment',
                  icon: <FontAwesomeIcon icon={faClockRotateLeft} />,
                  label: 'Historial manual de pago',
                  onClick: () => openDevModal('payment'),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button icon={<FontAwesomeIcon icon={faWrench} />}>Herramientas</Button>
          </Dropdown>
          <Button
            icon={<FontAwesomeIcon icon={faSliders} />}
            onClick={() => setCatalogOpen(true)}
          >
            Catálogo de campos
          </Button>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => openDefinitionForPlan(null)}
          >
            Suscripción
          </Button>
        </HeaderActions>
      </PageHeader>

      {plansLoading && plans.length === 0 ? (
        <LoadingContainer>
          <Spin size="large" />
          <LoadingText>Cargando catálogo…</LoadingText>
        </LoadingContainer>
      ) : plans.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FontAwesomeIcon icon={faLayerGroup} />
          </EmptyIcon>
          <EmptyTitle>Sin suscripciones configuradas</EmptyTitle>
          <EmptyDesc>
            Primero crea la suscripción base y luego agrega su primera versión.
          </EmptyDesc>
          <Button type="primary" onClick={() => openDefinitionForPlan(null)}>
            Crear suscripción base
          </Button>
        </EmptyState>
      ) : (
        <PlansGrid>
          {plans.map((plan) => {
            const record = asRecord(plan);
            const planCode = toCleanString(record.planCode);
            if (!planCode) return null;
            return (
              <PlanCard
                key={planCode}
                plan={record}
                onEditDefinition={openDefinitionForPlan}
                onNewVersion={(targetPlan) => openVersioningForPlan(targetPlan)}
                onEditVersion={(version) =>
                  openVersioningForPlan(version, { preserveVersionId: true })
                }
                onUpdateLifecycle={updatePlanLifecycle}
                onDeleteDefinition={deletePlanDefinition}
              />
            );
          })}
        </PlansGrid>
      )}
      </PageContent>

      <DeveloperFieldCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        fieldCatalog={fieldCatalog}
        onSave={saveFieldCatalog}
      />
    </>
  );
};

export default DeveloperSubscriptionMaintenancePlansPage;

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 720px;
`;

const TitleIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgb(13 148 136 / 10%);
  color: #0f766e;
  font-size: 14px;
  margin-right: 10px;
  flex-shrink: 0;
  vertical-align: middle;
`;

const PageTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  display: flex;
  align-items: center;
`;



const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(15 23 42 / 4%);
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const PlanCode = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 9px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(p) => {
    if (p.$status === 'active') return 'rgb(13 148 136 / 10%)';
    if (p.$status === 'deprecated') return 'rgb(245 158 11 / 12%)';
    if (p.$status === 'retired') return 'rgb(239 68 68 / 10%)';
    if (p.$status === 'scheduled') return 'rgb(59 130 246 / 10%)';
    return 'rgb(148 163 184 / 12%)';
  }};
  color: ${(p) => {
    if (p.$status === 'active') return '#0f766e';
    if (p.$status === 'deprecated') return '#b45309';
    if (p.$status === 'retired') return '#b91c1c';
    if (p.$status === 'scheduled') return '#1d4ed8';
    return '#475569';
  }};
`;

const CardNamePrice = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const CardMenuButton = styled(Button)`
  flex-shrink: 0;
  color: #94a3b8;

  &:hover {
    color: #0f172a !important;
  }
`;

const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
`;

const PriceAmount = styled.strong`
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
`;

const PricePeriod = styled.span`
  padding-bottom: 3px;
  color: #94a3b8;
  font-size: 0.85rem;
`;

const SectionLabel = styled.p`
  margin: 0;
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const ModulesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #f1f5f9;
`;

const LimitPillsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const LimitPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 6px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  white-space: nowrap;
`;

const LimitPillIcon = styled.span`
  color: #64748b;
  font-size: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const LimitPillLabel = styled.span`
  font-size: 0.72rem;
  color: #64748b;
`;

const LimitPillSep = styled.span`
  font-size: 0.65rem;
  color: #cbd5e1;
`;

const LimitPillValue = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f172a;
`;

const EntitlementChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const EntitlementChip = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  background: rgb(13 148 136 / 8%);
  color: #0f766e;
  white-space: nowrap;
`;

const EntitlementChipMore = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  background: #f1f5f9;
  color: #64748b;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const VersionIdChip = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  font-size: 0.7rem;
  color: #64748b;
  min-width: 0;
  max-width: 160px;
`;

const VersionIdText = styled.span`
  font-family: monospace;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CopyButton = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 10px;
  flex-shrink: 0;

  &:hover {
    color: #0f766e;
  }
`;

const VersionIdEmpty = styled.span`
  font-size: 0.72rem;
  color: #94a3b8;
`;

const HistoryLink = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;

  &:hover {
    color: #0f766e;
  }
`;

const InfoButton = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;

  &:hover {
    color: #0f766e;
  }
`;

const DetailModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 4px;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailSectionTitle = styled.p`
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
`;

const DetailPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
`;

const DetailPricePeriod = styled.span`
  font-size: 0.9rem;
  font-weight: 400;
  color: #94a3b8;
`;

const DetailLimitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const DetailLimitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const DetailLimitIcon = styled.span`
  font-size: 13px;
  color: #64748b;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
`;

const DetailLimitLabel = styled.span`
  flex: 1;
  font-size: 0.82rem;
  color: #475569;
`;

const DetailLimitValue = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
`;

const DetailChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const DetailChip = styled.span<{ $variant: 'module' | 'addon' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 500;
  background: ${(p) =>
    p.$variant === 'addon' ? 'rgb(99 102 241 / 8%)' : 'rgb(13 148 136 / 8%)'};
  color: ${(p) => (p.$variant === 'addon' ? '#4f46e5' : '#0f766e')};

  svg {
    font-size: 9px;
  }
`;

const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const TooltipSectionTitle = styled.p`
  margin: 0;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(255 255 255 / 50%);
`;

const TooltipRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const TooltipRowIcon = styled.span`
  width: 14px;
  text-align: center;
  font-size: 11px;
  color: rgb(255 255 255 / 55%);
  flex-shrink: 0;
`;

const TooltipRowLabel = styled.span`
  flex: 1;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 80%);
`;

const TooltipRowValue = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffffff;
`;

const TooltipDivider = styled.hr`
  margin: 2px 0;
  border: none;
  border-top: 1px solid rgb(255 255 255 / 12%);
`;

const TooltipModuleList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
`;

const TooltipModuleItem = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 85%);

  svg {
    font-size: 9px;
    color: #34d399;
    flex-shrink: 0;
  }
`;

const ModalVersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
`;

const VersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VersionRowContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
`;

const VersionRowMain = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const VersionIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const VersionCode = styled.span`
  font-family: monospace;
  font-size: 0.78rem;
  color: #0f172a;
  font-weight: 600;
`;

const VersionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
`;

const VersionFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VersionActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const VersionHint = styled.span`
  font-size: 0.72rem;
  color: #94a3b8;
  text-transform: lowercase;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
`;

const LoadingText = styled.p`
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 22px;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

const EmptyDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  max-width: 420px;
`;

const EmptyInline = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

const Muted = styled.span`
  color: #94a3b8;
`;
