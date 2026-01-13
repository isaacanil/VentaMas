import { Button, Modal } from 'antd'; // Eliminar Select de las importaciones
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import InvoiceTemplateSelector from '@/modules/invoice/components/Quotation/components/InvoiceTemplateSelector/InvoiceTemplateSelector';
import { Quotation } from '@/modules/invoice/components/Quotation/components/Quotation/Quotation';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';
import type { QuotationTemplateKey } from '@/modules/invoice/components/Quotation/types';

type TemplateConfig = {
  format: string;
  width: string;
  height: string;
  padding: string;
};

const TEMPLATES_CONFIG: Record<QuotationTemplateKey, TemplateConfig> = {
  template1: {
    format: 'THERMAL',
    width: '80mm',
    height: 'auto',
    padding: '0mm',
  },
  template2: {
    format: 'A4',
    width: '210mm',
    height: '297mm',
    padding: '0mm',
  },
};

type InvoiceContainerProps = {
  $template: QuotationTemplateKey;
};

const InvoiceContainer = styled.div<InvoiceContainerProps>`
  width: ${({ $template }) => TEMPLATES_CONFIG[$template]?.width};
  height: ${({ $template }) => TEMPLATES_CONFIG[$template]?.height};
  padding: ${({ $template }) => TEMPLATES_CONFIG[$template]?.padding};
  margin: 20px auto;
  background: white;
  box-shadow: 0 0 10px rgb(0 0 0 / 10%);

  @media print {
    margin: 0;
    box-shadow: none;
  }
`;

const PreviewContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  min-height: 50vh;
  padding: 0;
  background: #f0f0f0;
`;

type InvoiceTemplatesProps = {
  previewInModal?: boolean;
  hidePreviewButton?: boolean;
};

type TemplateState = {
  sourceInvoiceType: QuotationTemplateKey;
  selectedTemplate: QuotationTemplateKey;
};

export default function InvoiceTemplates({
  previewInModal = true,
  hidePreviewButton = false,
}: InvoiceTemplatesProps) {
  const { billing } = useSelector(SelectSettingCart) as {
    billing?: { invoiceType?: string | null };
  };
  const invoiceType = billing?.invoiceType;
  const safeInvoiceType: QuotationTemplateKey =
    invoiceType && invoiceType in TEMPLATES_CONFIG
      ? (invoiceType as QuotationTemplateKey)
      : 'template1';

  const [templateState, setTemplateState] = useState<TemplateState>(() => ({
    sourceInvoiceType: safeInvoiceType,
    selectedTemplate: safeInvoiceType,
  }));

  const selectedTemplate =
    templateState.sourceInvoiceType === safeInvoiceType
      ? templateState.selectedTemplate
      : safeInvoiceType;
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTemplateChange = (value: QuotationTemplateKey) => {
    setTemplateState({
      sourceInvoiceType: safeInvoiceType,
      selectedTemplate: value,
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });
  const handlePreview = () => {
    setIsModalVisible(true);
  };

  const emptyData = {} as QuotationData;
  const renderInvoice = () => (
    <PreviewContainer>
      <InvoiceContainer $template={selectedTemplate}>
        <Quotation
          ref={componentRef}
          template={selectedTemplate}
          data={emptyData}
          ignoreHidden={true}
        />
      </InvoiceContainer>
    </PreviewContainer>
  );

  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <InvoiceTemplateSelector
          onSave={handleTemplateChange}
          template={selectedTemplate}
          onPreview={handlePreview}
          hidePreviewButton={hidePreviewButton}
        />
      </div>

      <Modal
        title="Previsualización de Factura"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={'1000px'}
        style={{ top: 20 }}
        destroyOnHidden={true}
        footer={[
          <Button key="print" onClick={handlePrint} type="primary">
            Imprimir
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: 'red',
          }}
        >
          {renderInvoice()}
        </div>
      </Modal>

      {!previewInModal && renderInvoice()}
    </div>
  );
}
