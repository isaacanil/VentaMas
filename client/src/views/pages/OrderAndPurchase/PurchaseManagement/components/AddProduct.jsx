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
        form.validateFields().then(calculateCosts).catch(() => { });
    }, [form]);

    return (
        <RowContainer>
            <Form
                form={form}
                layout="horizontal"
            >
                <FieldsRow>
                    <Tooltip title='Nombre del Producto'>
                        <StyledFormItem
                            name="productName"
                            label="Producto"
                            rules={[{ required: true }]}
                        >
                            <Input placeholder="Producto" />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Fecha de Expiración'>
                        <StyledFormItem name="expirationDate" label="F. Expiración">
                            <DatePicker format='DD/MM/YY' placeholder="Fecha. Exp" />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Cantidad'>
                        <StyledFormItem
                            name="quantity"
                            label="Cant."
                            rules={[{ required: true }]}
                        >
                            <InputNumber placeholder="Cantidad" onChange={calculateCosts} />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Unidad de Medida'>
                        <StyledFormItem
                            name="unitMeasure"
                            label={
                                "Unid. Medida"
                            }
                            rules={[{ required: true }]}
                        >

                            <Input placeholder="Unidad" />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Costo Base'>
                        <StyledFormItem
                            name="baseCost"
                            label="Costo Base"

                            rules={[{ required: true }]}
                        >
                            <InputNumber placeholder="Costo" style={{ width: '100%' }} onChange={calculateCosts} />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='ITBIS'>
                        <StyledFormItem
                            name="taxRate"
                            label="ITBIS (%)"

                            rules={[{ required: true }]}
                        >
                            <InputNumber
                                placeholder="%"
                                onChange={calculateCosts}
                            // addonAfter={calculatedITBIS.toFixed(2)}
                            />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Flete'>
                        <StyledFormItem name="freight" label="Flete">
                            <InputNumber placeholder="Flete" onChange={calculateCosts} />
                        </StyledFormItem>
                    </Tooltip>
                    <Tooltip title='Otros Costos'>
                        <StyledFormItem name="otherCosts" label="Otros">
                            <InputNumber placeholder="Otros" onChange={calculateCosts} />
                        </StyledFormItem>
                    </Tooltip>
                    <ActionContainer>
                        <Tooltip title='Costo Unitario'>
                            <TotalItem title="Costo. Unitario" value={unitCost} />
                        </Tooltip>
                        <Tooltip title='Subtotal'>
                            <TotalItem title="Subtotal" value={subTotal} />
                        </Tooltip>
                        <Tooltip title='Agregar Producto'>
                            <Button type="primary" onClick={handleSubmit}>
                                Agregar
                            </Button>
                        </Tooltip>
                    </ActionContainer>
                </FieldsRow>
            </Form>
        </RowContainer>
    );
};

export default ProductRow;

const RowContainer = styled.div`
    padding-bottom: 0.2em;
    margin-bottom: 1em;
`;

const FieldsRow = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 100px min-content 115px 105px min-content  min-content min-content 2fr;
    gap: 8px;
    align-items: end; /* Centra verticalmente los campos */
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
    align-items: end;
    padding: 0 0 0.3em 0;
    justify-content: flex-end;
  
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
    
    .ant-form-item-label {
    height: 3.2em;
    display: flex;
    align-items: end;
}


    .ant-form-item-control {
        min-height: unset; // Elimina la altura mínima predeterminada
    }

    &.ant-form-item {
        margin-bottom: 0;
       
        display: flex;
        flex-direction: column;
    }


`;