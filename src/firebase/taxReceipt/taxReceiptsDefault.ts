import type { TaxReceiptData } from '@/types/taxReceipt';

export const taxReceiptDefault: TaxReceiptData[] = [
  {
    name: 'CONSUMIDOR FINAL',
    type: 'B',
    serie: '02',
    documentFormat: 'traditional',
    fiscalSeries: '02',
    fiscalType: 'B02',
    authorityStatus: 'not_applicable',
    trackId: null,
    sequence: '0000000000',
    increase: 1,
    quantity: 2000,
  },
  {
    name: 'CREDITO FISCAL',
    type: 'B',
    serie: '01',
    documentFormat: 'traditional',
    fiscalSeries: '01',
    fiscalType: 'B01',
    authorityStatus: 'not_applicable',
    trackId: null,
    sequence: '0000000000',
    increase: 1,
    quantity: 2000,
  },
];
