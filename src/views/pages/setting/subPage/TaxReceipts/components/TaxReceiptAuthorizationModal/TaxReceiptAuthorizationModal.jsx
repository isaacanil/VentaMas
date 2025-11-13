import {
  FileAddOutlined,
  NumberOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Typography,
  Divider,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { updateTaxReceipt } from '../../../../../../../firebase/taxReceipt/updateTaxReceipt';

const { Title, Text } = Typography;
const { Option } = Select;

const TaxReceiptAuthorizationModal = ({
  visible,
  onCancel,
  taxReceipts,
  onAuthorizationAdded,
}) => {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedReceipt(null);
    }
  }, [visible, form]);

  // Update form when receipt is selected
  useEffect(() => {
    if (selectedReceipt) {
      const expirationDate = dayjs().add(1, 'year'); // Por defecto, fecha vencimiento 1 año
      form.setFieldsValue({
        authorizationNumber: '',
        requestNumber: '',
        startSequence: '',
        approvedQuantity: '',
        expirationDate,
      });
    }
  }, [selectedReceipt, form]);

  // Obtener solo los comprobantes activos
  const activeReceipts =
    taxReceipts?.filter((receipt) => !receipt.data.disabled) || [];

  const handleReceiptSelect = (receiptId) => {
    const receipt = taxReceipts.find(
      (item) => item.id === receiptId || item.data.id === receiptId,
    );
    setSelectedReceipt(receipt);
  };

  const calculateNewEndSequence = (values) => {
    if (!values.startSequence || !values.approvedQuantity) return null;

    const startNum = parseInt(values.startSequence, 10);
    const quantity = parseInt(values.approvedQuantity, 10);

    if (isNaN(startNum) || isNaN(quantity)) return null;

    return startNum + quantity - 1;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!selectedReceipt) {
        message.error('Por favor seleccione un comprobante');
        setLoading(false);
        return;
      }

      // Calcular la secuencia final
      const endSequence = calculateNewEndSequence(values);
      if (!endSequence) {
        message.error('Error al calcular la secuencia final');
        setLoading(false);
        return;
      }

      // Crear el objeto de autorización
      const authorizationData = {
        authorizationNumber: values.authorizationNumber,
        requestNumber: values.requestNumber,
        startSequence: values.startSequence,
        endSequence: String(endSequence),
        approvedQuantity: values.approvedQuantity,
        expirationDate: values.expirationDate.format('YYYY-MM-DD'),
        authorizationDate: dayjs().format('YYYY-MM-DD'),
      }; // Actualizar el comprobante con la nueva autorización
      const receiptData = selectedReceipt.data;
      const authorizations = receiptData.authorizations || [];

      // PROTECCIÓN: Solo actualizar secuencia si el startSequence es mayor que la secuencia actual
      const currentSequence = parseInt(receiptData.sequence || '0', 10);
      const newStartSequence = parseInt(values.startSequence, 10);

      // Validar que la nueva secuencia no sea menor que la actual
      if (newStartSequence < currentSequence) {
        message.error(
          `Error: La secuencia inicial (${newStartSequence}) no puede ser menor que la secuencia actual (${currentSequence}). Esto podría causar duplicación de NCF.`,
        );
        setLoading(false);
        return;
      }

      // Mantener el sequenceLength original (o un default) para no reducirlo a la longitud escrita (ej. '34' => 2)
      const resolveSequenceLength = () => {
        if (typeof receiptData.sequenceLength === 'number')
          return receiptData.sequenceLength;
        if (receiptData.type === 'B') return 8;
        return 10;
      };

      const updatedReceipt = {
        ...receiptData,
        id: receiptData.id,
        // Solo actualizar secuencia si es mayor que la actual para evitar retrocesos
        sequence:
          newStartSequence > currentSequence
            ? values.startSequence
            : receiptData.sequence,
        quantity:
          newStartSequence > currentSequence
            ? values.approvedQuantity
            : receiptData.quantity,
        sequenceLength: resolveSequenceLength(),
        // Agregamos la nueva autorización al historial
        authorizations: [...authorizations, authorizationData],
      };

      await updateTaxReceipt(user, updatedReceipt);
      message.success('Autorización registrada correctamente');
      onAuthorizationAdded(updatedReceipt);
      onCancel();
    } catch (error) {
      console.error('Error al guardar la autorización:', error);
      message.error('Error al registrar la autorización del comprobante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <HeaderContainer>
          <div>
            <Title level={4}>Registro de Autorización de Comprobantes</Title>
            <Text type="secondary">
              Registra una nueva autorización de comprobantes fiscales emitida
              por la DGI
            </Text>
          </div>
        </HeaderContainer>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSave}
          loading={loading}
          icon={<CheckCircleOutlined />}
          disabled={!selectedReceipt}
        >
          Registrar Autorización
        </Button>,
      ]}
      destroyOnHidden
    >
      <Container>
        <Form form={form} layout="vertical" name="authorizationForm">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
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
                  onChange={handleReceiptSelect}
                  optionLabelProp="label"
                >
                  {activeReceipts.map((receipt) => (
                    <Option
                      key={receipt.id || receipt.data.id}
                      value={receipt.id || receipt.data.id}
                      label={receipt.data.name}
                    >
                      <ReceiptOptionContent>
                        <div className="receipt-name">{receipt.data.name}</div>
                        <div className="receipt-info">
                          <span className="code-label">Código:</span>
                          <span className="code-value">
                            {receipt.data.type}
                            {receipt.data.serie}
                          </span>
                        </div>
                      </ReceiptOptionContent>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedReceipt && (
            <>
              <Divider>Información del Comprobante</Divider>

              <ReceiptCard>
                <ReceiptDetails>
                  <ReceiptDetailItem>
                    <Text strong>Nombre:</Text>
                    <Text>{selectedReceipt.data.name}</Text>
                  </ReceiptDetailItem>
                  <ReceiptDetailItem>
                    <Text strong>Tipo-Serie:</Text>
                    <Text>
                      {selectedReceipt.data.type}
                      {selectedReceipt.data.serie}
                    </Text>
                  </ReceiptDetailItem>
                  <ReceiptDetailItem>
                    <Text strong>Secuencia actual:</Text>
                    <Text>{selectedReceipt.data.sequence}</Text>
                  </ReceiptDetailItem>
                  <ReceiptDetailItem>
                    <Text strong>Cantidad actual:</Text>
                    <Text>{selectedReceipt.data.quantity}</Text>
                  </ReceiptDetailItem>
                </ReceiptDetails>
              </ReceiptCard>

              <Divider>Datos de Autorización</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="authorizationNumber"
                    label="Número de Autorización"
                    rules={[
                      {
                        required: true,
                        message: 'Ingrese el número de autorización',
                      },
                      { pattern: /^\d+$/, message: 'Ingrese solo números' },
                    ]}
                  >
                    <Input
                      placeholder="Ej: 5004526018"
                      prefix={<NumberOutlined />}
                      maxLength={20}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="requestNumber"
                    label="Número de Solicitud"
                    rules={[
                      {
                        required: true,
                        message: 'Ingrese el número de solicitud',
                      },
                      { pattern: /^\d+$/, message: 'Ingrese solo números' },
                    ]}
                  >
                    <Input
                      placeholder="Ej: 5009083898"
                      prefix={<NumberOutlined />}
                      maxLength={20}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="startSequence"
                    label="Secuencia Inicial"
                    rules={[
                      {
                        required: true,
                        message: 'Ingrese la secuencia inicial',
                      },
                      { pattern: /^\d+$/, message: 'Ingrese solo números' },
                    ]}
                  >
                    <Input
                      placeholder="Ej: 1000001537"
                      prefix={<FileAddOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="approvedQuantity"
                    label="Cantidad Aprobada"
                    rules={[
                      {
                        required: true,
                        message: 'Ingrese la cantidad aprobada',
                      },
                      { pattern: /^\d+$/, message: 'Ingrese solo números' },
                    ]}
                  >
                    <Input placeholder="Ej: 324" type="number" min={1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="expirationDate"
                    label="Fecha de Vencimiento"
                    rules={[
                      {
                        required: true,
                        message: 'Seleccione la fecha de vencimiento',
                      },
                    ]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="Seleccione fecha"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Container>
    </Modal>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

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

const ReceiptCard = styled.div`
  padding: 16px;
  margin-bottom: 20px;
  background-color: #f8fafc;
  border: 1px solid #e6e8eb;
  border-radius: 8px;
`;

const ReceiptDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const ReceiptDetailItem = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;

export default TaxReceiptAuthorizationModal;
