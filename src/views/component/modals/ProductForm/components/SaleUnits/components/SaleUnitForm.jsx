import {
  DollarCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Modal,
  Checkbox,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice';
import { fbUpsetSaleUnits } from '../../../../../../../firebase/products/saleUnits/fbUpdateSaleUnit';
import { formatPrice } from '@/utils/format';

const FormContainer = styled.div``;

const SaleUnitForm = ({ isOpen, initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const initialData = {
    unitName: '',
    packSize: 1,
    pricing: {
      tax: 0,
      cost: 0,
      listPrice: 0,
      stock: 0,
      avgPrice: 0,
      price: 0,
      minPrice: 0,
      listPriceEnabled: false,
      avgPriceEnabled: false,
      minPriceEnabled: false,
    },
  };

  const [cardData, setCardData] = useState([]);
  const {
    product: { id: productId },
  } = useSelector(selectUpdateProductData);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      // Actualizamos los datos de las tarjetas al inicializar
      updateCardData(initialValues);
    } else {
      form.resetFields();
      setCardData([]); // Reiniciar los datos de la tarjeta si no hay valores iniciales
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    try {
      const data = {
        ...values,
        pricing: { ...values.pricing, price: values.pricing.listPrice },
      };
      if (initialValues) {
        fbUpsetSaleUnits(user, productId, { ...initialValues, ...data });

        message.success('Unidad de venta actualizada correctamente');
      } else {
        fbUpsetSaleUnits(user, productId, data);
        message.success('Unidad de venta agregada correctamente');
      }
      onSubmit();
    } catch (error) {
      console.error(error);
    }
  };

  const handleValuesChange = (changedValues, allValues) => {
    updateCardData(allValues);
  };

  const updateCardData = (values) => {
    const { pricing = {} } = values;
    const {
      tax = 0,
      cost = 0,
      listPrice = 0,
      avgPrice = 0,
      minPrice = 0,
      listPriceEnabled = false,
      avgPriceEnabled = false,
      minPriceEnabled = false,
    } = pricing;

    const calculateRow = (price) => {
      const taxRate = tax / 100;
      const itbis = price * taxRate;
      const total = price + itbis;
      const margin = total - cost;
      const percentBenefits = total > 0 ? (margin / total) * 100 : 0;

      return {
        precioSinItbis: price.toFixed(2),
        itbis: itbis.toFixed(2),
        total: total.toFixed(2),
        margen: margin.toFixed(2),
        porcentajeGanancia: `${percentBenefits.toFixed(0)}%`,
      };
    };

    const newCardData = [];
    if (listPriceEnabled) {
      newCardData.push({
        key: '1',
        tipoPrecio: 'Precio de Lista',
        ...calculateRow(listPrice),
      });
    }
    if (avgPriceEnabled) {
      newCardData.push({
        key: '2',
        tipoPrecio: 'Precio Promedio',
        ...calculateRow(avgPrice),
      });
    }
    if (minPriceEnabled) {
      newCardData.push({
        key: '3',
        tipoPrecio: 'Precio M+¡nimo',
        ...calculateRow(minPrice),
      });
    }

    setCardData(newCardData);
  };

  return (
    <Modal
      title={
        initialValues
          ? 'Editar Unidad de Venta'
          : 'Agregar Nueva Unidad de Venta'
      }
      open={isOpen}
      width={1000}
      style={{ top: 5 }}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={form.submit}>
          {initialValues ? 'Actualizar' : 'Agregar'}
        </Button>,
      ]}
      onCancel={onCancel}
    >
      <Group>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialData}
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
        >
          <FormContainer>
            <Form.Item
              name="unitName"
              tooltip="Nombre de la unidad de venta"
              label="Nombre de la Unidad"
              rules={[
                {
                  required: true,
                  message: 'Por favor ingresa el nombre de la unidad',
                },
              ]}
            >
              <Input placeholder="Ejemplo: Caja" />
            </Form.Item>
            <Grid>
              <Form.Item
                name="packSize"
                tooltip="Cantidad de productos en un paquete"
                label="Cantidad de Productos por Paquete"
                rules={[
                  { required: true, message: 'Por favor ingresa la cantidad' },
                ]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Grid>
            <Grid>
              <Form.Item
                name={['pricing', 'tax']}
                tooltip="Impuesto aplicado a la unidad de venta"
                label="Impuesto"
                rules={[
                  { required: true, message: 'Por favor ingresa el impuesto' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Ejemplo: IVA"
                />
              </Form.Item>
              <Form.Item
                name={['pricing', 'cost']}
                label="Costo"
                rules={[
                  { required: true, message: 'Por favor ingresa el costo' },
                ]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Grid>

            {/* Precio de Lista */}
            <Form.Item
              shouldUpdate={(prevValues, currentValues) =>
                prevValues !== currentValues
              }
            >
              {({ getFieldValue }) => {
                const listPriceEnabled = getFieldValue([
                  'pricing',
                  'listPriceEnabled',
                ]);
                return (
                  <Form.Item
                    label={
                      <Form.Item
                        name={['pricing', 'listPriceEnabled']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>Precio de Lista</Checkbox>
                      </Form.Item>
                    }
                    tooltip="El precio de lista es el precio sugerido para la venta al  p+¦blico."
                    name={['pricing', 'listPrice']}
                    rules={[
                      {
                        required: listPriceEnabled,
                        message: 'Por favor ingresa el precio de lista',
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      disabled={!listPriceEnabled}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>

            {/* Precio Promedio */}
            <Form.Item
              shouldUpdate={(prevValues, currentValues) =>
                prevValues !== currentValues
              }
            >
              {({ getFieldValue }) => {
                const avgPriceEnabled = getFieldValue([
                  'pricing',
                  'avgPriceEnabled',
                ]);
                return (
                  <Form.Item
                    label={
                      <Form.Item
                        name={['pricing', 'avgPriceEnabled']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>Precio Promedio</Checkbox>
                      </Form.Item>
                    }
                    tooltip="El precio promedio es el precio que se espera que el producto se venda en el mercado."
                    name={['pricing', 'avgPrice']}
                    rules={[
                      {
                        required: avgPriceEnabled,
                        message: 'Por favor ingresa el precio promedio',
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      disabled={!avgPriceEnabled}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>

            {/* Precio M+¡nimo */}
            <Form.Item
              shouldUpdate={(prevValues, currentValues) =>
                prevValues !== currentValues
              }
            >
              {({ getFieldValue }) => {
                const minPriceEnabled = getFieldValue([
                  'pricing',
                  'minPriceEnabled',
                ]);
                return (
                  <Form.Item
                    label={
                      <Form.Item
                        name={['pricing', 'minPriceEnabled']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox>Precio M+¡nimo</Checkbox>
                      </Form.Item>
                    }
                    tooltip="El precio m+¡nimo es el precio m+ís bajo al que se puede vender el producto."
                    name={['pricing', 'minPrice']}
                    rules={[
                      {
                        required: minPriceEnabled,
                        message: 'Por favor ingresa el precio m+¡nimo',
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      disabled={!minPriceEnabled}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </FormContainer>
        </Form>
        <CardContainer>
          {cardData.map((item) => (
            <Card
              key={item.key}
              style={{
                backgroundColor:
                  item.key === '1'
                    ? '#fff5e8'
                    : item.key === '2'
                      ? '#f4fef6'
                      : '#e9f3f9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <IconContainer>
                  {item.key === '1' && (
                    <DollarCircleOutlined
                      style={{ fontSize: '24px', color: '#ffbf00' }}
                    />
                  )}
                  {item.key === '2' && (
                    <RiseOutlined
                      style={{ fontSize: '24px', color: '#52c41a' }}
                    />
                  )}
                  {item.key === '3' && (
                    <FallOutlined
                      style={{ fontSize: '24px', color: '#1890ff' }}
                    />
                  )}
                </IconContainer>
                <CardTitle>{item.tipoPrecio}</CardTitle>
              </div>
              <Option
                title="Monto"
                value={formatPrice(item.precioSinItbis)}
              />
              <Option title="Itbis" value={formatPrice(item.itbis)} />
              <Option title="Margen" value={formatPrice(item.margen)} />
              <Option title="Ganancia (%)" value={item.porcentajeGanancia} />
              <Option title="Total" value={formatPrice(item.total)} />
            </Card>
          ))}
        </CardContainer>
      </Group>
    </Modal>
  );
};

export default SaleUnitForm;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1em;
  width: 100%;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1em;
  align-items: end;
`;
const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1em;
  align-content: start;
  margin-top: 20px;
`;

const Card = styled.div`
  width: 100%;
  padding: 8px 16px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 2px rgb(0 0 0 / 15%);
`;

const CardTitle = styled.h3`
  margin-bottom: 8px;
  font-size: 1rem;
`;

const IconContainer = styled.div`
  margin-bottom: 8px;
`;
const OptionTitle = styled.span`
  margin-right: 16px;
  font-weight: 550;
`;
const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const Option = ({ title, value }) => {
  return (
    <OptionContainer>
      <OptionTitle>{title}</OptionTitle>
      <span>{value}</span>
    </OptionContainer>
  );
};


