import { ClockCircleOutlined } from '@ant-design/icons';
import { Alert, Tag } from 'antd';
import { DateTime, Duration } from 'luxon';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

export const InvoiceInfoExtras = ({ invoice }) => {
  const [remainingCancelationTime, setRemainingCancelationTime] = useState(0);

  useEffect(() => {
    const updateRemainingTime = () => {
      const now = DateTime.now();
      const expiryTime = DateTime.fromMillis(invoice.date).plus({ days: 2 });
      const remaining = expiryTime.diff(now, 'seconds').seconds;

      setRemainingCancelationTime(Math.max(0, remaining));
    };

    updateRemainingTime(); // Actualizar al montar el componente

    const timer = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [invoice]);

  const formattedRemainingTime = () => {
    if (remainingCancelationTime <= 0) {
      return '00:00:00';
    }
    const duration = Duration.fromObject({ seconds: remainingCancelationTime });
    return duration.toFormat('hh:mm:ss');
  };
  return (
    <Container>
      {remainingCancelationTime > 0 && (
        <>
          <TimeBadge>
            <Tag
              icon={<ClockCircleOutlined />}
              color="warning"
              style={{
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            >
              Tiempo restante: {formattedRemainingTime()}
            </Tag>
          </TimeBadge>
          <Alert
            closable
            message={`Tiempo restante para modificar la factura: ${formattedRemainingTime()}`}
            description="Una vez transcurrido este tiempo, no podrás realizar cambios en la factura."
            type="warning"
            showIcon
          />
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TimeBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;
