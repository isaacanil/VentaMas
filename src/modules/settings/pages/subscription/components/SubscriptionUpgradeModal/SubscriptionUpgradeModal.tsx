import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Typography } from 'antd';

import {
  DEFAULT_BENEFITS,
  UPGRADE_MODAL_ICONS,
  getBenefitIcon,
} from './SubscriptionUpgradeModal.config';
import {
  ActionRow,
  BenefitCard,
  BenefitIcon,
  BenefitsGrid,
  HeroCard,
  HeroGlow,
  HeroHeader,
  LockBadge,
  ModalBody,
  ReasonPill,
} from './SubscriptionUpgradeModal.styles';

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName?: string;
  limitReason: string;
  title?: string;
  description?: string;
  upgradeLabel?: string;
  cancelLabel?: string;
  benefits?: string[];
}

export const SubscriptionUpgradeModal = ({
  open,
  onClose,
  onUpgrade,
  featureName,
  limitReason,
  title,
  description,
  upgradeLabel = 'Ver planes',
  cancelLabel = 'Ahora no',
  benefits = DEFAULT_BENEFITS,
}: SubscriptionUpgradeModalProps) => {
  const resolvedTitle =
    title ||
    (featureName
      ? `${featureName} requiere un plan con mas capacidad`
      : 'Esta accion requiere un plan superior');
  const resolvedDescription =
    description ||
    `Bloqueamos esta accion porque ${limitReason.toLowerCase()}. Puedes mejorar tu suscripcion para continuar de inmediato.`;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      destroyOnHidden
    >
      <ModalBody>
        <HeroCard>
          <HeroGlow />
          <HeroHeader>
            <LockBadge>
              <FontAwesomeIcon icon={UPGRADE_MODAL_ICONS.lock} />
            </LockBadge>
            <Typography.Text type="secondary">
              Acceso condicionado por plan
            </Typography.Text>
          </HeroHeader>
          <Typography.Title level={2}>{resolvedTitle}</Typography.Title>
          <Typography.Paragraph>{resolvedDescription}</Typography.Paragraph>
          <ReasonPill>
            <FontAwesomeIcon icon={UPGRADE_MODAL_ICONS.reason} />
            {limitReason}
          </ReasonPill>
        </HeroCard>

        <BenefitsGrid>
          {benefits.slice(0, 3).map((benefit, index) => (
            <BenefitCard key={benefit}>
              <BenefitIcon icon={getBenefitIcon(index)} />
              <Typography.Text>{benefit}</Typography.Text>
            </BenefitCard>
          ))}
        </BenefitsGrid>

        <ActionRow>
          <Button size="large" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="primary" size="large" onClick={onUpgrade}>
            {upgradeLabel}
          </Button>
        </ActionRow>
      </ModalBody>
    </Modal>
  );
};

export default SubscriptionUpgradeModal;
