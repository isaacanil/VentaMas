import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const parseTaxValue = (value, fallback = 0) => {
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

const normalizeUnitPricing = (pricing, fallbackTax = 0) => {
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

export const normalizeProductTaxes = async (user, { dryRun = false } = {}) => {
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
    const data = docSnap.data() || {};
    const pricing = data.pricing || {};
    const currentTax = pricing.tax;
    const normalizedTax = parseTaxValue(currentTax, 0);

    const updates = {};
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
        if (!unit.pricing || typeof unit.pricing !== 'object') return unit;
        const normalizedPricing = normalizeUnitPricing(
          unit.pricing,
          normalizedTax,
        );
        if (normalizedPricing !== unit.pricing) {
          saleUnitsChanged = true;
          summary.saleUnitsUpdated += 1;
          return {
            ...unit,
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

    if (
      data.selectedSaleUnit &&
      typeof data.selectedSaleUnit === 'object' &&
      data.selectedSaleUnit.pricing
    ) {
      const normalizedSelectedPricing = normalizeUnitPricing(
        data.selectedSaleUnit.pricing,
        updates['pricing.tax'] ?? normalizedTax,
      );
      if (normalizedSelectedPricing !== data.selectedSaleUnit.pricing) {
        updates.selectedSaleUnit = {
          ...data.selectedSaleUnit,
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
