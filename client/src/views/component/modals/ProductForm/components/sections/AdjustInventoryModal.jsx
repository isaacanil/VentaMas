import React, { useState, useEffect } from 'react';
import { Modal, InputNumber, Button } from 'antd';

const AdjustInventoryModal = ({ visible, onClose, stock, packSize, onSave }) => {
    const [adjustedStock, setAdjustedStock] = useState(stock);
    const [adjustedTotalUnit, setAdjustedTotalUnit] = useState(stock * packSize);

    // Actualiza los valores del modal cuando se reciben nuevas props
    useEffect(() => {
        setAdjustedStock(stock);
        setAdjustedTotalUnit(stock * packSize);
    }, [stock, packSize]);

    // Maneja el cambio en el stock y recalcula el total de unidades
    const handleStockChange = (value) => {
        setAdjustedStock(value);
        setAdjustedTotalUnit(value * packSize);
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
        >
        
        </Modal>
    );
};

export default AdjustInventoryModal;
