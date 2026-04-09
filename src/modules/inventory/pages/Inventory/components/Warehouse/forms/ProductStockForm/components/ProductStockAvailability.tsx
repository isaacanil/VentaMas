import { Alert, Form, InputNumber, Progress } from 'antd';

interface ProductStockAvailabilityProps {
  batchId: string;
  formattedStockDifference: string;
  formattedTotalStock: string;
  isStockAvailable: boolean;
  onStockChange: (value: number | null) => void;
  remainingStock: number;
  stockUsagePercent: number;
  totalStockFromBatches: number;
  totalStockFromProducts: number;
  value: number;
}

export const ProductStockAvailability = ({
  batchId,
  formattedStockDifference,
  formattedTotalStock,
  isStockAvailable,
  onStockChange,
  remainingStock,
  stockUsagePercent,
  totalStockFromBatches,
  totalStockFromProducts,
  value,
}: ProductStockAvailabilityProps) => {
  if (!isStockAvailable) {
    return batchId ? (
      <Alert
        message="El máximo disponible ha sido alcanzado. Por favor intenta con otro producto o lote."
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    ) : null;
  }

  return (
    <>
      <Form.Item
        label="Cantidad de Stock"
        required
        tooltip="Ingresa la cantidad de stock disponible"
        rules={[
          {
            required: true,
            message: 'Por favor ingresa la cantidad de stock',
          },
        ]}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
          <InputNumber
            min={0}
            max={Math.max(totalStockFromBatches - totalStockFromProducts, 0)}
            style={{ width: '100%' }}
            value={value}
            onChange={onStockChange}
          />
          <span
            style={{
              whiteSpace: 'nowrap',
              color: remainingStock < 0 ? 'red' : 'black',
            }}
          >
            {` (Maximo: ${totalStockFromBatches - totalStockFromProducts})`}
          </span>
        </div>
      </Form.Item>

      <Form.Item
        label="Stock Total Disponible"
        tooltip="Este es el stock total disponible del batch seleccionado y otros productos"
      >
        <div>
          <Progress
            percent={Math.max(0, Math.min(100, stockUsagePercent))}
            status={remainingStock < 0 ? 'exception' : 'normal'}
          />
          <span>{formattedStockDifference}</span>/<span>{formattedTotalStock}</span>
        </div>
        {remainingStock < 0 && (
          <Alert
            message="El stock ingresado excede el total disponible. Por favor ajusta la cantidad."
            type="error"
            showIcon
            style={{ marginTop: '8px' }}
          />
        )}
      </Form.Item>
    </>
  );
};
