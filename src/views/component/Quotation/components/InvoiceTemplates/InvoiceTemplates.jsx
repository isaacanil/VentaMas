import { Button, Modal } from 'antd'; // Eliminar Select de las importaciones
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import InvoiceTemplateSelector from '../InvoiceTemplateSelector/InvoiceTemplateSelector';
import { Quotation } from '../Quotation/Quotation';

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
};

const InvoiceContainer = styled.div`
  width: ${(props) => TEMPLATES_CONFIG[props.template]?.width};
  height: ${(props) => TEMPLATES_CONFIG[props.template]?.height};
  padding: ${(props) => TEMPLATES_CONFIG[props.template]?.padding};
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
}) {
  const {
    billing: { invoiceType },
  } = useSelector(SelectSettingCart);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const componentRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    // Si invoiceType no existe o no es un template válido, usar template1
    if (!invoiceType || !TEMPLATES_CONFIG[invoiceType]) {
      setSelectedTemplate('template1');
    } else {
      setSelectedTemplate(invoiceType);
    }
  }, [invoiceType]);

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });
  const handlePreview = () => {
    setIsModalVisible(true);
  };

  const renderInvoice = (ref) => (
    <PreviewContainer template={selectedTemplate}>
      <InvoiceContainer template={selectedTemplate}>
        <Quotation
          ref={ref}
          template={selectedTemplate}
          data={{}}
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
          {renderInvoice(componentRef)}
        </div>
      </Modal>

      {!previewInModal && renderInvoice(componentRef)}
    </div>
  );
}
