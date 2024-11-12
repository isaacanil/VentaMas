
import React from 'react';
import { Form, Input } from 'antd';

const { TextArea } = Input;

const GeneralTab = ({ purchaseData, handleInputChange }) => {
  return (
    <>
      <Form.Item label="ID del Proveedor">
        <Input name="supplierId" value={purchaseData.supplierId} onChange={handleInputChange} required />
      </Form.Item>
      <Form.Item label="Nombre del Proveedor">
        <Input name="supplierName" value={purchaseData.supplierName} onChange={handleInputChange} required />
      </Form.Item>
      <Form.Item label="Número de Orden">
        <Input name="orderNumber" value={purchaseData.orderNumber} onChange={handleInputChange} required />
      </Form.Item>
      <Form.Item label="Notas">
        <TextArea name="notes" value={purchaseData.notes} onChange={handleInputChange} />
      </Form.Item>
    </>
  );
};

export default GeneralTab;