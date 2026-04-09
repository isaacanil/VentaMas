import { Modal, Select } from 'antd';

import type { WarehouseOption } from '../types';

interface PurchaseWarehouseModalProps {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onWarehouseChange: (value: string) => void;
  open: boolean;
  selectedWarehouseId: string | null;
  warehouseOptions: WarehouseOption[];
  warehousesLoading: boolean;
}

export const PurchaseWarehouseModal = ({
  loading,
  onCancel,
  onConfirm,
  onWarehouseChange,
  open,
  selectedWarehouseId,
  warehouseOptions,
  warehousesLoading,
}: PurchaseWarehouseModalProps) => {
  return (
    <Modal
      title="Seleccionar almacén de destino"
      open={open}
      onOk={() => void onConfirm()}
      onCancel={onCancel}
      okText="Completar compra"
      cancelText="Cancelar"
      confirmLoading={loading}
      okButtonProps={{
        disabled:
          !selectedWarehouseId ||
          warehousesLoading ||
          warehouseOptions.length === 0,
      }}
      destroyOnHidden={false}
    >
      <p style={{ marginBottom: '0.8em' }}>
        Elige el almacén donde se registrará la recepción de esta compra. Este
        cambio solo aplica a esta compra.
      </p>
      <Select
        showSearch
        style={{ width: '100%' }}
        value={selectedWarehouseId}
        onChange={onWarehouseChange}
        loading={warehousesLoading}
        placeholder={
          warehousesLoading ? 'Cargando almacenes...' : 'Selecciona un almacén'
        }
        options={warehouseOptions}
      />
    </Modal>
  );
};
