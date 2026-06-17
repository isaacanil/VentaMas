import { Popover } from 'antd';
import { DateTime, Duration } from 'luxon';
import { useEffect, useState } from 'react';

import type { FC, ReactNode } from 'react';
import type { InvoiceData } from '@/types/invoice';
import { resolveInvoiceDateMillis } from '@/utils/invoice/date';
import {
  BadgeButton,
  BadgeInfo,
  BadgeLabel,
  BadgeTime,
  ClockIcon,
  CountdownGrid,
  CountdownItem,
  CountdownLabel,
  CountdownValue,
  FooterLabel,
  FooterValue,
  HeaderCopy,
  HeaderIcon,
  HeaderIconSymbol,
  NoteIcon,
  NoteText,
  PopoverContent,
  PopoverDivider,
  PopoverFooter,
  PopoverHeader,
  PopoverNote,
  PopoverSubtitle,
  PopoverTitle,
  Wrapper,
} from './TimeRemainingBadge.styles';

interface InvoiceLike {
  date?: InvoiceData['date'];
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

const computeFormattedRemainingTime = (
  secondsRemaining: number,
): FormattedTime => {
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

export const TimeRemainingBadge: FC<TimeRemainingBadgeProps> = ({
  invoice,
}) => {
  const [remainingCancelationTime, setRemainingCancelationTime] =
    useState<number>(0);
  const invoiceDate = resolveInvoiceDateMillis(invoice?.date);

  useEffect(() => {
    if (invoiceDate === null) return undefined;

    const updateRemainingTime = () => {
      const now = DateTime.now();
      const expiryTime = DateTime.fromMillis(invoiceDate).plus({
        days: CANCELATION_WINDOW_DAYS,
      });
      const remaining = expiryTime.diff(now, 'seconds').seconds;

      setRemainingCancelationTime(Math.max(0, remaining));
    };

    const initialTimeout = window.setTimeout(updateRemainingTime, 0);
    const timer = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearTimeout(initialTimeout);
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
