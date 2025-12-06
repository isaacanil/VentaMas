import { message } from 'antd';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import {
  generateAutoBarcode,
  previewNextItemReference,
} from '../../firebase/barcode/barcodeGeneration';
import {
  getBarcodeSettings,
  setBarcodeSettings,
} from '../../firebase/barcode/barcodeSettings';

/**
 * Hook para manejar la configuración de códigos de barras
 * @returns {Object} Estado y funciones para manejar códigos de barras
 */
export const useBarcodeSettings = () => {
  const user = useSelector(selectUser);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextItemReference, setNextItemReference] = useState('');

  // Cargar configuración al montar el componente
  useEffect(() => {
    if (user?.businessID) {
      loadSettings();
    }
  }, [user?.businessID]);

  /**
   * Carga la configuración desde Firebase
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const config = await getBarcodeSettings(user);
      setSettings(config);

      // Cargar el preview del próximo Item Reference SIEMPRE
      try {
        const nextRef = await previewNextItemReference(user);
        setNextItemReference(nextRef);
      } catch (previewError) {
        console.warn(
          'Error al obtener preview del Item Reference:',
          previewError,
        );
        setNextItemReference('000000001');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar configuración de códigos de barras:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guarda la configuración en Firebase
   * @param {Object} newSettings - Nueva configuración
   */
  const saveSettings = async (newSettings) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Guardando configuración:', newSettings);
      await setBarcodeSettings(user, newSettings);

      // Actualizar el estado inmediatamente con la configuración guardada
      setSettings(newSettings);

      // Actualizar preview del próximo Item Reference siempre
      try {
        const nextRef = await previewNextItemReference(user);
        setNextItemReference(nextRef);
      } catch (previewError) {
        console.warn(
          'Error al obtener preview del Item Reference:',
          previewError,
        );
        setNextItemReference('000000001');
      }

      message.success('Configuración guardada exitosamente');
      console.log('Configuración guardada y estado actualizado:', newSettings);
    } catch (err) {
      setError(err.message);
      message.error('Error al guardar la configuración');
      console.error('Error al guardar configuración:', err);
      throw err; // Re-throw para que el componente pueda manejar el error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Genera un código de barras automático
   * @param {string} companyPrefix - Prefijo de empresa (opcional)
   * @returns {Promise<Object>} Código generado
   */
  const generateBarcode = async (companyPrefix = null) => {
    try {
      const result = await generateAutoBarcode(user, companyPrefix);

      // Actualizar el preview del próximo Item Reference
      const nextRef = await previewNextItemReference(user);
      setNextItemReference(nextRef);

      return result;
    } catch (err) {
      message.error('Error al generar código de barras');
      throw err;
    }
  };

  /**
   * Actualiza solo el company prefix
   * @param {string} companyPrefix - Nuevo company prefix
   */
  const updateCompanyPrefix = async (companyPrefix) => {
    try {
      const updatedSettings = {
        ...settings,
        companyPrefix,
      };

      await saveSettings(updatedSettings);
    } catch (err) {
      message.error('Error al actualizar Company Prefix');
      throw err;
    }
  };

  /**
   * Verifica si la configuración está completa
   * @returns {boolean} True si está configurado
   */
  const isConfigured = () => {
    return (
      settings &&
      settings.companyPrefix &&
      settings.companyPrefixLength &&
      settings.itemReferenceLength
    );
  };

  /**
   * Recarga la configuración
   */
  const refresh = () => {
    loadSettings();
  };

  return {
    // Estado
    settings,
    loading,
    error,
    nextItemReference,

    // Funciones
    loadSettings,
    saveSettings,
    generateBarcode,
    updateCompanyPrefix,
    refresh,

    // Utilidades
    isConfigured: isConfigured(),
  };
};

export default useBarcodeSettings;
