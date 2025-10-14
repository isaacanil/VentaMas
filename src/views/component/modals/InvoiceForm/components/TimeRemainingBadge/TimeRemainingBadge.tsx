import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Popover, Typography } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined, EditOutlined } from '@ant-design/icons';
import { DateTime, Duration } from 'luxon';
import styled from 'styled-components';

const { Text } = Typography;

interface InvoiceLike {
  date?: number | null;
}

interface TimeRemainingBadgeProps {
  invoice?: InvoiceLike | null;
}

type TimeUnit = 'hora' | 'horas' | 'minuto' | 'minutos';

interface FormattedTime {
  time: string;
  unit: TimeUnit;
}

interface TimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CANCELATION_WINDOW_DAYS = 2;

const computeFormattedRemainingTime = (secondsRemaining: number): FormattedTime => {
  if (secondsRemaining <= 0) {
    return { time: '00:00', unit: 'horas' };
  }

  const duration = Duration.fromObject({ seconds: secondsRemaining });
  const hours = Math.floor(duration.as('hours'));
  const minutes = Math.floor(duration.as('minutes') % 60);

  if (hours > 0) {
    return {
      time: `${hours}h ${minutes}m`,
      unit: hours === 1 ? 'hora' : 'horas',
    };
  }

  return {
    time: `${minutes}m`,
    unit: minutes === 1 ? 'minuto' : 'minutos',
  };
};

const computeTimeBreakdown = (secondsRemaining: number): TimeBreakdown => {
  if (secondsRemaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const duration = Duration.fromObject({ seconds: secondsRemaining });

  return {
    days: Math.floor(duration.as('days')),
    hours: Math.floor(duration.as('hours') % 24),
    minutes: Math.floor(duration.as('minutes') % 60),
    seconds: Math.floor(duration.as('seconds') % 60),
  };
};

export const TimeRemainingBadge: FC<TimeRemainingBadgeProps> = ({ invoice }) => {
  const [remainingCancelationTime, setRemainingCancelationTime] = useState<number>(0);
  const invoiceDate = typeof invoice?.date === 'number' ? invoice.date : null;

  useEffect(() => {
    if (invoiceDate === null) {
      setRemainingCancelationTime(0);
      return;
    }

    const updateRemainingTime = () => {
      const now = DateTime.now();
      const expiryTime = DateTime.fromMillis(invoiceDate).plus({ days: CANCELATION_WINDOW_DAYS });
      const remaining = expiryTime.diff(now, 'seconds').seconds;

      setRemainingCancelationTime(Math.max(0, remaining));
    };

    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [invoiceDate]);

  if (remainingCancelationTime <= 0 || invoiceDate === null) {
    return null;
  }

  const timeBreakdown = computeTimeBreakdown(remainingCancelationTime);
  const displayTime = computeFormattedRemainingTime(remainingCancelationTime);
  const expiryDateLabel = DateTime.fromMillis(invoiceDate)
    .plus({ days: CANCELATION_WINDOW_DAYS })
    .toFormat('dd/MM/yyyy HH:mm:ss');

  const content: ReactNode = (
    <PopoverContent>
      <PopoverHeader>
        <HeaderIcon>
          <HeaderIconSymbol />
        </HeaderIcon>
        <HeaderCopy>
          <PopoverTitle>Tiempo de edición</PopoverTitle>
          <PopoverSubtitle>
            Aprovecha la ventana de 48 horas para ajustar la factura.
          </PopoverSubtitle>
        </HeaderCopy>
      </PopoverHeader>

      <PopoverDivider />

      <CountdownGrid>
        {timeBreakdown.days > 0 && (
          <CountdownItem>
            <CountdownValue>{timeBreakdown.days}</CountdownValue>
            <CountdownLabel>días</CountdownLabel>
          </CountdownItem>
        )}
        <CountdownItem>
          <CountdownValue>
            {String(timeBreakdown.hours).padStart(2, '0')}
          </CountdownValue>
          <CountdownLabel>horas</CountdownLabel>
        </CountdownItem>
        <CountdownItem>
          <CountdownValue>
            {String(timeBreakdown.minutes).padStart(2, '0')}
          </CountdownValue>
          <CountdownLabel>min</CountdownLabel>
        </CountdownItem>
        <CountdownItem>
          <CountdownValue>
            {String(timeBreakdown.seconds).padStart(2, '0')}
          </CountdownValue>
          <CountdownLabel>seg</CountdownLabel>
        </CountdownItem>
      </CountdownGrid>

      <PopoverFooter>
        <FooterLabel>Vence el</FooterLabel>
        <FooterValue>{expiryDateLabel}</FooterValue>
      </PopoverFooter>

      <PopoverNote>
        <NoteIcon />
        <NoteText>
          Después de este tiempo, la factura no podrá ser modificada.
        </NoteText>
      </PopoverNote>
    </PopoverContent>
  );

  return (
    <Wrapper>
      <Popover
        content={content}
        title={null}
        trigger="click"
        placement="bottomLeft"
        overlayStyle={{ maxWidth: '330px' }}
      >
        <BadgeButton>
          <ClockIcon />
          <BadgeInfo>
            <BadgeLabel>Tiempo restante</BadgeLabel>
            <BadgeTime>{displayTime.time}</BadgeTime>
          </BadgeInfo>
        </BadgeButton>
      </Popover>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const BadgeButton = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fffaf3;
  border: 1px solid rgba(255, 171, 64, 0.4);
  box-shadow: 0 2px 10px rgba(255, 171, 64, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: #fff3e0;
    box-shadow: 0 4px 14px rgba(255, 171, 64, 0.18);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ClockIcon = styled(ClockCircleOutlined)`
  font-size: 18px;
  color: #f57c00;
`;

const BadgeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.1;
`;

const BadgeLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b85b00;
`;

const BadgeTime = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #914200;
  font-family: 'Courier New', monospace;
`;

const PopoverContent = styled.div`
  min-width: 280px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 152, 0, 0.12);
  display: grid;
  place-items: center;
  color: #f57c00;
`;

const HeaderIconSymbol = styled(EditOutlined)`
  font-size: 18px;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PopoverTitle = styled(Text)`
  && {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }
`;

const PopoverSubtitle = styled(Text)`
  && {
    font-size: 12px;
    color: #666;
  }
`;

const PopoverDivider = styled.div`
  height: 1px;
  background: #f5f5f5;
  border-radius: 999px;
`;

const CountdownGrid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(54px, auto);
  gap: 10px;
`;

const CountdownItem = styled.div`
  padding: 8px 10px;
  background: #fff9e7;
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(255, 152, 0, 0.25);
`;

const CountdownValue = styled.span`
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #e65100;
  font-family: 'Courier New', monospace;
`;

const CountdownLabel = styled.span`
  display: block;
  margin-top: 2px;
  font-size: 11px;
  text-transform: uppercase;
  color: #a15b00;
  letter-spacing: 0.4px;
`;

const PopoverFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FooterLabel = styled(Text)`
  && {
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }
`;

const FooterValue = styled(Text)`
  && {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
`;

const PopoverNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.08);
`;

const NoteIcon = styled(InfoCircleOutlined)`
  font-size: 16px;
  color: #ff9800;
  margin-top: 2px;
`;

const NoteText = styled.span`
  font-size: 12px;
  color: #8d6e63;
  line-height: 1.4;
`;
