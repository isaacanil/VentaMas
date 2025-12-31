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
                text: 'Fecha',
            },
        },
    },
    plugins: {
        tooltip: {
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ' ' + formatPrice(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    }
};

const getPurchaseDate = (purchaseData) => {
    if (!purchaseData) return null;

    const dateValue =
        purchaseData?.dates?.createdAt ??
        purchaseData?.createdAt ??
        purchaseData?.date ??
        purchaseData?.deliveryAt ??
        purchaseData?.paymentAt ??
        purchaseData?.deliveryDate ??
        purchaseData?.paymentDate;

    if (!dateValue) return null;

    const timestamp =
        typeof dateValue === 'number'
            ? dateValue
            : typeof dateValue?.toMillis === 'function'
                ? dateValue.toMillis()
                : new Date(dateValue).getTime();

    if (!Number.isFinite(timestamp)) return null;

    return new Date(timestamp);
};

const getPurchaseTotal = (purchaseData) => {
    const totals = [
        purchaseData?.total,
        purchaseData?.totalPurchase,
        purchaseData?.totalPurchase?.value,
    ].map((value) => Number(value) || 0);

    const replenishmentTotal = Array.isArray(purchaseData?.replenishments)
        ? purchaseData.replenishments.reduce((sum, item) => {
            const subtotal = Number(item?.subtotal) || 0;
            const fallback = (Number(item?.cost) || 0) * (Number(item?.newStock) || Number(item?.quantity) || 0);
            return sum + (subtotal || fallback);
        }, 0)
        : 0;

    const directTotal = totals.find((value) => value > 0) ?? 0;

    return directTotal || replenishmentTotal;
};

const accumulatePurchaseDataByDay = (purchases) => {
    return purchases.reduce((acc, purchase) => {
        const purchaseData = purchase?.data ?? purchase;
        const date = getPurchaseDate(purchaseData);
        if (!date) return acc;

        const total = getPurchaseTotal(purchaseData);
        const dayKey = date.toISOString().split('T')[0];
        const displayDate = purchaseData?.displayDate || date.toLocaleDateString();

        if (!acc[dayKey]) {
            acc[dayKey] = { total: 0, label: displayDate };
        }

        acc[dayKey].total += total;

        return acc;
    }, {});
};

export const DailyPurchasesBarChart = ({ purchases }) => {
    const normalizedPurchases = useMemo(
        () => (Array.isArray(purchases) ? purchases : []),
        [purchases],
    );

    const purchasesByDay = useMemo(
        () => accumulatePurchaseDataByDay(normalizedPurchases),
        [normalizedPurchases],
    );

    const sortedKeys = useMemo(
        () => Object.keys(purchasesByDay).sort((a, b) => a.localeCompare(b)),
        [purchasesByDay],
    );

    const data = useMemo(() => {
        const labels = sortedKeys.map((key) => purchasesByDay[key].label);
        const totals = sortedKeys.map((key) => purchasesByDay[key].total);

        return {
            labels,
            datasets: [
                {
                    label: 'Compras',
                    data: totals,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [purchasesByDay, sortedKeys]);

    const chartRef = useRef(null);

    if (!normalizedPurchases.length || !sortedKeys.length) {
        return null;
    }

    return (
        <Container>
            <Typography variant='h3'>Compras totales por dia</Typography>
            <Bar ref={chartRef} data={data} options={options} />
        </Container>
    );
};

const Container = styled.div`
    display: grid;
    gap: 1em;
    height: 200px;
`;
