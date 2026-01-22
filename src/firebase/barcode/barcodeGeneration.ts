import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { generateGTIN13RD } from '@/utils/barcode/barcode';
import type { UserIdentity } from '@/types/users';

import { getBarcodeSettings } from './barcodeSettings';
import type { BarcodeSettings } from './types';

interface BarcodeGenerationResult {
  fullCode: string;
  companyPrefix: string;
  itemReference: string;
  configuration: {
    companyPrefixLength?: number;
    itemReferenceLength?: number;
    name?: string;
  };
}

interface CounterDoc {
  value: number;
}

/**
 * Genera automaticamente el siguiente Item Reference para un negocio
 */
export const generateNextItemReference = async (
  user: UserIdentity | null | undefined,
): Promise<string> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    // Obtener configuracion de codigos de barras (opcional)
    const barcodeSettings = await getBarcodeSettings(user).catch(() => null);

    // Obtener el siguiente ID del contador
    const nextId = await getNextID(user, 'lastItemReference', 1);

    // Formatear el ID con ceros a la izquierda segun la longitud configurada
    const length = barcodeSettings?.itemReferenceLength ?? 9;
    const paddedId = String(nextId).padStart(length, '0');

    return paddedId;
  } catch (error) {
    console.error(
      '[barcodeGeneration] Error al generar Item Reference:',
      error,
    );
    throw error;
  }
};

/**
 * Genera un codigo de barras completo automaticamente
 */
export const generateAutoBarcode = async (
  user: UserIdentity | null | undefined,
  companyPrefix: string | null = null,
): Promise<BarcodeGenerationResult> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    // Obtener configuracion guardada
    const barcodeSettings = await getBarcodeSettings(user);

    if (!barcodeSettings) {
      throw new Error(
        'Configuracion de codigos de barras no encontrada. Configure primero su empresa.',
      );
    }

    // Usar el companyPrefix proporcionado o el guardado
    const finalCompanyPrefix = companyPrefix || barcodeSettings.companyPrefix;

    if (!finalCompanyPrefix) {
      throw new Error(
        'Company Prefix no configurado. Configure primero su empresa.',
      );
    }

    // Generar el siguiente Item Reference
    const itemReference = await generateNextItemReference(user);

    // Generar el codigo completo
    const fullCode = generateGTIN13RD(finalCompanyPrefix, itemReference);

    return {
      fullCode,
      companyPrefix: finalCompanyPrefix,
      itemReference,
      configuration: {
        companyPrefixLength: barcodeSettings.companyPrefixLength,
        itemReferenceLength: barcodeSettings.itemReferenceLength,
        name: barcodeSettings.name,
      },
    };
  } catch (error) {
    console.error(
      '[barcodeGeneration] Error al generar codigo automatico:',
      error,
    );
    throw error;
  }
};

/**
 * Valida si un Item Reference es valido segun la configuracion actual
 */
export const validateItemReference = async (
  user: UserIdentity | null | undefined,
  itemReference: string,
): Promise<boolean> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    const barcodeSettings = await getBarcodeSettings(user);

    if (!barcodeSettings) {
      return false;
    }

    // Validar longitud
    if (itemReference.length !== barcodeSettings.itemReferenceLength) {
      return false;
    }

    // Validar que solo contenga numeros
    return /^\d+$/.test(itemReference);
  } catch (error) {
    console.error(
      '[barcodeGeneration] Error al validar Item Reference:',
      error,
    );
    return false;
  }
};

/**
 * Obtiene el proximo Item Reference sin incrementar el contador
 */
export const previewNextItemReference = async (
  user: UserIdentity | null | undefined,
): Promise<string> => {
  if (!user?.businessID) {
    throw new Error('BusinessID no encontrado');
  }

  try {
    // Configuracion opcional; si no existe, usar longitud 9 por defecto
    const barcodeSettings = await getBarcodeSettings(user).catch(() => null);

    // Obtener el valor actual del contador directamente desde Firebase
    const counterRef = doc<CounterDoc>(
      db,
      'businesses',
      user.businessID,
      'counters',
      'lastItemReference',
    );
    const counterSnap = await getDoc(counterRef);

    const currentValue = counterSnap.data()?.value ?? 0;
    const previewId = currentValue + 1;

    const length = barcodeSettings?.itemReferenceLength ?? 9;
    return String(previewId).padStart(length, '0');
  } catch (error) {
    console.error(
      '[barcodeGeneration] Error al obtener preview del Item Reference:',
      error,
    );
    throw error;
  }
};

export const fbBarcodeGeneration = {
  generateNextItemReference,
  generateAutoBarcode,
  validateItemReference,
  previewNextItemReference,
};
