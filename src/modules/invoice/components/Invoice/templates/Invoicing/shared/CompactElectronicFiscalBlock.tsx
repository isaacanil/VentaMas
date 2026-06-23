import type { ComponentType, SVGProps } from 'react';
import QRCodeImport from 'react-qr-code';
import styled from 'styled-components';

import { resolveElectronicPrintInfo } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils';
import type { InvoiceData } from '@/types/invoice';

type CompactElectronicFiscalBlockProps = {
  data?: InvoiceData | null;
  variant?: 'matrix' | 'thermal';
};

type QrCodeComponentProps = SVGProps<SVGSVGElement> & {
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  title?: string;
  value: string;
};

const resolveQrCodeComponent = (
  moduleValue: unknown,
): ComponentType<QrCodeComponentProps> => {
  const moduleRecord = moduleValue as {
    default?: unknown;
    QRCode?: unknown;
  };

  return (moduleRecord.QRCode ??
    moduleRecord.default ??
    moduleValue) as ComponentType<QrCodeComponentProps>;
};

const QrCodeComponent = resolveQrCodeComponent(QRCodeImport);

export const CompactElectronicFiscalBlock = ({
  data,
  variant = 'thermal',
}: CompactElectronicFiscalBlockProps) => {
  const electronic = resolveElectronicPrintInfo(data);

  if (!electronic) return null;

  const qrSize = variant === 'matrix' ? 112 : 96;

  return (
    <Block $variant={variant} data-testid="compact-electronic-fiscal-block">
      <Divider />
      <Title>e-CF</Title>
      {electronic.qrUrl ? (
        <QrFrame $variant={variant}>
          <QrCodeComponent
            aria-label="QR e-CF"
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
            role="img"
            size={qrSize}
            title="QR e-CF"
            value={electronic.qrUrl}
          />
        </QrFrame>
      ) : null}
      <Meta>
        {electronic.eNcf ? (
          <Line>
            e-NCF: <strong>{electronic.eNcf}</strong>
          </Line>
        ) : null}
        {electronic.securityCode ? (
          <Line>
            Codigo seguridad: <strong>{electronic.securityCode}</strong>
          </Line>
        ) : null}
        {electronic.signatureDate ? (
          <Line>
            Fecha Firma Digital: <strong>{electronic.signatureDate}</strong>
          </Line>
        ) : null}
      </Meta>
      {electronic.statusNote ? <Note>{electronic.statusNote}</Note> : null}
    </Block>
  );
};

const Block = styled.section<{ $variant: 'matrix' | 'thermal' }>`
  display: grid;
  gap: ${({ $variant }) => ($variant === 'matrix' ? '4px' : '3px')};
  justify-items: center;
  margin-top: ${({ $variant }) => ($variant === 'matrix' ? '8px' : '0.7em')};
  page-break-inside: avoid;
  break-inside: avoid;
  color: #111;
  font-family: ${({ $variant }) =>
    $variant === 'matrix'
      ? "'Courier New', Consolas, monospace"
      : 'inherit'};
  font-size: ${({ $variant }) => ($variant === 'matrix' ? '10px' : '9px')};
  line-height: 1.25;
  text-align: center;
  text-transform: none;

  @media print {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

const Divider = styled.div`
  width: 100%;
  border-top: 1px dashed #111;
`;

const Title = styled.p`
  margin: 0;
  padding: 0;
  font-weight: 800;
  letter-spacing: 0;
`;

const QrFrame = styled.div<{ $variant: 'matrix' | 'thermal' }>`
  display: inline-grid;
  place-items: center;
  padding: ${({ $variant }) => ($variant === 'matrix' ? '6px' : '4px')};
  background: #fff;
`;

const Meta = styled.div`
  display: grid;
  gap: 2px;
  max-width: 100%;
`;

const Line = styled.p`
  margin: 0;
  padding: 0;
  overflow-wrap: anywhere;
`;

const Note = styled.p`
  margin: 1px 0 0;
  padding: 0;
  font-size: 9px;
  overflow-wrap: anywhere;
`;
