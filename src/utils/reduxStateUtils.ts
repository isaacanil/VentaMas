// Helper to check if values are different for numeric values (with tolerance)
const hasValueChanged = (
  oldValue: unknown,
  newValue: unknown,
  tolerance = 0.01,
): boolean => {
  // Considerar un cambio si uno de los valores es null y el otro no
  if (oldValue === null || newValue === null) {
    return oldValue !== newValue;
  }

  if (typeof oldValue === 'number' && typeof newValue === 'number') {
    return Math.abs(oldValue - newValue) > tolerance;
  }
  return oldValue !== newValue;
};

const applyUpdates = (
  stateObject: Record<string, unknown> | null | undefined,
  updates: Record<string, unknown> | null | undefined,
  tolerance = 0.01,
): boolean => {
  if (!stateObject || typeof stateObject !== 'object') return false;
  if (!updates || typeof updates !== 'object') return false;
  if (Object.keys(updates).length === 0) return false;

  let hasUpdated = false;
  Object.keys(updates).forEach((key) => {
    if (hasValueChanged(stateObject[key], updates[key], tolerance)) {
      stateObject[key] = updates[key];
      hasUpdated = true;
    }
  });
  return hasUpdated;
};

export { hasValueChanged, applyUpdates };
