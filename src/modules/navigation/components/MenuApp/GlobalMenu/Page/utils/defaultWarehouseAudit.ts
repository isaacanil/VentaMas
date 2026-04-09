import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

export type AuditSummary = {
  scanned: number;
  missing: number;
  fixed?: number;
  created?: number;
  setDefault?: number;
  errors?: number;
  dryRun?: boolean;
};

type WarehouseAuditResult = {
  errorMessage?: string;
  successMessage?: string;
  summary: AuditSummary | null;
};

const ensureDefaultWarehousesCallable = httpsCallable(
  functions,
  'ensureDefaultWarehousesForBusinesses',
);

export const fetchDefaultWarehouseAuditSummary =
  async (): Promise<WarehouseAuditResult> => {
    try {
      const response = await ensureDefaultWarehousesCallable({
        dryRun: true,
        limit: 500,
      });

      return {
        summary: response.data as AuditSummary,
      };
    } catch (error) {
      console.error('Error revisando negocios sin almacen por defecto:', error);
      return {
        errorMessage: 'No se pudo revisar negocios sin almacen por defecto.',
        summary: null,
      };
    }
  };

export const ensureDefaultWarehouses =
  async (): Promise<WarehouseAuditResult> => {
    try {
      const response = await ensureDefaultWarehousesCallable({
        dryRun: false,
        limit: 500,
      });

      return {
        successMessage: 'Operacion completada.',
        summary: response.data as AuditSummary,
      };
    } catch (error) {
      console.error('Error creando almacenes por defecto:', error);
      return {
        errorMessage: 'No se pudieron crear almacenes por defecto.',
        summary: null,
      };
    }
  };
