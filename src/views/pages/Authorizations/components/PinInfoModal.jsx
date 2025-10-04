import { Modal, Typography, Button } from 'antd';
import { SafetyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  align-items: center;
  gap: 14px;
  text-align: center;
`;

const IconBadge = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #722ed1 0%, #1677ff 100%);
  color: #fff;
  font-size: 34px;
`;

const HeaderTitle = styled(Title)`
  && {
    margin: 0;
  }
`;

const Subtitle = styled(Text)`
  color: #8c8c8c !important;
  font-size: 14px;
`;

const SectionCard = styled.div`
  background: ${({ $variant }) => sectionTokens[$variant]?.bg || '#fafafa'};
  border: 1px solid ${({ $variant }) => sectionTokens[$variant]?.border || '#f0f0f0'};
  border-radius: 20px;
  padding: 22px 24px;
  display: grid;
  gap: 18px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SectionIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: ${({ $variant }) => sectionTokens[$variant]?.iconBg || '#f0f0f0'};
  color: ${({ $variant }) => sectionTokens[$variant]?.iconColor || '#1f1f1f'};
  font-size: 22px;
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
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 6px;
`;

const SectionHeaderTexts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TipsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
`;

const TipItem = styled.li`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #434343;
`;

const TipBullet = styled.span`
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: ${({ $variant }) => sectionTokens[$variant]?.bulletBg || '#e6f4ff'};
  color: ${({ $variant }) => sectionTokens[$variant]?.bulletColor || '#1677ff'};
  font-size: 16px;
  flex-shrink: 0;
`;

const TipText = styled.span`
  font-size: 14px;
  line-height: 1.6;
`;

const Highlight = styled.span`
  color: #1f1f1f;
  font-weight: 600;
`;

export const PinInfoModal = ({ visible, onClose, canSelfGenerate }) => {
  const usageTips = [
    (
      <>
        Ingresa tu <Highlight>usuario</Highlight> y tu <Highlight>PIN de 6 dígitos</Highlight> cada vez que el sistema lo solicite.
      </>
    ),
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
      destroyOnClose
    >
      <ModalContent>
        <Header>
          <IconBadge>
            <SafetyOutlined />
          </IconBadge>
          <HeaderTitle level={4}>Conoce cómo funcionan los PINs</HeaderTitle>
          <Subtitle>
            Usa códigos temporales para autorizar operaciones de manera ágil, manteniendo la seguridad de tu cuenta.
          </Subtitle>
        </Header>

        <SectionCard $variant="usage">
          <SectionHeader>
            <SectionIcon $variant="usage">
              <SafetyOutlined />
            </SectionIcon>
            <SectionHeaderTexts>
              <SectionLabel>Uso diario</SectionLabel>
              <SectionHeading level={5}>Cómo aprovechar los PINs</SectionHeading>
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
