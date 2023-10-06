import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../../templates/system/Typografy/Typografy';


Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { title: { display: true, text: 'Ventas ($)', }, },
    x: { title: { display: true, text: 'Cliente', }, },
  },
};

const accumulateGenericCustomerSalesData = (sales) => {
  return sales.reduce((acc, sale) => {
    const customerName = sale.data.client.name.toLowerCase();

    if (customerName.includes('generico') || customerName.includes('genérico') || customerName.includes('generic client')) {
      acc['Generico'] = (acc['Generico'] || 0) + sale.data.totalPurchase.value;
    }
    
    return acc;
  }, {});
};


export const GenericCustomerSalesChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
    return null;  // or some fallback UI
  }

  const salesByGenericCustomer = useMemo(() => accumulateGenericCustomerSalesData(sales), [sales]);

  const data = useMemo(() => {
    const labels = Object.keys(salesByGenericCustomer);
    const dataTotals = labels.map(label => salesByGenericCustomer[label]);

    return {
      labels,
      datasets: [{
        label: 'Ventas ($)',
        data: dataTotals,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }]
    };
  }, [salesByGenericCustomer]);

  return (
    <Container>
      <Typography variant='h4'>Ventas Genéricas</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  height: 200px;
  display: grid;
  gap: 1em;
`;
