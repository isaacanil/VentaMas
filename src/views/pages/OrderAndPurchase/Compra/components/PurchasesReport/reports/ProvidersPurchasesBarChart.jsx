import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import React, { useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import Typography from '@/views/templates/system/Typografy/Typografy';


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
                        label += " " + formatPrice(context.parsed.y);
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
    const normalizedPurchases = useMemo(() => Array.isArray(purchases) ? purchases : [], [purchases]);

    const purchasesByProvider = useMemo(
        () => accumulatePurchaseDataByProvider(normalizedPurchases),
        [normalizedPurchases],
    );
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

    if (!normalizedPurchases.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras Totales por Proveedor</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
