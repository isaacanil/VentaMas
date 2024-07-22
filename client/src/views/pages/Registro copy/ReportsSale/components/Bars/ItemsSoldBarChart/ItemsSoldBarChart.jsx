import { Bar } from 'react-chartjs-2'
import React, { useEffect, useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ítems Vendidos',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Categoría de Producto',
      },
    },
  },
};

const accumulateItemsSoldData = (sales) => {
  return sales.reduce((acc, sale) => {
    sale.data.products.forEach(product => {
      const category = product.category;
      acc[category] = (acc[category] || 0) + product.amountToBuy.total;
    });
    return acc;
  }, {});
};

export const ItemsSoldBarChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
      return null;  // or some fallback UI
    }

  const itemsSoldByCategory = useMemo(() => accumulateItemsSoldData(sales), [sales]);

  const data = useMemo(() => {
    const labels = Object.keys(itemsSoldByCategory);
    const dataTotals = labels.map(label => itemsSoldByCategory[label]);

    return {
      labels,
      datasets: [{
        label: 'Ítems Vendidos',
        data: dataTotals,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }]
    };
  }, [itemsSoldByCategory]);

  return (
    <Container>
      <Typography variant='h3'>Ítems Vendidos por Categoría</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
  height: 200px;
`;
