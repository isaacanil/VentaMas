import { message } from 'antd';

import { fbAddProducts } from '@/firebase/products/fbAddProducts';
import {
  createProductTemplate,
  importProductData,
} from '@/utils/import/product';
import type { UserWithBusiness } from '@/types/users';

import { fbAddActiveIngredients } from '../fbAddActiveIngredients';
import type {
  ImportOptions,
  ImportProgressStats,
  InventoryProduct,
} from '../InventoryMenuToolbar';

type ImportProductsResult = {
  errorMessage?: string;
  importedProducts?: InventoryProduct[];
};

export const runProductImport = async (
  file: File,
  user: UserWithBusiness | null,
  setImportProgress: (progress: ImportProgressStats) => void,
  { dryRun = false }: ImportOptions = {},
): Promise<ImportProductsResult> => {
  try {
    const productData = (await importProductData(
      file,
      'es',
    )) as InventoryProduct[];

    if (dryRun) {
      return {
        importedProducts: productData,
      };
    }

    if (!user?.businessID || !user.uid) {
      return {
        errorMessage: 'No se identificó un negocio para importar productos.',
      };
    }

    await fbAddActiveIngredients(user, productData);
    await fbAddProducts(user, productData, 10000, (progress) => {
      const stats = (progress as { stats?: ImportProgressStats }).stats;
      if (stats) {
        setImportProgress(stats);
      }
    });

    return {
      importedProducts: productData,
    };
  } catch (error) {
    console.error('Error al importar productos:', error);
    return {
      errorMessage: dryRun
        ? undefined
        : 'Hubo un problema al importar el archivo.',
    };
  }
};

export const createInventoryTemplate = async (
  language: 'es' | 'en' = 'es',
  optionalFields: string[] = [],
): Promise<void> => {
  try {
    await createProductTemplate(language, optionalFields);
    message.success('Plantilla creada exitosamente.');
  } catch (error) {
    console.error('Error al crear la plantilla:', error);
    message.error('Hubo un problema al crear la plantilla.');
  }
};
