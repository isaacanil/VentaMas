import { Form, Input } from 'antd';
import type { ChangeEvent } from 'react';

const { TextArea } = Input;

interface GeneralTabProps {
  purchaseData: {
    supplierId?: string;
    supplierName?: string;
    orderNumber?: string;
    notes?: string;
  };
  handleInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const GeneralTab = ({ purchaseData, handleInputChange }: GeneralTabProps) => {
  return (
    <>
      <Form.Item label="ID del Proveedor">
        <Input
          name="supplierId"
          value={purchaseData.supplierId}
          onChange={handleInputChange}
          required
        />
      </Form.Item>
      <Form.Item label="Nombre del Proveedor">
        <Input
          name="supplierName"
          value={purchaseData.supplierName}
          onChange={handleInputChange}
          required
        />
      </Form.Item>
      <Form.Item label="Número de Orden">
        <Input
          name="orderNumber"
          value={purchaseData.orderNumber}
          onChange={handleInputChange}
          required
        />
      </Form.Item>
      <Form.Item label="Notas">
        <TextArea
          name="notes"
          value={purchaseData.notes}
          onChange={handleInputChange}
        />
      </Form.Item>
    </>
  );
};

export default GeneralTab;
