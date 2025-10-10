import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import { selectDeleteModalState } from '../features/productStock/deleteProductStockSlice';
import { getBatchById } from '../firebase/warehouse/batchService';
import { getProductStockById, getProductStockByBatch } from '../firebase/warehouse/productStockService';

export const useProductStockData = () => {
    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { productStockId, batchId, actionType, isOpen } = useSelector(selectDeleteModalState);
    const user = useSelector(selectUser);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadData = async () => {
            if (!isOpen) return;
            
            try {
                setIsLoading(true);
                setError(null);

                if (actionType === 'batch' && batchId) {
                    const [batchInfo, batchStocks] = await Promise.all([
                        getBatchById(user, batchId, controller.signal),
                        getProductStockByBatch(user, { batchId }, controller.signal)
                    ]);

                    if (isMounted) {
                        setStockData({
                            quantity: batchStocks.reduce((acc, stock) => acc + stock.quantity, 0),
                            locations: batchStocks.length,
                            expirationDate: batchInfo?.expirationDate,
                            batchNumber: batchInfo?.batchNumber,
                            numberId: batchInfo?.numberId,
                            batchId,
                            originalData: {
                                batch: batchInfo,
                                items: batchStocks
                            }
                        });
                    }
                } 
                else if (actionType === 'productStock' && productStockId) {
                    const stock = await getProductStockById(user, productStockId, controller.signal);
                    const batchInfo = stock?.batchId 
                        ? await getBatchById(user, stock.batchId, controller.signal)
                        : null;

                    if (isMounted) {
                        setStockData({
                            quantity: stock?.quantity || 0,
                            locations: 1,
                            expirationDate: batchInfo?.expirationDate,
                            batchNumber: batchInfo?.batchNumber,
                            numberId: stock?.batchNumberId,
                            productStockId,
                            originalData: {
                                stock,
                                batch: batchInfo
                            }
                        });
                    }
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    console.error('Error loading stock data:', error);
                    setError(error);
                    setStockData(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (isOpen && (
            (productStockId && actionType === 'productStock') || 
            (batchId && actionType === 'batch'))
        ) {
            loadData();
        }

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [productStockId, batchId, actionType, user, isOpen]);

    return { data: stockData, isLoading, error };
};