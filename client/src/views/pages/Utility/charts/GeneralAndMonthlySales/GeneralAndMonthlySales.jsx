import React from 'react';
import TotalSalesChart from './charts/TotalSalesChart';
import MonthlySalesChart from './charts/MonthlySalesChart';
import styled from 'styled-components';
import Typography from '../../../../templates/system/Typografy/Typografy';


const GeneralAndMonthlySales = ({ invoices }) => {
    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.data.totalPurchase.value, 0);

    return (
        <Container>
            <Typography variant='h3'>Tendencia de Ventas Mensuales y Resumen Total</Typography>
            <Group>
                <TotalSalesChart totalSales={totalSales} />
                <MonthlySalesChart invoices={invoices} />
            </Group>
        </Container>
    );
};

export default GeneralAndMonthlySales;

const Container = styled.div`
    height: 200px;
    display: grid;
`;
const Group = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;

  gap: 1em;
`
