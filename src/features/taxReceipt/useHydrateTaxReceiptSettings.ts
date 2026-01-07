import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  setTaxReceiptSettingsLoaded,
  toggleTaxReceiptSettings,
} from './taxReceiptSlice';

// Hidrata el estado taxReceiptEnabled desde localStorage lo antes posible,
// para evitar valores incorrectos en cargas directas, antes de que Firestore responda.
export function useHydrateTaxReceiptSettings() {
  const dispatch = useDispatch();
  useEffect(() => {
    try {
      const saved = localStorage.getItem('taxReceiptEnabled');
      if (saved !== null) {
        const value = JSON.parse(saved);
        dispatch(toggleTaxReceiptSettings(!!value));
      } else {
        // Si no hay valor guardado, marcamos como cargado pero con el default conservador.
        dispatch(setTaxReceiptSettingsLoaded(true));
      }
    } catch {
      dispatch(setTaxReceiptSettingsLoaded(true));
    }
  }, [dispatch]);
}
