import { useState, useRef, useEffect } from 'react';
import { Button, Modal, Form } from 'antd'; // Eliminar Select de las importaciones
import { Invoice } from '../Invoice/Invoice';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplateSelector from '../InvoiceTemplateSelector/InvoiceTemplateSelector';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

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
  }
};

const InvoiceContainer = styled.div`
  width: ${props => TEMPLATES_CONFIG[props.template]?.width};
  height: ${props => TEMPLATES_CONFIG[props.template]?.height};
  padding: ${props => TEMPLATES_CONFIG[props.template]?.padding};
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  margin: 20px auto;
  
  @media print {
    box-shadow: none;
    margin: 0;
  }
`;

const PreviewContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f0f0f0;
  padding: 0px;
  min-height: 50vh;
  
`;

export default function InvoiceTemplates({ previewInModal = true, hidePreviewButton = false }) {
  const { billing: { invoiceType } } = useSelector(SelectSettingCart);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const componentRef = useRef();
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
    content: () => componentRef.current,
  });

  const handlePreview = () => {
    console.log('handlePreview called');
    setIsModalVisible(true);
  };

  const renderInvoice = (ref) => (
    <PreviewContainer template={selectedTemplate}>
      <InvoiceContainer template={selectedTemplate}>
        <Invoice
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
        destroyOnClose={true}
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
