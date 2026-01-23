type SortableByCreatedAt = {
  createdAt?: string | number | Date | null;
};

export const sortPurchases = <T extends SortableByCreatedAt>(
  purchases: readonly T[] | null | undefined,
  isAscending: boolean,
): T[] | null | undefined => {
  if (!purchases?.length) return purchases;

  return [...purchases].sort((a, b) => {
    // Asegurarnos de que las fechas existen y son válidas
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    // Si isAscending es true, ordenar de más antiguo a más nuevo
    // Si isAscending es false, ordenar de más nuevo a más antiguo
    return isAscending ? dateA - dateB : dateB - dateA;
  });
};

export const sortOrders = <T extends SortableByCreatedAt>(
  purchases: readonly T[] | null | undefined,
  isAscending: boolean,
): T[] | null | undefined => {
  if (!purchases?.length) return purchases;

  return [...purchases].sort((a, b) => {
    // Asegurarnos de que las fechas existen y son válidas
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    // Si isAscending es true, ordenar de más antiguo a más nuevo
    // Si isAscending es false, ordenar de más nuevo a más antiguo
    return isAscending ? dateA - dateB : dateB - dateA;
  });
};
