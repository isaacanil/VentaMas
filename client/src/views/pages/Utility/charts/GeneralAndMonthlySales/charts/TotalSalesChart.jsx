// Importando el componente Bar de react-chartjs-2
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';
import Typography from '../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';

const TotalSalesChart = ({ totalSales }) => {
    // Datos para el gráfico de barras
    const chartData = {
        labels: ['Total de Ventas'],
        datasets: [{
            label: 'Ventas Totales',
            data: [totalSales],
            backgroundColor: '#4BC0C0',
            borderColor: '#4BC0C0',
            borderWidth: 1,
        }]
    };

    // Opciones para el gráfico de barras
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Ventas ($)',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Resumen',
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

    // Renderizando el gráfico de barras
    return (
        <Container>
            {/* <Typography variant='h4'>
                Ventas Totales
            </Typography> */}
            <Bar data={chartData} options={options} />
        </Container>
    );
};

export default TotalSalesChart;
const Container = styled.div`
  height: 200px;
  display: grid;
  gap: 1em;
`;
