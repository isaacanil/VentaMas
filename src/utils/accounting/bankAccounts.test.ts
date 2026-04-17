import { describe, expect, it } from 'vitest';

import {
  getBankAccountDraftFormValues,
  normalizeBankAccountDraft,
  normalizeBankAccountRecord,
} from './bankAccounts';
import {
  CUSTOM_BANK_INSTITUTION_CODE,
  type BankInstitutionCatalogEntry,
} from '@/domain/banking/bankInstitutionCatalog';

const BANK_CATALOG: BankInstitutionCatalogEntry[] = [
  {
    code: 'popular',
    countryCode: 'DO',
    name: 'Banco Popular Dominicano',
  },
  {
    code: 'apap',
    countryCode: 'DO',
    name: 'Asociacion Popular de Ahorros y Prestamos (APAP)',
  },
];

describe('bankAccounts', () => {
  it('normaliza banco desde catalogo de forma estricta', () => {
    const draft = normalizeBankAccountDraft(
      {
        name: 'Cuenta operativa',
        currency: 'DOP',
        countryCode: 'DO',
        bankCode: 'apap',
      },
      { bankInstitutionCatalog: BANK_CATALOG },
    );

    expect(draft.institutionName).toBe(
      'Asociacion Popular de Ahorros y Prestamos (APAP)',
    );
    expect(draft.countryCode).toBe('DO');
    expect(draft.bankCode).toBe('apap');
    expect(draft.isCustomBank).toBe(false);
  });

  it('normaliza otro banco y conserva nombre custom', () => {
    const draft = normalizeBankAccountDraft(
      {
        name: 'Cuenta secundaria',
        currency: 'DOP',
        countryCode: 'DO',
        bankCode: CUSTOM_BANK_INSTITUTION_CODE,
        isCustomBank: true,
        institutionCustomName: 'Banco Demo Local',
      },
      { bankInstitutionCatalog: BANK_CATALOG },
    );

    expect(draft.institutionName).toBe('Banco Demo Local');
    expect(draft.countryCode).toBe('DO');
    expect(draft.bankCode).toBe(CUSTOM_BANK_INSTITUTION_CODE);
    expect(draft.isCustomBank).toBe(true);
  });

  it('rechaza banco no catalogado cuando no es custom', () => {
    expect(() =>
      normalizeBankAccountDraft(
        {
          name: 'Cuenta invalida',
          currency: 'DOP',
          countryCode: 'DO',
          bankCode: 'desconocido',
          isCustomBank: false,
        },
        { bankInstitutionCatalog: BANK_CATALOG },
      ),
    ).toThrow('Seleccione un banco valido del catalogo.');
  });

  it('mapea cuentas legacy por nombre hacia selector catalogado', () => {
    const values = getBankAccountDraftFormValues(
      {
        institutionName: 'Banco Popular Dominicano',
        metadata: {},
      } as any,
      { bankInstitutionCatalog: BANK_CATALOG },
    );

    expect(values).toMatchObject({
      countryCode: 'DO',
      bankCode: 'popular',
      isCustomBank: false,
      institutionCustomName: null,
    });
  });

  it('lee cuentas legacy desde metadata y expone top-level normalizado', () => {
    const account = normalizeBankAccountRecord(
      'bank-1',
      'business-1',
      {
        name: 'Cuenta legacy',
        currency: 'DOP',
        institutionName: 'Banco Popular Dominicano',
        metadata: {
          institutionCatalog: {
            countryCode: 'DO',
            bankCode: 'popular',
            isCustom: false,
          },
        },
      },
      { bankInstitutionCatalog: BANK_CATALOG },
    );

    expect(account.countryCode).toBe('DO');
    expect(account.bankCode).toBe('popular');
    expect(account.isCustomBank).toBe(false);
  });

  it('preserva bankCode top-level aunque catalogo aun no haya cargado', () => {
    const values = getBankAccountDraftFormValues({
      bankCode: 'popular',
      countryCode: 'DO',
      institutionName: 'Banco Popular Dominicano',
      metadata: {},
    } as any);

    expect(values).toMatchObject({
      countryCode: 'DO',
      bankCode: 'popular',
      isCustomBank: false,
      institutionCustomName: null,
    });
  });
});
