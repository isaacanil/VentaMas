const WEIGHT_UNIT_TO_KG_FACTOR = Object.freeze({
  g: 0.001,
  gram: 0.001,
  grams: 0.001,
  gramo: 0.001,
  gramos: 0.001,
  kg: 1,
  kilogram: 1,
  kilograms: 1,
  kilo: 1,
  kilos: 1,
  kilogramo: 1,
  kilogramos: 1,
  lb: 0.45359237,
  lbs: 0.45359237,
  libra: 0.45359237,
  libras: 0.45359237,
  pound: 0.45359237,
  pounds: 0.45359237,
  mg: 0.000001,
  milligram: 0.000001,
  milligrams: 0.000001,
  miligramo: 0.000001,
  miligramos: 0.000001,
  oz: 0.028349523125,
  ounce: 0.028349523125,
  ounces: 0.028349523125,
  onza: 0.028349523125,
  onzas: 0.028349523125,
});

const roundWeightQuantity = (value) =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export const normalizeWeightUnitCode = (unit) => {
  if (typeof unit !== 'string' && typeof unit !== 'number') return null;
  const normalized = String(unit).trim().toLowerCase();
  return normalized.length ? normalized : null;
};

export const isSupportedWeightUnit = (unit) => {
  const normalizedUnit = normalizeWeightUnitCode(unit);
  if (!normalizedUnit) return false;
  return Object.prototype.hasOwnProperty.call(
    WEIGHT_UNIT_TO_KG_FACTOR,
    normalizedUnit,
  );
};

const toPositiveWeightNumber = (value) => {
  const parsed =
    typeof value === 'string'
      ? Number(value.trim().replace(',', '.'))
      : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const resolveWeightUnitToKgFactor = (unit) => {
  const normalizedUnit = normalizeWeightUnitCode(unit);
  if (!normalizedUnit) return 1;
  return WEIGHT_UNIT_TO_KG_FACTOR[normalizedUnit] ?? 1;
};

export const convertWeightToInventoryBaseQuantity = ({ unit, weight }) => {
  const parsedWeight = toPositiveWeightNumber(weight);
  if (parsedWeight == null) return 0;
  return roundWeightQuantity(parsedWeight * resolveWeightUnitToKgFactor(unit));
};
