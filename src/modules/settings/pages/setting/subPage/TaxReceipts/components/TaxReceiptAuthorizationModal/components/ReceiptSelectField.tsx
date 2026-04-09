import { Form, Select } from 'antd';
import { Col, Row } from 'antd';
import styled from 'styled-components';

import type {
  AuthorizationFormValues,
  TaxReceiptDocumentWithAuthorizations,
} from '../types';
import { resolveReceiptId } from '../utils/taxReceiptAuthorizationModal';

const { Option } = Select;

interface ReceiptSelectFieldProps {
  activeReceipts: TaxReceiptDocumentWithAuthorizations[];
  onReceiptSelect: (receiptId?: string) => void;
}

export const ReceiptSelectField = ({
  activeReceipts,
  onReceiptSelect,
}: ReceiptSelectFieldProps) => {
  return (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item<AuthorizationFormValues>
          name="receiptId"
          label="Seleccione el comprobante a actualizar"
          rules={[
            {
              required: true,
              message: 'Por favor seleccione un comprobante',
            },
          ]}
        >
          <Select
            placeholder="Seleccionar comprobante"
            onChange={onReceiptSelect}
            optionLabelProp="label"
          >
            {activeReceipts.map((receipt) => {
              const receiptId = resolveReceiptId(receipt);
              if (!receiptId) return null;

              return (
                <Option
                  key={receiptId}
                  value={receiptId}
                  label={receipt.data.name}
                >
                  <ReceiptOptionContent>
                    <div className="receipt-name">{receipt.data.name}</div>
                    <div className="receipt-info">
                      <span className="code-label">Codigo:</span>
                      <span className="code-value">
                        {receipt.data.type}
                        {receipt.data.serie}
                      </span>
                    </div>
                  </ReceiptOptionContent>
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
};

const ReceiptOptionContent = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;

  .receipt-name {
    font-weight: 500;
  }

  .receipt-info {
    color: #1677ff;

    .code-label {
      margin-right: 4px;
      font-size: 12px;
      opacity: 0.8;
    }

    .code-value {
      padding: 0 4px;
      font-weight: 500;
      background: rgb(24 144 255 / 10%);
      border-radius: 3px;
    }
  }
`;
