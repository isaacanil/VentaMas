// Suponiendo que tus slices estén en archivos separados y este código vaya en cartSlice.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTaxReceiptEnabled } from '../taxReceipt/taxReceiptSlice';

import { setTaxReceiptEnabled } from './cartSlice';

export const taxReceiptEnabledToCart = createAsyncThunk(
  'cart/fetchAndStoreTaxReceiptEnabled',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const taxReceiptEnabled = state.taxReceipt.settings.taxReceiptEnabled; // Ajusta este camino según cómo esté estructurado tu estado
    dispatch(setTaxReceiptEnabled(taxReceiptEnabled));
  },
);

export const useTaxReceiptEnabledToCart = () => {
  const taxReceipt = useSelector(selectTaxReceiptEnabled);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setTaxReceiptEnabled(taxReceipt));
  }, [taxReceipt, dispatch]);
};
