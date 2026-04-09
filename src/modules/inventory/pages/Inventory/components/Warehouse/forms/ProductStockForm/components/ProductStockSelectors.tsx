import { Form, Select } from 'antd';

const { Option } = Select;

type ProductRecord = { id: string; name?: string } & Record<string, unknown>;

interface BatchOption {
  id: string;
  shortName?: string;
}

interface ProductStockSelectorsProps {
  batchesList: BatchOption[];
  onBatchChange: (batchIdValue: string) => void;
  onProductChange: (productIdValue: string) => void;
  productId: string;
  batchId: string;
  productsList: ProductRecord[];
}

export const ProductStockSelectors = ({
  batchesList,
  onBatchChange,
  onProductChange,
  productId,
  batchId,
  productsList,
}: ProductStockSelectorsProps) => {
  return (
    <>
      <Form.Item
        label="Producto"
        required
        tooltip="Selecciona el producto correspondiente"
        rules={[
          { required: true, message: 'Por favor selecciona un producto' },
        ]}
      >
        <Select
          showSearch
          placeholder="Selecciona un producto"
          optionFilterProp="children"
          onChange={onProductChange}
          filterOption={(input, option) =>
            String(option?.children ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          value={productId || undefined}
          allowClear
        >
          {productsList.map((product) => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {batchesList.length > 0 && (
        <Form.Item
          label="Batch"
          required
          tooltip="Selecciona el batch correspondiente"
          rules={[
            {
              required: true,
              message: 'Por favor selecciona un batch',
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Selecciona un batch"
            optionFilterProp="children"
            onChange={onBatchChange}
            filterOption={(input, option) =>
              String(option?.children ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            value={batchId || undefined}
            allowClear
          >
            {batchesList.map((batch) => (
              <Option key={batch.id} value={batch.id}>
                {batch.shortName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </>
  );
};
