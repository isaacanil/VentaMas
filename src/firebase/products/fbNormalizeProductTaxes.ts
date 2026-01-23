import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

const parseTaxValue = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[%\s]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      if (parsed > 0 && parsed < 1) return Number((parsed * 100).toFixed(2));
      return Number(parsed.toFixed(2));
    }
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric > 0 && numeric < 1) return Number((numeric * 100).toFixed(2));
    return Number(numeric.toFixed(2));
  }
  return fallback;
};

const normalizeUnitPricing = (
  pricing: Record<string, unknown> | null | undefined,
  fallbackTax = 0,
): Record<string, unknown> | null | undefined => {
  if (!pricing || typeof pricing !== 'object') return pricing;
  const normalizedTax = parseTaxValue(pricing.tax, fallbackTax);
  if (typeof pricing.tax === 'number' && pricing.tax === normalizedTax) {
    return pricing;
  }
  return {
    ...pricing,
    tax: normalizedTax,
  };
};

export const normalizeProductTaxes = async (
  user: UserWithBusiness | null | undefined,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<{
  total: number;
  mainUpdated: number;
  productsUpdated: number;
  saleUnitsUpdated: number;
  selectedUnitUpdated: number;
  skipped: number;
  dryRun: boolean;
}> => {
  if (!user?.businessID) {
    throw new Error('No se encontró un negocio válido para el usuario.');
  }

  const productsRef = collection(
    db,
    'businesses',
    String(user.businessID),
    'products',
  );
  const snapshot = await getDocs(productsRef);

  if (snapshot.empty) {
    return {
      total: 0,
      mainUpdated: 0,
      productsUpdated: 0,
      saleUnitsUpdated: 0,
      selectedUnitUpdated: 0,
      skipped: 0,
      dryRun,
    };
  }

  let batch = writeBatch(db);
  let operations = 0;

  const summary = {
    total: snapshot.size,
    mainUpdated: 0,
    productsUpdated: 0,
    saleUnitsUpdated: 0,
    selectedUnitUpdated: 0,
    skipped: 0,
    dryRun,
  };

  const commitBatch = async () => {
    if (operations === 0 || dryRun) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const pricing = (data.pricing as Record<string, unknown>) || {};
    const currentTax = pricing.tax;
    const normalizedTax = parseTaxValue(currentTax, 0);

    const updates: Record<string, unknown> = {};
    let hasChanges = false;

    if (typeof currentTax !== 'number' || currentTax !== normalizedTax) {
      updates['pricing.tax'] = normalizedTax;
      summary.mainUpdated += 1;
      hasChanges = true;
    }

    let saleUnitsChanged = false;
    if (Array.isArray(data.saleUnits) && data.saleUnits.length > 0) {
      const normalizedSaleUnits = data.saleUnits.map((unit) => {
        if (!unit || typeof unit !== 'object') return unit;
        const unitRecord = unit as Record<string, unknown>;
        if (!unitRecord.pricing || typeof unitRecord.pricing !== 'object') {
          return unit;
        }
        const normalizedPricing = normalizeUnitPricing(
          unitRecord.pricing as Record<string, unknown>,
          normalizedTax,
        );
        if (normalizedPricing !== unitRecord.pricing) {
          saleUnitsChanged = true;
          summary.saleUnitsUpdated += 1;
          return {
            ...unitRecord,
            pricing: normalizedPricing,
          };
        }
        return unit;
      });
      if (saleUnitsChanged) {
        updates.saleUnits = normalizedSaleUnits;
        hasChanges = true;
      }
    }

    const selectedSaleUnit = data.selectedSaleUnit as
      | { pricing?: Record<string, unknown> }
      | undefined;
    if (selectedSaleUnit && typeof selectedSaleUnit === 'object') {
      const normalizedSelectedPricing = normalizeUnitPricing(
        selectedSaleUnit.pricing,
        (updates['pricing.tax'] as number | undefined) ?? normalizedTax,
      );
      if (normalizedSelectedPricing !== selectedSaleUnit.pricing) {
        updates.selectedSaleUnit = {
          ...selectedSaleUnit,
          pricing: normalizedSelectedPricing,
        };
        summary.selectedUnitUpdated += 1;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      summary.skipped += 1;
      continue;
    }

    summary.productsUpdated += 1;

    if (dryRun) continue;

    const productRef = doc(
      db,
      'businesses',
      String(user.businessID),
      'products',
      docSnap.id,
    );
    batch.update(productRef, updates);
    operations += 1;
    if (operations >= 400) {
      await commitBatch();
    }
  }

  await commitBatch();
  return summary;
};
