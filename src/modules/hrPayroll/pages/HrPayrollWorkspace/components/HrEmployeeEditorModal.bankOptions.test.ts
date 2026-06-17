import { describe, expect, it } from 'vitest';

import type { BankInstitutionCatalogEntry } from '@/domain/banking/bankInstitutionCatalog';

import {
  buildHrDepositBankOptions,
  resolveHrDepositBankSelection,
} from './HrEmployeeEditorModal.bankOptions';

const BANK_CATALOG: BankInstitutionCatalogEntry[] = [
  {
    code: 'popular',
    countryCode: 'DO',
    name: 'Banco Popular Dominicano',
  },
  {
    code: 'bhd',
    countryCode: 'DO',
    name: 'Banco BHD',
  },
];

describe('HrEmployeeEditorModal bank options', () => {
  it('usa el catalogo bancario como opciones del banco destino', () => {
    expect(buildHrDepositBankOptions(BANK_CATALOG)).toEqual([
      {
        label: 'Banco Popular Dominicano',
        value: 'Banco Popular Dominicano',
      },
      {
        label: 'Banco BHD',
        value: 'Banco BHD',
      },
    ]);
  });

  it('mantiene un banco legacy guardado si no existe en el catalogo', () => {
    expect(buildHrDepositBankOptions(BANK_CATALOG, ' Banco Local ')).toEqual([
      {
        label: 'Banco Local (guardado)',
        value: 'Banco Local',
      },
      {
        label: 'Banco Popular Dominicano',
        value: 'Banco Popular Dominicano',
      },
      {
        label: 'Banco BHD',
        value: 'Banco BHD',
      },
    ]);
  });

  it('resuelve la seleccion hacia la opcion del catalogo cuando coincide normalizada', () => {
    const options = buildHrDepositBankOptions(BANK_CATALOG, ' banco bhd ');

    expect(resolveHrDepositBankSelection(options, ' banco bhd ')).toBe(
      'Banco BHD',
    );
  });
});
