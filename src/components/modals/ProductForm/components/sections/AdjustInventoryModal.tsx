import { Modal } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

type AdjustInventoryModalProps = {
  visible: boolean;
  onClose: () => void;
  stock?: number;
  packSize?: number;
  onSave: (stock: number, totalUnits: number) => void;
};

const AdjustInventoryModal = ({
  visible,
  onClose,
  stock,
  packSize,
  onSave,
}: AdjustInventoryModalProps) => {
  const initialTrigger = `${visible}-${stock}-${packSize}`;
  const [{ trigger: localTrigger, value: localStock }, setLocalStock] =
    useState<{ trigger: string; value: number | undefined | null }>(() => ({
      trigger: initialTrigger,
      value: stock,
    }));

  const adjustedStock = localTrigger === initialTrigger ? localStock : stock;
  const setAdjustedStock = useCallback(
    (value: number | null) => setLocalStock({ trigger: initialTrigger, value }),
    [initialTrigger],
  );

  const adjustedTotalUnit = useMemo(
    () => (Number(adjustedStock) || 0) * (Number(packSize) || 0),
    [adjustedStock, packSize],
  );

  // Maneja el cambio en el stock y recalcula el total de unidades
  const _handleStockChange = (value: number | null) => {
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
