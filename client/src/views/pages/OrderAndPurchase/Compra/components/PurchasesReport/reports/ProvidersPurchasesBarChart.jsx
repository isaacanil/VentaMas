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
                text: 'Proveedor',
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

const accumulatePurchaseDataByProvider = (purchases) => {
    return purchases.reduce((acc, purchase) => {
        const providerName = purchase.data.provider.name;
        acc[providerName] = acc[providerName] || { total: 0 };
        acc[providerName].total += purchase.data.total;
        return acc;
    }, {});
};

export const ProviderPurchasesBarChart = ({ purchases }) => {
    if (!purchases || !Array.isArray(purchases)) {
        return null;
    }

    const purchasesByProvider = useMemo(() => accumulatePurchaseDataByProvider(purchases), [purchases]);
    const data = useMemo(() => {
        const labels = Object.keys(purchasesByProvider);
        const dataTotals = labels.map(label => purchasesByProvider[label].total);

        return {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: dataTotals,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ]
        };
    }, [purchasesByProvider]);

    const chartRef = useRef(null);

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Proveedor</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
