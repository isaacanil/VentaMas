import type { JSX } from 'react';
import styled from 'styled-components';

import Typography from '@/components/ui/Typografy/Typografy';
import type { UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';
import { getInvoiceTotalValue } from '../utils/invoiceUtils';

import MonthlySalesChart from './charts/MonthlySalesChart';
import TotalSalesChart from './charts/TotalSalesChart';

interface GeneralAndMonthlySalesProps {
  invoices: UtilityInvoiceEntry[];
}

const GeneralAndMonthlySales = ({
  invoices,
}: GeneralAndMonthlySalesProps): JSX.Element => {
  const totalSales = invoices.reduce(
    (sum, invoice) => sum + getInvoiceTotalValue(invoice),
    0,
  );

  return (
    <Container>
      <Typography variant="h3">
        Tendencia de Ventas Mensuales y Resumen Total
      </Typography>
      <Group>
        <TotalSalesChart totalSales={totalSales} />
        <MonthlySalesChart invoices={invoices} />
      </Group>
    </Container>
  );
};

export default GeneralAndMonthlySales;

const Container = styled.div`
  display: grid;
  height: 200px;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1em;
`;
