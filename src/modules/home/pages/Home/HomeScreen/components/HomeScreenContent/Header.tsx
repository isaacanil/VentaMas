import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import * as firebaseConfig from '@/firebase/firebaseconfig';
import { getSalesForCurrentDay } from '@/utils/sales';

import type { Dispatch, SetStateAction } from 'react';

interface BillsDateRange {
  startDate: number;
  endDate: number;
}

type GetBills = (
  setBills: Dispatch<SetStateAction<unknown[]>>,
  dateRange: BillsDateRange,
) => void;

const getBills = (firebaseConfig as { getBills?: GetBills }).getBills;

// Obtener la fecha y hora actual
const today = DateTime.local();

// Obtener la fecha de ayer a la primera hora
const startDate = today.minus({ days: 1 }).startOf('day').toMillis();

// Obtener la fecha de hoy a la última hora
const endDate = today.endOf('day').toMillis();

export const Header = () => {
  const [bills, setBills] = useState<unknown[]>([]);
  const [date] = useState<BillsDateRange>({ startDate, endDate });
  useEffect(() => {
    if (getBills) {
      getBills(setBills, date);
    }
  }, [date]);
  const { salesForCurrentDay, growthPercentage } = getSalesForCurrentDay(bills);
  const saleQuantity = bills.length;
  return (
    <Container>
      {/* {formatPrice(salesForCurrentDay)} */}
      {saleQuantity}
      {' salesforCurrent==>' + salesForCurrentDay}
      {'griw ==> ' + growthPercentage}
      {JSON.stringify(bills)}
      {/* <CardWithPercent title={} icon={} number={getDailySales().dailySalesTotal}/> */}
    </Container>
  );
};
const Container = styled.div``;
