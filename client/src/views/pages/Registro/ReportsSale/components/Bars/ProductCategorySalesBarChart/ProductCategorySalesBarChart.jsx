import { Bar } from 'react-chartjs-2'
import React, { useEffect, useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';
import { getTotalPrice } from '../../../../../../../utils/pricing';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ventas ($) ',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Categoría de Producto',
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) {
            label += " " + useFormatPrice(context.parsed.y);
          }
          return label;
        }
      }
    }
  }
};

  


const accumulateCategorySalesData = (sales) => {
  return sales.reduce((acc, sale) => {
    sale.data.products.forEach(product => {
      const category = product?.category;
      const price = product?.pricing?.price;
      const taxPercent = product?.pricing?.tax;
      const amountToBuy = product?.amountToBuy
      acc[category] = (acc[category] || 0) + getTotalPrice(price, taxPercent, 0, amountToBuy);
    });
    return acc;
  }, {});
};

export const ProductCategorySalesBarChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
      return null;  // or some fallback UI
    }

  const salesByCategory = useMemo(() => accumulateCategorySalesData(sales), [sales]);

  const data = useMemo(() => {
    const labels = Object.keys(salesByCategory);
    const dataTotals = labels.map(label => salesByCategory[label]);

    return {
      labels,
      datasets: [{
        label: 'Ventas ',
        data: dataTotals,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  }, [salesByCategory]);

  return (
    <Container>
      <Typography variant='h3'>Ventas por Categoría de Producto</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
    height: 200px;
  
    display: grid;
    gap: 1em;
`;
