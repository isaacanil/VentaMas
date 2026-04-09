export function formatNumber(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(
    num,
  );
}
