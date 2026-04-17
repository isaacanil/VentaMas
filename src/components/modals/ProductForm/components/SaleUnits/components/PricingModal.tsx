import { Modal, Descriptions, Button } from 'antd';
import React from 'react';

import type { SaleUnitRecord } from './SaleUnit';

type PricingModalProps = {
  visible: boolean;
  unit: SaleUnitRecord | null;
  onClose: () => void;
};

const PricingModal = ({ visible, unit, onClose }: PricingModalProps) => {
  const formatTax = (tax: SaleUnitRecord['pricing']['tax']) => {
    if (tax === null || tax === undefined) return 'N/A';
    if (typeof tax === 'number' || typeof tax === 'string') return tax;
    if (typeof tax === 'object' && 'tax' in tax) {
      const value = (tax as { tax?: number | string }).tax;
      return value ?? 'N/A';
    }
    return 'N/A';
  };

  return (
    <Modal
      title={
        unit
          ? `Detalles de Precios para ${unit.unitName}`
          : 'Detalles de Precios'
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      {unit ? (
        <Descriptions
          bordered
          column={1}
          items={[
            { key: 'costo', label: 'Costo', children: `$${unit.pricing.cost.toFixed(2)}` },
            { key: 'precio', label: 'Precio', children: `$${unit.pricing.price.toFixed(2)}` },
            { key: 'lista', label: 'Precio de Lista', children: `$${unit.pricing.listPrice.toFixed(2)}` },
            { key: 'promedio', label: 'Precio Promedio', children: `$${unit.pricing.avgPrice.toFixed(2)}` },
            { key: 'minimo', label: 'Precio Mínimo', children: `$${unit.pricing.minPrice.toFixed(2)}` },
            { key: 'impuesto', label: 'Impuesto', children: formatTax(unit.pricing.tax) },
          ]}
        />
      ) : (
        <p>No hay información disponible.</p>
      )}
    </Modal>
  );
};

export default PricingModal;
