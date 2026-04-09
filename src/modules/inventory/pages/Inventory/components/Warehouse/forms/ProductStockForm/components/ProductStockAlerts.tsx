import { Alert } from 'antd';

interface ProductStockAlertsProps {
  batchesErrorMessage: string | null;
  productsErrorMessage: string | null;
}

export const ProductStockAlerts = ({
  batchesErrorMessage,
  productsErrorMessage,
}: ProductStockAlertsProps) => {
  return (
    <>
      {productsErrorMessage && (
        <Alert
          message="Error al cargar productos"
          description={productsErrorMessage}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      {batchesErrorMessage && (
        <Alert
          message="Error al cargar lotes"
          description={batchesErrorMessage}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
    </>
  );
};
