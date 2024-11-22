import { Form, Input, InputNumber, DatePicker, Statistic, Button, message, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const ProductRow = ({ onSave, initialData }) => {
    const [form] = Form.useForm();
    const [unitCost, setUnitCost] = useState(0);
    const [subTotal, setSubTotal] = useState(0);
    const [calculatedITBIS, setCalculatedITBIS] = useState(0);

    const calculateCosts = () => {
        const { baseCost = 0, taxRate = 0, freight = 0, otherCosts = 0, quantity = 1 } = form.getFieldsValue();
        const calculatedITBIS = (baseCost * taxRate) / 100;
        setCalculatedITBIS(calculatedITBIS);
        const unitCost = baseCost + calculatedITBIS + freight + otherCosts;
        setUnitCost(unitCost);
        setSubTotal(unitCost * quantity);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSave({ ...values, unitCost, subTotal, calculatedITBIS });
            form.resetFields();
            message.success('Producto agregado correctamente');
        } catch (error) {
            const errorFields = error.errorFields || [];
            if (errorFields.length > 0) {
                message.error('Por favor complete todos los campos requeridos');
            } else {
                message.error('Error al agregar el producto');
            }
        }
    };



    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
            calculateCosts();
        }
    }, [initialData, form]);

    useEffect(() => {
        // form.validateFields().then(calculateCosts).catch(() => { });
    }, [form]);

    return (
        <RowContainer>
            <Form 
                form={form} 
                layout="horizontal"
            >
                <FieldsRow>
                    <StyledFormItem 
                        name="productName" 
                        label="Nombre del Producto" 
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="Nombre del Producto" />
                    </StyledFormItem>

                    <Form.Item name="expirationDate" label="Fecha de Expiración">
                        <DatePicker placeholder="Fecha. Exp" />
                    </Form.Item>

                    <StyledFormItem 
                        name="quantity" 
                        label="Cantidad" 
                        rules={[{ required: true }]}
                    >
                        <InputNumber placeholder="Cantidad" onChange={calculateCosts} />
                    </StyledFormItem>

                    <StyledFormItem 
                        name="unitMeasure" 
                        label="Unidad de Medida" 
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="Unidad" />
                    </StyledFormItem>

                    <StyledFormItem 
                        name="baseCost" 
                        label="Costo Base" 
                        rules={[{ required: true }]}
                    >
                        <InputNumber placeholder="Costo" onChange={calculateCosts} />
                    </StyledFormItem>

                    <StyledFormItem 
                        name="taxRate" 
                        label="ITBIS (%)" 
                        rules={[{ required: true }]}
                    >
                        <InputNumber
                            placeholder="%"
                            onChange={calculateCosts}
                            addonAfter={calculatedITBIS.toFixed(2)}
                        />
                    </StyledFormItem>

                    <Form.Item name="freight" label="Flete">
                        <InputNumber placeholder="Flete" onChange={calculateCosts} />
                    </Form.Item>

                    <Form.Item name="otherCosts" label="Otros">
                        <InputNumber placeholder="Otros" onChange={calculateCosts} />
                    </Form.Item>

                    <ActionContainer>
                        <TotalItem title="C.U." value={unitCost} />
                        <TotalItem title="SubTotal" value={subTotal} />
                        <Button type="primary" onClick={handleSubmit}>
                            Agregar
                        </Button>
                    </ActionContainer>
                </FieldsRow>
            </Form>
        </RowContainer>
    );
};

export default ProductRow;

const RowContainer = styled.div`
    padding-bottom: 2em;
    border-bottom: 1px solid #b80000;
    margin-bottom: 1em;
`;

const FieldsRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 140px min-content 120px min-content 110px min-content min-content min-content min-content;
    gap: 8px;
  

   
`;

const StatsContainer = styled.div`
    display: flex;
    gap: 8px;
`;

const TotalItem = styled(Statistic)`
    .ant-statistic-title {
        font-size: 12px;
    }
    .ant-statistic-content {
        font-size: 14px;
        font-weight: bold;
    }
`;

const ActionContainer = styled(StatsContainer)`
    display: flex;
    align-items: center;
    gap: 8px;
    
    .ant-btn {
        margin-left: 8px;
        height: 32px;
    }
`;

const StyledFormItem = styled(Form.Item)`
    .ant-form-item-explain {
        display: none;
    }
`;