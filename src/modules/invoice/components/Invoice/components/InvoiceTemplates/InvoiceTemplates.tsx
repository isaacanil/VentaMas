import { Button, Modal } from 'antd'; // Eliminar Select de las importaciones
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
    padding: '0mm',
  },
  template2: {
    format: 'A4',
    width: '210mm',
    height: '297mm',
    padding: '0mm',
  },
  template4: {
    format: '80mm',
    width: '80mm',
    height: 'auto',
    padding: '0mm',
  },
} satisfies Record<
  TemplateKey,
  { format: string; width: string; height: string; padding: string }
>;

const InvoiceContainer = styled.div`
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

export default function InvoiceTemplates({
  previewInModal = true,
  hidePreviewButton = false,
}: {
  previewInModal?: boolean;
  hidePreviewButton?: boolean;
}) {
  const {
    billing: { invoiceType },
  } = useSelector(SelectSettingCart);

  // Derive selectedTemplate from invoiceType
  const derivedTemplate =
    invoiceType && TEMPLATES_CONFIG[invoiceType as TemplateKey]
      ? (invoiceType as TemplateKey)
      : 'template1';
  // Allow local override via state, initialized from derived value
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>(derivedTemplate);
  // Use derived template if invoiceType matches a config, otherwise use local state
  const effectiveTemplate =
    invoiceType && TEMPLATES_CONFIG[invoiceType as TemplateKey]
      ? (invoiceType as TemplateKey)
      : selectedTemplate;
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTemplateChange = (value: TemplateKey) => {
    setSelectedTemplate(value);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handlePreview = () => {
    setIsModalVisible(true);
  };

  const renderInvoice = () => (
    <PreviewContainer>
      <InvoiceContainer $template={effectiveTemplate}>
        <Invoice
          ref={componentRef}
          template={effectiveTemplate}
          data={{}}
          ignoreHidden
        />
      </InvoiceContainer>
    </PreviewContainer>
  );

  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <InvoiceTemplateSelector
          onSave={handleTemplateChange}
          template={effectiveTemplate}
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
        destroyOnClose
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
