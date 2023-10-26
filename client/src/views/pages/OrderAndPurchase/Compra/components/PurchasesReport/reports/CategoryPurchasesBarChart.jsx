import { Bar } from 'react-chartjs-2';
import React, { useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Monto de Compras',
            },
        },
        x: {
            title: {
                display: true,
                text: 'Categoría',
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

const accumulatePurchaseDataByCategory = (purchases) => {
    return purchases.reduce((acc, purchase) => {
        purchase.data.replenishments.forEach(replenishment => {
            const category = replenishment.category;  // Asumiendo que cada replenishment tiene una propiedad 'category'
            acc[category] = acc[category] || { total: 0 };
            acc[category].total += replenishment.cost * replenishment.newStock;  // Asumiendo que el total por categoría es el cost por la cantidad de stock nuevo
        });
        return acc;
    }, {});
};

export const CategoryPurchasesBarChart = ({ purchases }) => {
    if (!purchases || !Array.isArray(purchases)) {
        return null;
    }

    const purchasesByCategory = useMemo(() => accumulatePurchaseDataByCategory(purchases), [purchases]);
    const data = useMemo(() => {
        const labels = Object.keys(purchasesByCategory);
        const dataTotals = labels.map(label => purchasesByCategory[label].total);

        return {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: dataTotals,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                },
            ]
        };
    }, [purchasesByCategory]);

    const chartRef = useRef(null);

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Categoría</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
