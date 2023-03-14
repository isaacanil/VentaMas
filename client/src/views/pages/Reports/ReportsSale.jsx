import React from 'react';
import { Bar } from 'react-chartjs-2';
const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    sales: [1200, 1800, 900, 2000, 1500, 2200],
  };
const SalesReport = () => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Ventas',
        data: data.sales,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  };

  return (
    <div>
      <h2>Reporte de Ventas</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default SalesReport;