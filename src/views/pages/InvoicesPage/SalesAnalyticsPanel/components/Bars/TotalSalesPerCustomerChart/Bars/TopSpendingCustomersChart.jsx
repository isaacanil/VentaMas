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

const accumulateSalesPerCustomerData = (sales) => {
    return sales.reduce((acc, sale) => {
      const customerName = sale.data.client.name;
      acc[customerName] = (acc[customerName] || 0) + sale.data.totalPurchase.value;
      return acc;
    }, {});
  };
  const getTop20SpendingCustomers = (sales) => {
    const salesPerCustomer = accumulateSalesPerCustomerData(sales);
  
    // Filtrar out clientes genéricos
    const filteredSalesPerCustomer = Object.entries(salesPerCustomer)
      .filter(([customerName]) => !/generico|generic|genérico/i.test(customerName));
  
    // Ordenar y obtener el Top 20
    return filteredSalesPerCustomer
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  };
  
  
 
  
  export const TopSpendingCustomersChart = ({sales}) => {
    if (!sales || !Array.isArray(sales)) {
        return null;  // or some fallback UI
      }
  
    const top20SpendingCustomers = useMemo(() => getTop20SpendingCustomers(sales), [sales]);
  
    const data = useMemo(() => {
      const labels = Object.keys(top20SpendingCustomers);
      const dataTotals = labels.map(label => top20SpendingCustomers[label]);
  
      return {
        labels,
        datasets: [{
          label: 'Ventas ($)',
          data: dataTotals,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }]
      };
    }, [top20SpendingCustomers]);
  
    return (
      <Container>
        <Typography variant='h4'>Clientes Destacados</Typography>
        <Bar data={data} options={options} />
      </Container>
    );
  };
  
  const Container = styled.div`
      height: 200px;
      display: grid;
      gap: 1em;
  `;
  
 