import { CalendarOutlined } from '@/constants/icons/antd';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VmButton, VmModal } from '@/components/heroui';

type PaymentFrequency = 'monthly' | 'weekly' | 'annual' | string;
type ViewMode = 'list' | 'calendar';

type PaymentDatesOverviewProps = {
  paymentDates: number[];
  nextPaymentDate?: number | null;
  frequency?: PaymentFrequency;
  installments?: number;
};

type FormattedPaymentDate = {
  key: number;
  paymentNumber: number;
  date: string;
  dateObj: DateTime;
  isNext: boolean;
};

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const getFrequencyTerm = (frequency?: PaymentFrequency) => {
  switch (frequency) {
    case 'monthly':
      return 'mensual';
    case 'weekly':
      return 'semanal';
    case 'annual':
      return 'anual';
    default:
      return '';
  }
};

const getDayKey = (date: DateTime) => date.toFormat('yyyy-LL-dd');

const PaymentDatesOverview = ({
  paymentDates,
  nextPaymentDate,
  frequency,
  installments,
}: PaymentDatesOverviewProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const formattedDates = useMemo<FormattedPaymentDate[]>(() => {
    const nextPaymentDay = nextPaymentDate
      ? DateTime.fromMillis(nextPaymentDate).startOf('day').toMillis()
      : null;

    return paymentDates.map((date, index) => {
      const dateObj = DateTime.fromMillis(date);
      const dateDay = dateObj.startOf('day').toMillis();

      return {
        key: index,
        paymentNumber: index + 1,
        date: dateObj.toFormat('dd/MM/yyyy'),
        dateObj,
        isNext: nextPaymentDay !== null && dateDay === nextPaymentDay,
      };
    });
  }, [nextPaymentDate, paymentDates]);

  const paymentsByDay = useMemo(() => {
    const grouped = new Map<string, FormattedPaymentDate[]>();

    formattedDates.forEach((item) => {
      const dayKey = getDayKey(item.dateObj);
      grouped.set(dayKey, [...(grouped.get(dayKey) ?? []), item]);
    });

    return grouped;
  }, [formattedDates]);

  const calendarMonths = useMemo(() => {
    const months = new Map<string, DateTime>();

    formattedDates.forEach((item) => {
      const month = item.dateObj.startOf('month');
      months.set(month.toFormat('yyyy-LL'), month);
    });

    return [...months.values()].sort((a, b) => a.toMillis() - b.toMillis());
  }, [formattedDates]);

  const frequencyTerm = getFrequencyTerm(frequency);
  const title = `Plan de pagos${frequencyTerm ? ` ${frequencyTerm}` : ''} (${
    installments ?? formattedDates.length
  } cuotas)`;

  const handleClose = () => {
    setIsModalVisible(false);
    setViewMode('list');
  };

  const toggleViewMode = () => {
    setViewMode((current) => (current === 'list' ? 'calendar' : 'list'));
  };

  return (
    <>
      <ViewButton
        fullWidth
        variant="primary"
        onPress={() => setIsModalVisible(true)}
      >
        <CalendarOutlined />
        Ver fechas de pago
      </ViewButton>

      <VmModal
        title={title}
        ariaLabel={title}
        isOpen={isModalVisible}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        isDismissable={false}
        size={viewMode === 'calendar' ? 'lg' : 'md'}
        footer={
          <>
            <VmButton variant="secondary" onPress={toggleViewMode}>
              {viewMode === 'list' ? 'Ver calendario' : 'Ver lista'}
            </VmButton>
            <VmButton variant="primary" onPress={handleClose}>
              Cerrar
            </VmButton>
          </>
        }
      >
        {viewMode === 'list' ? (
          <PaymentList role="list">
            {formattedDates.map((item) => (
              <PaymentItem
                key={item.key}
                role="listitem"
                $isNext={item.isNext}
              >
                <PaymentNumber $isNext={item.isNext}>
                  Pago #{item.paymentNumber}
                </PaymentNumber>
                <PaymentDate>{item.date}</PaymentDate>
                {item.isNext ? (
                  <NextPaymentBadge>Próximo pago</NextPaymentBadge>
                ) : null}
              </PaymentItem>
            ))}
          </PaymentList>
        ) : (
          <CalendarScroll>
            {calendarMonths.map((month) => (
              <CalendarMonth
                key={month.toFormat('yyyy-LL')}
                month={month}
                paymentsByDay={paymentsByDay}
              />
            ))}
          </CalendarScroll>
        )}
      </VmModal>
    </>
  );
};

