import React from 'react'
import { Modal, Descriptions, Button } from 'antd'

const PricingModal = ({ visible, unit, onClose }) => {
  return (
    <Modal
      title={unit ? `Detalles de Precios para ${unit.unitName}` : 'Detalles de Precios'}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      {unit ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Costo">${unit.pricing.cost.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Precio">${unit.pricing.price.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Precio de Lista">${unit.pricing.listPrice.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Precio Promedio">${unit.pricing.avgPrice.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Precio Mínimo">${unit.pricing.minPrice.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="Impuesto">{unit.pricing.tax}</Descriptions.Item>
        </Descriptions>
      ) : (
        <p>No hay información disponible.</p>
      )}
    </Modal>
  )
}

export default PricingModal
