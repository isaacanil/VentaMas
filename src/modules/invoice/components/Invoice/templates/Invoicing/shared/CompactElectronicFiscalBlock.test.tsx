import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CompactElectronicFiscalBlock } from './CompactElectronicFiscalBlock';

describe('CompactElectronicFiscalBlock', () => {
  it('prints the compact e-CF QR and fiscal metadata when available', () => {
    render(
      <CompactElectronicFiscalBlock
        data={
          {
            NCF: 'E310000000123',
            electronicTaxReceipt: {
              documentType: 'E31',
              eNcf: 'E310000000123',
              qr: {
                url: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=1',
              },
              securityCode: 'ABC123',
              signedAt: '2026-06-21',
              dgiiValidationStatus: 'accepted',
            },
          } as never
        }
      />,
    );

    expect(screen.getByRole('img', { name: 'QR e-CF' })).toHaveAttribute(
      'width',
      '96',
    );
    expect(screen.getByText('e-NCF:')).toBeInTheDocument();
    expect(screen.getByText('E310000000123')).toBeInTheDocument();
    expect(screen.getByText('Codigo seguridad:')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Fecha Firma Digital:')).toBeInTheDocument();
    expect(screen.getByText('21/06/2026')).toBeInTheDocument();
  });

  it('uses a larger QR for the matrix layout because dot printers need more density', () => {
    render(
      <CompactElectronicFiscalBlock
        variant="matrix"
        data={
          {
            electronicTaxReceipt: {
              eNcf: 'E310000000124',
              qr: {
                url: 'https://ecf.dgii.gov.do/testecf/consultatimbre?id=2',
              },
            },
          } as never
        }
      />,
    );

    expect(screen.getByRole('img', { name: 'QR e-CF' })).toHaveAttribute(
      'width',
      '112',
    );
  });

  it('does not render fiscal chrome for legacy receipts without an electronic snapshot', () => {
    const { container } = render(
      <CompactElectronicFiscalBlock data={{ NCF: 'B0100000001' } as never} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
