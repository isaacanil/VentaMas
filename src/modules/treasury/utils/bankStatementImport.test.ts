import { describe, expect, it } from 'vitest';

import { parseBankStatementImport, planBankStatementImport } from './bankStatementImport';

describe('parseBankStatementImport', () => {
  it('parses CSV rows with debit and credit columns', () => {
    const result = parseBankStatementImport({
      fileName: 'estado.csv',
      text: `Fecha,Descripcion,Referencia,Debito,Credito
18/04/2026,Comision Banco,REF-1,25.00,
18/04/2026,Deposito Cliente,REF-2,,100.00`,
    });

    expect(result.format).toBe('csv');
    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([
      expect.objectContaining({
        amount: 25,
        direction: 'out',
        reference: 'REF-1',
      }),
      expect.objectContaining({
        amount: 100,
        direction: 'in',
        reference: 'REF-2',
      }),
    ]);
  });

  it('parses OFX transaction rows', () => {
    const result = parseBankStatementImport({
      fileName: 'estado.ofx',
      text: `<OFX>
<BANKTRANLIST>
<STMTTRN>
<TRNAMT>-10.50
<DTPOSTED>20260418120000
<FITID>FIT-1
<NAME>Bank fee
</STMTTRN>
</BANKTRANLIST>
</OFX>`,
    });

    expect(result.format).toBe('ofx');
    expect(result.issues).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      amount: 10.5,
      direction: 'out',
      reference: 'FIT-1',
    });
  });
});

describe('planBankStatementImport', () => {
  it('assigns exact suggestions without reusing movements across imported rows', () => {
    const planned = planBankStatementImport({
      entries: [
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 100,
          businessId: 'business-1',
          currency: 'DOP',
          direction: 'in',
          id: 'mov-1',
          occurredAt: new Date('2026-04-18'),
          sourceType: 'receivable_payment',
        },
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 100,
          businessId: 'business-1',
          currency: 'DOP',
          direction: 'in',
          id: 'mov-2',
          occurredAt: new Date('2026-04-18'),
          sourceType: 'receivable_payment',
        },
      ],
      rows: [
        {
          amount: 100,
          description: 'Deposito 1',
          direction: 'in',
          id: 'row-1',
          reference: 'A',
          sourceLineNumber: 1,
          statementDate: new Date('2026-04-18'),
        },
        {
          amount: 100,
          description: 'Deposito 2',
          direction: 'in',
          id: 'row-2',
          reference: 'B',
          sourceLineNumber: 2,
          statementDate: new Date('2026-04-18'),
        },
      ],
    });

    expect(planned[0]).toMatchObject({
      matchStatus: 'reconciled',
      movementIds: ['mov-1'],
    });
    expect(planned[1]).toMatchObject({
      matchStatus: 'reconciled',
      movementIds: ['mov-2'],
    });
  });
});
