import { Button, Modal } from 'antd';
import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import { Invoice } from '../Invoice/Invoice';
import InvoiceTemplateSelector from '../InvoiceTemplateSelector/InvoiceTemplateSelector';

type TemplateKey = 'template1' | 'template2' | 'template4';

const TEMPLATES_CONFIG = {
  template1: {
    format: 'THERMAL',
    width: '80mm',
    height: 'auto',
    minHeight: '120mm',
    padding: '4mm',
    defaultZoom: 0.8,
  },
  template2: {
    format: 'A4',
    width: '210mm',
    height: '240mm',
    minHeight: 'auto',
    padding: '10mm',
    defaultZoom: 0.5,
  },
  template4: {
    format: '80mm',
    width: '90mm',
    height: 'auto',
    minHeight: '120mm',
    padding: '4mm',
    defaultZoom: 0.8,
  },
} satisfies Record<
  TemplateKey,
  { format: string; width: string; height: string; minHeight?: string; padding: string; defaultZoom: number }
>;

const PaperWrapper = styled.div<{ $zoom: number }>`
  transform: scale(${({ $zoom }) => $zoom});
  transform-origin: top center;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex;
  justify-content: center;
  margin-bottom: ${({ $zoom }) => ($zoom < 1 ? `-${(1 - $zoom) * 100}%` : '0')}; /* Compensa el espacio del transform scale */
`;

const InvoicePaper = styled.div<{ $template: TemplateKey }>`
  width: ${({ $template }) => TEMPLATES_CONFIG[$template].width};
  height: ${({ $template }) => TEMPLATES_CONFIG[$template].height};
  min-height: ${({ $template }) => TEMPLATES_CONFIG[$template].minHeight || 'auto'};
  padding: ${({ $template }) => TEMPLATES_CONFIG[$template].padding};
  background: white;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;

  @media print {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    box-shadow: none;
    margin: 0;
    padding: 0;
    border: none;
  }
`;

const PreviewContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0;
  overflow: visible;
`;

export default function InvoiceTemplates({
  previewInModal = true,
  hidePreviewButton = false,
  onlySelector = false,
  onlyPreview = false,
  zoom,
}: {
  previewInModal?: boolean;
  hidePreviewButton?: boolean;
  onlySelector?: boolean;
  onlyPreview?: boolean;
  zoom?: number;
}) {
  const {
    billing: { invoiceType },
  } = useSelector(SelectSettingCart);

  const derivedTemplate =
    invoiceType && TEMPLATES_CONFIG[invoiceType as TemplateKey]
      ? (invoiceType as TemplateKey)
      : 'template1';

  const [localTemplate, setLocalTemplate] = useState<TemplateKey>(derivedTemplate);

  const effectiveTemplate = invoiceType && TEMPLATES_CONFIG[invoiceType as TemplateKey]
    ? (invoiceType as TemplateKey)
    : localTemplate;

  const componentRef = useRef<HTMLDivElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTemplateChange = (value: string) => {
    setLocalTemplate(value as TemplateKey);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handlePreview = () => {
    setIsModalVisible(true);
  };

  // Usar el zoom proporcionado o el default de la plantilla
  const finalZoom = zoom !== undefined ? zoom : TEMPLATES_CONFIG[effectiveTemplate].defaultZoom;

  const renderInvoice = () => (
    <PreviewContainer>
      <PaperWrapper $zoom={finalZoom}>
        <InvoicePaper $template={effectiveTemplate}>
          <Invoice
            ref={componentRef}
            template={effectiveTemplate}
            data={{}}
            ignoreHidden
          />
        </InvoicePaper>
      </PaperWrapper>
    </PreviewContainer>
  );

  if (onlySelector) {
    return (
      <InvoiceTemplateSelector
        onSave={handleTemplateChange}
        template={effectiveTemplate}
        onPreview={handlePreview}
        hidePreviewButton={hidePreviewButton || !previewInModal}
      />
    );
  }

  if (onlyPreview) {
    return renderInvoice();
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <InvoiceTemplateSelector
        onSave={handleTemplateChange}
        template={effectiveTemplate}
        onPreview={handlePreview}
        hidePreviewButton={hidePreviewButton}
      />

      <Modal
        title="Previsualización de Factura"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={'1100px'}
        centered
        destroyOnHidden
        footer={[
          <Button key="print" onClick={handlePrint} type="primary">
            Imprimir
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
      >
        <div style={{ padding: '40px', background: '#f5f5f5', borderRadius: '8px', overflow: 'auto', maxHeight: '70vh' }}>
          {renderInvoice()}
        </div>
      </Modal>

      {!previewInModal && renderInvoice()}
    </div>
  );
}
