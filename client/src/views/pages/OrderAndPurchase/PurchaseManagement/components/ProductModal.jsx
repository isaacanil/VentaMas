import { Modal, Form, Input, InputNumber, DatePicker, Statistic } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const ProductModal = ({ visible, onCancel, onSave, initialData }) => {
    const [form] = Form.useForm();
    const [unitCost, setUnitCost] = useState(0);
    const [subTotal, setSubTotal] = useState(0);
    const [calculatedITBIS, setCalculatedITBIS] = useState(0);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSave(values);
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const calculateCosts = () => {
        const { baseCost = 0, ITBIS = 0, freight = 0, otherCosts = 0, quantity = 1, taxRate = 0 } = form.getFieldsValue();
        const calculatedITBIS = (baseCost * taxRate) / 100;
        setCalculatedITBIS(calculatedITBIS);
        const unitCost = baseCost + calculatedITBIS + freight + otherCosts;
        setUnitCost(unitCost);
        setSubTotal(unitCost * quantity);
    };

    useEffect(() => {
        if (visible && initialData) {
            form.setFieldsValue(initialData);
            calculateCosts();
        } else {
            form.resetFields();
            setUnitCost(0);
            setSubTotal(0);
            setCalculatedITBIS(0);
        }
    }, [visible, initialData, form]);

    useEffect(() => {
        form.validateFields().then(calculateCosts).catch(() => { });
    }, [form]);

    return (
        <Modal
            title={initialData ? "Editar Producto" : "Agregar Producto"}
            open={visible}
            style={{ top: 10 }}
            // width={800}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
        >
            <Form form={form} layout="vertical">
                <Form.Item 
                    name="productName" 
                    label="Nombre del Producto"
                    tooltip={'Nombre o descripción del producto a registrar'}
                    rules={[{ required: true, message: 'Por favor ingrese el nombre del producto' }]}
                >
                    <Input />
                </Form.Item>
                <Group>
                    <Form.Item 
                        name="quantity" 
                        label="Cantidad"
                        tooltip={'Cantidad de unidades del producto'}
                        rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
                    >
                        <InputNumber style={{ width: '100%' }} onChange={calculateCosts} />
                    </Form.Item>
                    <Form.Item 
                        name="unitMeasure" 
                        label="Unidad de Medida"
                        tooltip={'Unidad de medida del producto (ej: unidad, kg, litros)'}
                        rules={[{ required: true, message: 'Por favor ingrese la unidad de medida' }]}
                    >
                        <Input />
                    </Form.Item>
                </Group>
                <Form.Item 
                    name="expirationDate" 
                    label="Fecha de Expiración"
                    tooltip={'Fecha de vencimiento del producto'}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Group>
                    <Form.Item 
                        name="baseCost" 
                        label="Costo Base"
                        tooltip={'Costo base del producto sin impuestos ni otros cargos'}
                        rules={[{ required: true, message: 'Por favor ingrese el costo base' }]}
                    >
                        <InputNumber style={{ width: '100%' }} onChange={calculateCosts} />
                    </Form.Item>
                    <Form.Item 
                        name="taxRate" 
                        label="Porcentaje de ITBIS"
                        tooltip={'Porcentaje de impuesto ITBIS aplicable al producto'}
                        rules={[{ required: true, message: 'Por favor ingrese el porcentaje de ITBIS' }]}
                    >
                        <InputNumber 
                            style={{ width: '100%' }} 
                            onChange={calculateCosts}
                            addonAfter={calculatedITBIS}
                        />
                    </Form.Item>
                    <Form.Item 
                        name="freight" 
                        label="Flete"
                        tooltip={'Costo de transporte o envío del producto'}
                    >
                        <InputNumber style={{ width: '100%' }} onChange={calculateCosts} />
                    </Form.Item>
                    <Form.Item 
                        name="otherCosts" 
                        label="Otros Costos"
                        tooltip={'Costos adicionales no incluidos en las categorías anteriores'}
                    >
                        <InputNumber style={{ width: '100%' }} onChange={calculateCosts} />
                    </Form.Item>
                </Group>
                <Group>
                    <Form.Item label="Costo Unitario">
                        <TotalItem value={unitCost} />
                    </Form.Item>
                    <Form.Item label="SubTotal">
                        <TotalItem value={subTotal} />
                    </Form.Item>
                </Group>
            </Form>
        </Modal>
    );
};

export default ProductModal;

const Group = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1em;
`;

const TotalItem = styled(Statistic)`
  .ant-statistic-title {
    color: #8c8c8c;
    font-size: 14px;
  }
  .ant-statistic-content {
    color: #262626;
    font-size: 16px;
    font-weight: bold;
  }
`;