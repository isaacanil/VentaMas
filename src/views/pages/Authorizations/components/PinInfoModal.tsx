// @ts-nocheck
import {
  SafetyOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Modal, Typography, Button } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

const sectionTokens = {
  usage: {
    bg: 'linear-gradient(135deg, rgba(22, 119, 255, 0.10) 0%, rgba(22, 119, 255, 0.02) 100%)',
    border: 'rgba(22, 119, 255, 0.32)',
    iconBg: 'rgba(22, 119, 255, 0.16)',
    iconColor: '#1677ff',
    bulletBg: 'rgba(22, 119, 255, 0.14)',
    bulletColor: '#1677ff',
  },
  security: {
    bg: 'linear-gradient(135deg, rgba(250, 140, 22, 0.16) 0%, rgba(255, 214, 102, 0.08) 100%)',
    border: 'rgba(250, 140, 22, 0.32)',
    iconBg: 'rgba(250, 140, 22, 0.18)',
    iconColor: '#fa8c16',
    bulletBg: 'rgba(250, 140, 22, 0.14)',
    bulletColor: '#d46b08',
  },
};

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 8px 0 4px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
`;

const IconBadge = styled.div`
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  font-size: 34px;
  color: #fff;
  background: linear-gradient(135deg, #722ed1 0%, #1677ff 100%);
  border-radius: 24px;
`;

const HeaderTitle = styled(Title)`
  && {
    margin: 0;
  }
`;

const Subtitle = styled(Text)`
  font-size: 14px;
  color: #8c8c8c !important;
`;

const SectionCard = styled.div`
  display: grid;
  gap: 18px;
  padding: 22px 24px;
  background: ${({ $variant }) => sectionTokens[$variant]?.bg || '#fafafa'};
  border: 1px solid
    ${({ $variant }) => sectionTokens[$variant]?.border || '#f0f0f0'};
  border-radius: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SectionIcon = styled.div`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: ${({ $variant }) => sectionTokens[$variant]?.iconColor || '#1f1f1f'};
  background: ${({ $variant }) => sectionTokens[$variant]?.iconBg || '#f0f0f0'};
  border-radius: 14px;
`;

const SectionHeading = styled(Title)`
  && {
    margin: 0;
    font-size: 18px;
    color: #1f1f1f;
  }
`;

const SectionLabel = styled.span`
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SectionHeaderTexts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TipsList = styled.ul`
  display: grid;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const TipItem = styled.li`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #434343;
`;

const TipBullet = styled.span`
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 16px;
  color: ${({ $variant }) => sectionTokens[$variant]?.bulletColor || '#1677ff'};
  background: ${({ $variant }) =>
    sectionTokens[$variant]?.bulletBg || '#e6f4ff'};
  border-radius: 10px;
`;

const TipText = styled.span`
  font-size: 14px;
  line-height: 1.6;
`;

const Highlight = styled.span`
  font-weight: 600;
  color: #1f1f1f;
`;

export const PinInfoModal = ({ visible, onClose, canSelfGenerate }) => {
  const usageTips = [
    <>
      Ingresa tu <Highlight>usuario</Highlight> y tu{' '}
      <Highlight>PIN de 6 dígitos</Highlight> cada vez que el sistema lo
      solicite.
    </>,
    'Mantén los PINs en privado: cada usuario tiene sus propios códigos temporales.',
    'Los PINs expiran de forma periódica para mantener la seguridad de las operaciones.',
    'Si lo prefieres, siempre puedes usar tu contraseña completa para autorizarte.',
  ];

  const securityTips = [
    'Guardamos los PINs encriptados; nadie puede verlos en texto plano.',
    'El código caduca automáticamente para reducir riesgos.',
    canSelfGenerate
      ? 'Cuando venza, puedes regenerarlo tú mismo sin depender de otro usuario.'
      : 'Cuando venza, deberás solicitar a un administrador autorizado que lo regenere.',
    'Solo funcionará en los módulos que tienes habilitados en la plataforma.',
  ];

  const renderTips = (tips, variant) =>
    tips.map((tip, index) => (
      <TipItem key={`${variant}-${index}`}>
        <TipBullet $variant={variant}>
          <CheckCircleOutlined />
        </TipBullet>
        <TipText>{tip}</TipText>
      </TipItem>
    ));

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Entendido
        </Button>,
      ]}
      width={680}
      centered
      title={null}
      destroyOnHidden
    >
      <ModalContent>
        <Header>
          <IconBadge>
            <SafetyOutlined />
          </IconBadge>
          <HeaderTitle level={4}>Conoce cómo funcionan los PINs</HeaderTitle>
          <Subtitle>
            Usa códigos temporales para autorizar operaciones de manera ágil,
            manteniendo la seguridad de tu cuenta.
          </Subtitle>
        </Header>

        <SectionCard $variant="usage">
          <SectionHeader>
            <SectionIcon $variant="usage">
              <SafetyOutlined />
            </SectionIcon>
            <SectionHeaderTexts>
              <SectionLabel>Uso diario</SectionLabel>
              <SectionHeading level={5}>
                Cómo aprovechar los PINs
              </SectionHeading>
            </SectionHeaderTexts>
          </SectionHeader>
          <TipsList>{renderTips(usageTips, 'usage')}</TipsList>
        </SectionCard>

        <SectionCard $variant="security">
          <SectionHeader>
            <SectionIcon $variant="security">
              <LockOutlined />
            </SectionIcon>
            <SectionHeaderTexts>
              <SectionLabel>Buenas prácticas</SectionLabel>
              <SectionHeading level={5}>Manténlo seguro</SectionHeading>
            </SectionHeaderTexts>
          </SectionHeader>
          <TipsList>{renderTips(securityTips, 'security')}</TipsList>
        </SectionCard>
      </ModalContent>
    </Modal>
  );
};

export default PinInfoModal;
