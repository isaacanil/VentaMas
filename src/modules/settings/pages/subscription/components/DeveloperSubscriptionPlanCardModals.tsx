import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal } from 'antd';

import {
  DetailChip,
  DetailChipGrid,
  DetailLimitIcon,
  DetailLimitItem,
  DetailLimitLabel,
  DetailLimitsGrid,
  DetailLimitValue,
  DetailModalBody,
  DetailModalTitle,
  DetailPrice,
  DetailPricePeriod,
  DetailSection,
  DetailSectionTitle,
  EmptyInline,
  ModalVersionList,
  StatusBadge,
  VersionActions,
  VersionCode,
  VersionFooterRow,
  VersionHint,
  VersionIdentity,
  VersionMeta,
  VersionRowContainer,
  VersionRowMain,
} from './DeveloperSubscriptionPlanCard.styles';
import { ENTITLEMENT_LABELS } from '../subscriptionEntitlements';
import {
  formatDate,
  toCleanString,
  toFiniteNumber,
  toMillis,
} from '../subscription.utils';
import type { UnknownRecord } from '../subscription.types';
import {
  formatLimitValue,
  formatPlanPrice,
  getBadgeLabel,
  PREVIEW_LIMIT_KEYS,
} from './DeveloperSubscriptionPlanCard.helpers';

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
    toCleanString(version.versionId) ??
    toCleanString(version.version) ??
    'sin-id';
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
          <span>{formatPlanPrice(priceMonthly)}</span>
          <span>
            {effectiveAt
              ? `Vigencia: ${formatDate(effectiveAt)}`
              : 'Sin fecha efectiva'}
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
              Retirar version
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
  catalogStatus: string;
  currentPrice: number | null;
  limits: UnknownRecord;
  moduleEntries: [string, unknown][];
  addonEntries: [string, unknown][];
}

export const PlanDetailModal = ({
  open,
  onClose,
  displayName,
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
        <StatusBadge $status={catalogStatus}>
          {getBadgeLabel(catalogStatus)}
        </StatusBadge>
      </DetailModalTitle>
    }
    width={560}
  >
    <DetailModalBody>
      <DetailSection>
        <DetailSectionTitle>Precio</DetailSectionTitle>
        <DetailPrice>
          {formatPlanPrice(currentPrice)}
          {currentPrice ? <DetailPricePeriod>/mes</DetailPricePeriod> : null}
        </DetailPrice>
      </DetailSection>

      <DetailSection>
        <DetailSectionTitle>Limites</DetailSectionTitle>
        <DetailLimitsGrid>
          {PREVIEW_LIMIT_KEYS.map(({ key, label, icon }) => (
            <DetailLimitItem key={key}>
              <DetailLimitIcon>{icon}</DetailLimitIcon>
              <DetailLimitLabel>{label}</DetailLimitLabel>
              <DetailLimitValue>
                {formatLimitValue(limits[key])}
              </DetailLimitValue>
            </DetailLimitItem>
          ))}
        </DetailLimitsGrid>
      </DetailSection>

      {moduleEntries.length > 0 && (
        <DetailSection>
          <DetailSectionTitle>Modulos habilitados</DetailSectionTitle>
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
        <EmptyInline>Sin modulos ni add-ons configurados.</EmptyInline>
      )}
    </DetailModalBody>
  </Modal>
);

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

export const VersionHistoryModal = ({
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
    title={`Historial de versiones - ${planCode}`}
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
