import {
  faArrowTrendUp,
  faBolt,
  faChartLine,
  faLock,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Typography } from 'antd';
import styled from 'styled-components';

interface UpgradeModalProps {
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

const DEFAULT_BENEFITS = [
  'Desbloquea mas capacidad operativa sin perder el contexto de trabajo.',
  'Amplia limites para usuarios, facturas y crecimiento del negocio.',
  'Gestiona upgrade y cobros desde el centro de suscripcion.',
];

export const UpgradeModal = ({
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
}: UpgradeModalProps) => {
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
              <FontAwesomeIcon icon={faLock} />
            </LockBadge>
            <Typography.Text type="secondary">
              Acceso condicionado por plan
            </Typography.Text>
          </HeroHeader>
          <Typography.Title level={2}>{resolvedTitle}</Typography.Title>
          <Typography.Paragraph>{resolvedDescription}</Typography.Paragraph>
          <ReasonPill>
            <FontAwesomeIcon icon={faStar} />
            {limitReason}
          </ReasonPill>
        </HeroCard>

        <BenefitsGrid>
          {benefits.slice(0, 3).map((benefit, index) => (
            <BenefitCard key={benefit}>
              <BenefitIcon
                icon={
                  index === 0
                    ? faBolt
                    : index === 1
                      ? faChartLine
                      : faArrowTrendUp
                }
              />
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

export default UpgradeModal;

const ModalBody = styled.div`
  display: grid;
  gap: 18px;
`;

const HeroCard = styled.section`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid rgb(14 116 144 / 12%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgb(251 191 36 / 24%), transparent 36%),
    linear-gradient(145deg, #fff8e7 0%, #f8fafc 46%, #eff6ff 100%);

  .ant-typography {
    position: relative;
    margin-bottom: 0;
  }
`;

const HeroGlow = styled.div`
  position: absolute;
  inset: auto -52px -74px auto;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgb(14 165 233 / 12%);
  filter: blur(8px);
`;

const HeroHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LockBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #075985;
  background: rgb(255 255 255 / 82%);
  box-shadow: 0 12px 34px rgb(14 116 144 / 10%);
`;

const ReasonPill = styled.div`
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 700;
  background: rgb(255 237 213 / 88%);
`;

const BenefitsGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const BenefitCard = styled.div`
  display: grid;
  gap: 10px;
  min-height: 132px;
  padding: 18px;
  border: 1px solid rgb(148 163 184 / 22%);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 14px 40px rgb(15 23 42 / 6%);
`;

const BenefitIcon = styled(FontAwesomeIcon)`
  font-size: 18px;
  color: #0f766e;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`;
