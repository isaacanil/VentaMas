// Suponiendo que tus slices estén en archivos separados y este código vaya en cartSlice.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import { setTaxReceiptEnabled } from './cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { selectTaxReceiptEnabled } from '../taxReceipt/taxReceiptSlice';

export const taxReceiptEnabledToCart = createAsyncThunk(
    'cart/fetchAndStoreTaxReceiptEnabled',
    async (_, { getState, dispatch }) => {
        const state = getState();
        const taxReceiptEnabled = state.taxReceipt.settings.taxReceiptEnabled; // Ajusta este camino según cómo esté estructurado tu estado
        console.log("fetch", taxReceiptEnabled);
        dispatch(setTaxReceiptEnabled(taxReceiptEnabled));
    }
);

export const useTaxReceiptEnabledToCart = () => {
    const taxReceipt = useSelector(selectTaxReceiptEnabled)
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(taxReceiptEnabledToCart());
    }, [taxReceipt]);
}