type CalendarMonthProps = {
  month: DateTime;
  paymentsByDay: Map<string, FormattedPaymentDate[]>;
};

const CalendarMonth = ({ month, paymentsByDay }: CalendarMonthProps) => {
  const firstDay = month.startOf('month');
  const daysInMonth = firstDay.daysInMonth ?? 0;
  const leadingEmptyDays = firstDay.weekday % 7;
  const calendarCells: Array<DateTime | null> = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      firstDay.set({ day: index + 1 }),
    ),
  ];

  return (
    <CalendarMonthBlock>
      <CalendarMonthTitle>
        {firstDay.setLocale('es').toFormat('LLLL yyyy')}
      </CalendarMonthTitle>
      <CalendarWeekdays>
        {WEEK_DAYS.map((day) => (
          <Weekday key={day}>{day}</Weekday>
        ))}
      </CalendarWeekdays>
      <CalendarGrid>
        {calendarCells.map((date, index) => {
          if (!date) {
            return <EmptyDay key={`empty-${index}`} aria-hidden="true" />;
          }

          const payments = paymentsByDay.get(getDayKey(date)) ?? [];
          const hasPayment = payments.length > 0;
          const isNext = payments.some((payment) => payment.isNext);
          const firstPayment = payments[0];

          return (
            <CalendarDay
              key={getDayKey(date)}
              $hasPayment={hasPayment}
              $isNext={isNext}
            >
              <DayNumber>{date.day}</DayNumber>
              {hasPayment ? (
                <DayBadge $isNext={isNext}>
                  {payments.length > 1
                    ? `${payments.length} pagos`
                    : firstPayment
                      ? `Pago #${firstPayment.paymentNumber}`
                      : ''}
                </DayBadge>
              ) : null}
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </CalendarMonthBlock>
  );
};

const ViewButton = styled(VmButton)`
  margin-top: 10px;
`;

const PaymentList = styled.div`
  display: grid;
  gap: 10px;
`;

const PaymentItem = styled.div<{ $isNext?: boolean }>`
  display: grid;
  grid-template-columns: minmax(88px, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  background-color: ${({ $isNext }) => ($isNext ? '#e6f7ff' : 'transparent')};
  border: 1px solid ${({ $isNext }) => ($isNext ? '#d7efff' : '#f0f0f0')};
  border-radius: 6px;
`;

const PaymentNumber = styled.span<{ $isNext?: boolean }>`
  font-weight: ${({ $isNext }) => ($isNext ? 700 : 500)};
`;

const PaymentDate = styled.span`
  color: #555;
`;

const NextPaymentBadge = styled.span`
  padding: 3px 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: #1677ff;
  border-radius: 999px;
`;

const CalendarScroll = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
  max-height: min(58dvh, 520px);
  overflow-x: clip;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
  scrollbar-gutter: stable;
  container-type: inline-size;
`;

const CalendarMonthBlock = styled.section`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

const CalendarMonthTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
  text-transform: capitalize;
`;

const CalendarWeekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;

  @container (inline-size <= 520px) {
    gap: 4px;
  }
`;

const Weekday = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
  min-width: 0;

  @container (inline-size <= 520px) {
    gap: 4px;
  }
`;

const EmptyDay = styled.div`
  min-height: 54px;

  @container (inline-size <= 520px) {
    min-height: 46px;
  }
`;

const CalendarDay = styled.div<{ $hasPayment?: boolean; $isNext?: boolean }>`
  display: grid;
  gap: 4px;
  align-content: start;
  min-height: 54px;
  padding: 6px;
  background: ${({ $isNext, $hasPayment }) =>
    $isNext ? '#e6f7ff' : $hasPayment ? '#f0fdf4' : '#fff'};
  border: 1px solid
    ${({ $isNext, $hasPayment }) =>
      $isNext ? '#91caff' : $hasPayment ? '#bbf7d0' : '#edf0f3'};
  border-radius: 6px;
  min-width: 0;

  @container (inline-size <= 520px) {
    min-height: 46px;
    padding: 4px;
  }
`;

const DayNumber = styled.span`
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
`;

const DayBadge = styled.span<{ $isNext?: boolean }>`
  width: max-content;
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  color: ${({ $isNext }) => ($isNext ? '#0958d9' : '#166534')};
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: ${({ $isNext }) => ($isNext ? '#d6e4ff' : '#dcfce7')};
  border-radius: 999px;

  @container (inline-size <= 520px) {
    padding-inline: 4px;
    font-size: 10px;
  }
`;

export default PaymentDatesOverview;
