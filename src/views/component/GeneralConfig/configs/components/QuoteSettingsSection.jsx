import { Form, Input, InputNumber, Checkbox, message } from 'antd';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';

const ConfigItem = styled.div`
  padding-left: ${(props) => (props.level || 0) * 16}px;
  margin-bottom: 8px;
`;

const QuoteSettingsSection = () => {
    const user = useSelector(selectUser);
    const [form] = Form.useForm();
    const { billing: { quoteEnabled, quoteDefaultNote, quoteValidity } } = useSelector(SelectSettingCart);

    // Actualizamos los valores del formulario cada vez que cambien los datos del store.
    useEffect(() => {
      form.setFieldsValue({
          quoteEnabled,
          quoteDefaultNote,
          quoteValidity: quoteValidity || 15,
      });
    }, [quoteEnabled, quoteDefaultNote, quoteValidity, form]);

    const handleQuoteEnabled = async (checked) => {
        try {
            await setBillingSettings(user, { quoteEnabled: checked });
            message.success('Configuración guardada exitosamente');
        } catch (error) {
            message.error('Error al guardar la configuración');
        }
    };

    const handleValidityBlur = async (value) => {
        if (!value) return;
        try {
            const numValue = Number(value);
            if (isNaN(numValue)) {
                message.error('Por favor ingrese un número válido');
                return;
            }
            const validValue = numValue > 90 ? 90 : numValue;
            await setBillingSettings(user, { quoteValidity: validValue });
            if (numValue > 90) {
                message.info('El valor máximo permitido es 90 días');
                form.setFieldValue('quoteValidity', 90);
            }
        } catch (error) {
            message.error('Error al guardar la configuración');
        }
    };

    const handleNoteBlur = async (e) => {
        try {
            await setBillingSettings(user, { quoteDefaultNote: e.target.value });
        } catch (error) {
            message.error('Error al guardar la configuración');
        }
    };

    // Usamos useWatch para monitorizar el valor actual del checkbox
    const quoteEnabledValue = Form.useWatch('quoteEnabled', form);

    return (
        <Form layout="vertical" form={form}>
            <ConfigItem level={0}>
                <Form.Item
                    name="quoteEnabled"
                    valuePropName="checked"
                >
                    <Checkbox onChange={(e) => handleQuoteEnabled(e.target.checked)}>
                        Habilitar cotizaciones
                    </Checkbox>
                </Form.Item>
            </ConfigItem>

            {quoteEnabledValue && (
                <>
                    <ConfigItem level={1}>
                        <Form.Item
                            label="Validez de cotización (días)"
                            name="quoteValidity"
                        >
                            <InputNumber 
                                min={1} 
                                max={90}
                                onBlur={(e) => handleValidityBlur(e.target.value)}
                            />
                        </Form.Item>
                    </ConfigItem>
                    <ConfigItem level={1}>
                        <Form.Item
                            label="Nota predeterminada en cotizaciones"
                            name="quoteDefaultNote"
                        >
                            <Input.TextArea 
                                rows={4} 
                                onBlur={handleNoteBlur}
                            />
                        </Form.Item>
                    </ConfigItem>
                </>
            )}
        </Form>
    );
};

export default QuoteSettingsSection;
