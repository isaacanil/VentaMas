import { Button } from 'antd';
import styled from 'styled-components';

interface DeveloperSubscriptionInactiveNoticeProps {
  onGoHome: () => void;
}

export const DeveloperSubscriptionInactiveNotice = ({
  onGoHome,
}: DeveloperSubscriptionInactiveNoticeProps) => (
  <Notice $tone="warning">
    <NoticeText>
      <strong>Sin negocio activo.</strong> Selecciona un negocio para ejecutar
      simulaciones y revisar el snapshot de suscripción.
    </NoticeText>
    <Button size="small" onClick={onGoHome}>
      Ir al inicio
    </Button>
  </Notice>
);

const Notice = styled.div<{ $tone: 'warning' | 'info' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid
    ${(p) =>
      p.$tone === 'warning' ? 'rgb(217 119 6 / 20%)' : 'rgb(14 165 233 / 20%)'};
  background: ${(p) =>
    p.$tone === 'warning' ? 'rgb(255 251 235)' : 'rgb(240 249 255)'};
`;

const NoticeText = styled.p`
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.5;
`;
