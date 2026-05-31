import {
  faBoxArchive,
  faCheck,
  faCircleInfo,
  faClockRotateLeft,
  faCopy,
  faEllipsisVertical,
  faPen,
  faPlus,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, Modal, Tooltip } from 'antd';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  Card,
  CardFooter,
  CardMenuButton,
  CardMeta,
  CardNamePrice,
  CopyButton,
  Divider,
  FooterLeft,
  FooterRight,
  HistoryLink,
  InfoButton,
  PlanCode,
  PlanName,
  PriceAmount,
  PricePeriod,
  PriceRow,
  StatusBadge,
  VersionIdChip,
  VersionIdEmpty,
  VersionIdText,
} from './DeveloperSubscriptionPlanCard.styles';
import { normalizeSubscriptionEntitlements } from '../subscriptionEntitlements';
import { asRecord, toCleanString, toFiniteNumber } from '../subscription.utils';
import type { UnknownRecord } from '../subscription.types';
import {
  formatPlanPrice,
  getBadgeLabel,
  getEnabledEntitlements,
  PlanTooltipContent,
  truncateVersionId,
} from './DeveloperSubscriptionPlanCard.helpers';
import {
  PlanDetailModal,
  VersionHistoryModal,
} from './DeveloperSubscriptionPlanCardModals';

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

export const DeveloperSubscriptionPlanCard = ({
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
  const planCode = toCleanString(record.planCode) ?? '(sin codigo)';
  const displayName =
    toCleanString(record.displayName) ?? planCode.toUpperCase();
  const catalogStatus = toCleanString(record.catalogStatus) ?? 'active';
  const isSystemBuiltin = record.isSystemBuiltin === true;
  const currentVersion = asRecord(record.currentVersion);
  const limits = asRecord(currentVersion.limits);
  const entitlements = normalizeSubscriptionEntitlements(currentVersion);
  const versionItems = Array.isArray(record.versions)
    ? record.versions.map((item) => asRecord(item))
    : [];
  const versionCount =
    toFiniteNumber(record.versionCount) ?? versionItems.length;
  const moduleEntries = getEnabledEntitlements(entitlements.modules);
  const addonEntries = getEnabledEntitlements(entitlements.addons);
  const currentVersionId =
    toCleanString(currentVersion.versionId) ??
    toCleanString(currentVersion.version);
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
    icon?: ReactNode;
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
      label: 'Nueva version',
      icon: <FontAwesomeIcon icon={faPlus} />,
      onClick: () => onNewVersion(record),
    },
  ];
  if (catalogStatus === 'active') {
    menuItems.push({
      key: 'deprecate',
      label: 'Deprecar base',
      icon: <FontAwesomeIcon icon={faBoxArchive} />,
      onClick: () =>
        void onUpdateLifecycle({ planCode, lifecycleStatus: 'deprecated' }),
    });
  }
  if (catalogStatus !== 'retired') {
    menuItems.push({
      key: 'retire',
      label: 'Retirar base',
      danger: true,
      icon: <FontAwesomeIcon icon={faXmark} />,
      onClick: () =>
        void onUpdateLifecycle({ planCode, lifecycleStatus: 'retired' }),
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
          title: 'Eliminar suscripcion definitivamente',
          content:
            'Solo se eliminara si no tiene historial, referencias activas ni es un plan default hardcodeado.',
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
            'Este plan esta marcado como builtin del sistema en Firestore y no puede eliminarse definitivamente desde el panel.',
        }),
    });
  }

  return (
    <Tooltip
      title={
        <PlanTooltipContent limits={limits} allEntitlements={allEntitlements} />
      }
      placement="right"
      overlayStyle={{ maxWidth: 340 }}
    >
      <Card>
        <CardMeta>
          <PlanCode>{planCode}</PlanCode>
          <StatusBadge $status={catalogStatus}>
            {getBadgeLabel(catalogStatus)}
          </StatusBadge>
        </CardMeta>

        <CardNamePrice>
          <PlanName>{displayName}</PlanName>
          <PriceRow>
            <PriceAmount>{formatPlanPrice(currentPrice)}</PriceAmount>
            {currentPrice ? <PricePeriod>/mes</PricePeriod> : null}
          </PriceRow>
        </CardNamePrice>

        <Divider />

        <CardFooter>
          <FooterLeft>
            {currentVersionId ? (
              <VersionIdChip>
                <VersionIdText>
                  {truncateVersionId(currentVersionId)}
                </VersionIdText>
                <CopyButton onClick={handleCopy} title="Copiar ID completo">
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                </CopyButton>
              </VersionIdChip>
            ) : (
              <VersionIdEmpty>Sin version vigente</VersionIdEmpty>
            )}
          </FooterLeft>
          <FooterRight>
            {(versionItems.length > 0 || versionCount > 0) && (
              <HistoryLink onClick={() => setHistoryOpen(true)}>
                <FontAwesomeIcon icon={faClockRotateLeft} />
                {versionCount} {versionCount === 1 ? 'version' : 'versiones'}
              </HistoryLink>
            )}
            <InfoButton
              onClick={() => setDetailOpen(true)}
              title="Ver detalle del plan"
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </InfoButton>
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <CardMenuButton
                icon={<FontAwesomeIcon icon={faEllipsisVertical} />}
                size="small"
              />
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
