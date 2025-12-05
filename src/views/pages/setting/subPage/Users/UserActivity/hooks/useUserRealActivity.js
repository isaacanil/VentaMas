import { useCallback, useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { db } from '../../../../../../../firebase/firebaseconfig';

export const useUserRealActivity = ({ userId, businessId }) => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({
        radar: {
            sales: 0,
            products: 0,
            purchases: 0,
            expenses: 0,
            ar: 0,
        },
        heatmap: {}, // { "day-hour": count }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchActivity = useCallback(async () => {
        if (!userId || !businessId) return;

        setLoading(true);
        setError(null);

        try {
            // Products Query
            const productsQuery = query(
                collection(db, 'businesses', businessId, 'products'),
                where('createdBy', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(100),
            );

            // Sales Query
            const salesQuery = query(
                collection(db, 'businesses', businessId, 'sales'),
                where('audit.createdBy', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(100),
            );

            // Purchases Query
            const purchasesQuery = query(
                collection(db, 'businesses', businessId, 'purchases'),
                where('createdBy', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(100),
            );

            // Expenses Query
            const expensesQuery = query(
                collection(db, 'businesses', businessId, 'expenses'),
                where('expense.createdBy', '==', userId),
                orderBy('expense.dates.createdAt', 'desc'),
                limit(100),
            );

            // Accounts Receivable Query
            const arQuery = query(
                collection(db, 'businesses', businessId, 'accountsReceivable'),
                where('createdBy', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(100),
            );

            const [
                productsResult,
                salesResult,
                purchasesResult,
                expensesResult,
                arResult,
            ] = await Promise.allSettled([
                getDocs(productsQuery),
                getDocs(salesQuery),
                getDocs(purchasesQuery),
                getDocs(expensesQuery),
                getDocs(arQuery),
            ]);

            let newActivities = [];

            // Process Products
            if (productsResult.status === 'fulfilled') {
                productsResult.value.forEach((doc) => {
                    const data = doc.data();
                    const timestamp = data.createdAt?.toDate
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);

                    newActivities.push({
                        id: doc.id,
                        type: 'product',
                        action: 'created',
                        details: `Producto creado: ${data.name || 'Sin nombre'}`,
                        timestamp,
                        raw: data,
                    });
                });
            }

            // Process Sales
            if (salesResult.status === 'fulfilled') {
                salesResult.value.forEach((doc) => {
                    const data = doc.data();
                    const timestamp = data.createdAt?.toDate
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);

                    newActivities.push({
                        id: doc.id,
                        type: 'sale',
                        action: 'created',
                        details: `Venta registrada: ${data.totalAmount} ${data.currency || 'USD'
                            }`,
                        timestamp,
                        raw: data,
                    });
                });
            }

            // Process Purchases
            if (purchasesResult.status === 'fulfilled') {
                purchasesResult.value.forEach((doc) => {
                    const data = doc.data();
                    const timestamp = data.createdAt?.toDate
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);

                    newActivities.push({
                        id: doc.id,
                        type: 'purchase',
                        action: 'created',
                        details: `Compra registrada: ${data.total || 0}`,
                        timestamp,
                        raw: data,
                    });
                });
            }

            // Process Expenses
            if (expensesResult.status === 'fulfilled') {
                expensesResult.value.forEach((doc) => {
                    const rootData = doc.data();
                    const data = rootData.expense || rootData;
                    const timestamp = data.dates?.createdAt?.toDate
                        ? data.dates.createdAt.toDate()
                        : new Date();

                    newActivities.push({
                        id: doc.id,
                        type: 'expense',
                        action: 'created',
                        details: `Gasto registrado: ${data.amount || 0} (${data.category || 'Sin categoría'
                            })`,
                        timestamp,
                        raw: data,
                    });
                });
            }

            // Process Accounts Receivable
            if (arResult.status === 'fulfilled') {
                arResult.value.forEach((doc) => {
                    const data = doc.data();
                    const timestamp = data.createdAt?.toDate
                        ? data.createdAt.toDate()
                        : new Date(data.createdAt);

                    newActivities.push({
                        id: doc.id,
                        type: 'ar',
                        action: 'created',
                        details: `Cuenta por cobrar: ${data.totalReceivable || 0}`,
                        timestamp,
                        raw: data,
                    });
                });
            }

            // Sort combined results
            newActivities.sort((a, b) => b.timestamp - a.timestamp);

            // Calculate Stats
            const radar = {
                sales: 0,
                products: 0,
                purchases: 0,
                expenses: 0,
                ar: 0,
            };
            const heatmap = {};

            newActivities.forEach((item) => {
                // Radar Stats
                if (item.type === 'sale') radar.sales++;
                if (item.type === 'product') radar.products++;
                if (item.type === 'purchase') radar.purchases++;
                if (item.type === 'expense') radar.expenses++;
                if (item.type === 'ar') radar.ar++;

                // Heatmap Stats
                const date = new Date(item.timestamp);
                const day = date.getDay(); // 0-6 (Sun-Sat)
                const hour = date.getHours(); // 0-23
                const key = `${day}-${hour}`;
                heatmap[key] = (heatmap[key] || 0) + 1;
            });

            setStats({ radar, heatmap });
            setActivities(newActivities);
        } catch (err) {
            console.error('Error in useUserRealActivity:', err);
            setError('Error al cargar la actividad reciente.');
        } finally {
            setLoading(false);
        }
    }, [userId, businessId]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    return { activities, stats, error, loading, refetch: fetchActivity };
};
