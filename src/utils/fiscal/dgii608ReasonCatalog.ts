export const DGII_608_REASON_CATALOG_VERSION = 'dgii-608-v1-2025';

export interface Dgii608ReasonOption {
  code: string;
  label: string;
}

export const DGII_608_REASON_OPTIONS: Dgii608ReasonOption[] = [
  { code: '01', label: 'Deterioro de factura preimpresa' },
  { code: '02', label: 'Errores de impresión (factura preimpresa)' },
  { code: '03', label: 'Impresión defectuosa' },
  { code: '04', label: 'Corrección de la información' },
  { code: '05', label: 'Cambio de productos' },
  { code: '06', label: 'Devolución de productos' },
  { code: '07', label: 'Omisión de productos' },
  { code: '08', label: 'Errores en secuencia de NCF' },
  { code: '09', label: 'Por cese de operaciones' },
  { code: '10', label: 'Pérdida o hurto de talonarios' },
];

export const getDgii608ReasonOption = (
  code: string | null | undefined,
): Dgii608ReasonOption | null => {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().padStart(2, '0');
  return DGII_608_REASON_OPTIONS.find((option) => option.code === normalized) ?? null;
};
