// @ts-nocheck
import { Modal } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

const AdjustInventoryModal = ({
  visible,
  onClose,
  stock,
  packSize,
  onSave,
}) => {
  const initialTrigger = `${visible}-${stock}-${packSize}`;
  const [{ trigger: localTrigger, value: localStock }, setLocalStock] =
    useState(() => ({ trigger: initialTrigger, value: stock }));

  const adjustedStock = localTrigger === initialTrigger ? localStock : stock;
  const setAdjustedStock = useCallback(
    (value) => setLocalStock({ trigger: initialTrigger, value }),
    [initialTrigger],
  );

  const adjustedTotalUnit = useMemo(
    () => (Number(adjustedStock) || 0) * (Number(packSize) || 0),
    [adjustedStock, packSize],
  );

  // Maneja el cambio en el stock y recalcula el total de unidades
  const _handleStockChange = (value) => {
    setAdjustedStock(value);
  };

  // Maneja la confirmación del modal y llama a la función de guardado
  const handleOk = () => {
    onSave(adjustedStock, adjustedTotalUnit);
    onClose();
  };

  // Cierra el modal sin guardar cambios
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="Ajustar Inventario"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Guardar"
      cancelText="Cancelar"
    ></Modal>
  );
};

export default AdjustInventoryModal;
