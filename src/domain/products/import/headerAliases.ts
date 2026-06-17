import type { HeaderAliases } from '@/utils/import/types';

export const productHeaderAliases = {
  es: {
    codigo: 'Código de Barras',
    'codigo de barra': 'Código de Barras',
    facturable: 'Es Visible',
    inventariable: 'Rastreo de Inventario',
  },
} satisfies HeaderAliases<'en' | 'es'>;
