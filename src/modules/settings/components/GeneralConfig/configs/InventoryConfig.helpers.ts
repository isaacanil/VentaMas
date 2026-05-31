type WarehouseOptionSource = {
  location?: string | null;
  name?: string | null;
  shortName?: string | null;
};

export const buildWarehouseMetaLabel = (
  warehouse: WarehouseOptionSource,
): string => {
  const metaParts = [
    warehouse.shortName ? `Alias: ${warehouse.shortName}` : null,
    warehouse.location ? `Ubicacion: ${warehouse.location}` : null,
  ].filter(Boolean);
  return metaParts.join(' - ');
};

export const buildWarehouseSearchLabel = (
  warehouse: WarehouseOptionSource,
): string =>
  [warehouse.name, warehouse.shortName, warehouse.location]
    .filter(Boolean)
    .join(' ');
