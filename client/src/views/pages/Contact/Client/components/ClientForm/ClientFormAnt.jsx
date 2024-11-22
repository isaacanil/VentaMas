import React, { useEffect, useState } from 'react';
import * as ant from 'antd';
import { fbUpdateClient } from '../../../../../../firebase/client/fbUpdateClient';
import { fbAddClient } from '../../../../../../firebase/client/fbAddClient';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { nanoid } from 'nanoid';
import { OPERATION_MODES } from '../../../../../../constants/modes';
import { toggleClientModal } from '../../../../../../features/modals/modalSlice';
import { addClient, setClientMode } from '../../../../../../features/clientCart/clientCartSlice';
import { CLIENT_MODE_BAR } from '../../../../../../features/clientCart/clientMode';
import { ClientGeneralInfo } from './components/ClientGeneralInfo';
import ClientFinancialInfo from './components/ClientFinancialInfo/ClientFinancialInfo';
import { fbUpsertCreditLimit } from '../../../../../../firebase/accountsReceivable/fbUpsertCreditLimit';
const { Modal, Form, Input, Button, Tabs, notification, message } = ant;
/**
 *
 *
 * @param {*} { 
 *     visible, 
 *     onCreate, 
 *     onUpdate, 
 *     onCancel, 
 *     customerData, 
 *     isUpdating = false
 * }
 * @return {*} 
 */
const ClientFormAnt = ({
    isOpen,
    mode,
    data,
    addClientToCart = false,
    //isUpdating = false
}) => {
    const update = OPERATION_MODES.UPDATE.id;
    const create = OPERATION_MODES.CREATE.id;
    const isUpdating = mode === update;
    const [form] = Form.useForm();
    const [creditLimitForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const clientData = form.getFieldsValue();
    const dispatch = useDispatch();
    const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(true);
    const user = useSelector(selectUser);
    const customerData = {
        name: '',
        address: '',
        tel: '',
        personalID: '',
        tel2: '',
        numberId: 0,
        province: '',
        sector: '',
        delivery: {
            status: false,
            value: ''
        },
        ...data
    }
    const client = {
        ...customerData,
        ...data,
        ...clientData
    }
    useEffect(() => {
        if (mode === update && data) {
            form.setFieldsValue(data);
        }
        if (mode === create && !data) {
            form.resetFields();
        }
    }, [mode, data])

    // useEffect(() => {
    //     if (isUpdating && customerData) {
    //         form.setFieldsValue(customerData);
    //     } else {
    //         setTimeout(() => {
    //         form.resetFields();
    //         creditLimitForm.resetFields();
    //         }, 10000);
    //     }
    // }, [customerData, isUpdating]);

    const handleSubmit = async () => {
        // Evitar submissions múltiples
        if (loading || submitted) {
            return;
        }

        try {
            setLoading(true);
            setSubmitted(true); // Marcar como enviado
            let clientCreated = null;
            const values = await form.validateFields();
            const creditLimitData = await creditLimitForm.validateFields();

            delete values.clear;

            const client = {
                ...customerData,
                ...values,
            }

            if (isUpdating) {
                await fbUpdateClient(user, client)
                await fbUpsertCreditLimit({
                    user,
                    client,
                    creditLimitData
                })
                notification.success({
                    message: 'Cliente Actualizado',
                    description: 'La información del cliente ha sido actualizada con éxito.'
                });

            } else {
                console.log('client', JSON.stringify(client))
                clientCreated = await fbAddClient(user, client)
                message.success({
                    message: 'Cliente Creado',
                    description: 'Se ha añadido un nuevo cliente con éxito.'
                });
            }
            if (addClientToCart && clientCreated) {
                dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id))
                dispatch(addClient(clientCreated))
            }

            // Ensure the form is reset only when the modal is still open

            form.resetFields();
            creditLimitForm.resetFields();


            dispatch(toggleClientModal({ mode: create }))
        } catch (info) {
            notification.error({
                message: 'Error al Procesar',
                description: 'Hubo un error al procesar el formulario. Por favor, inténtelo de nuevo.'
            });
            console.log('error:', info);
        } finally {
            setLoading(false);
            // Resetear el estado submitted después de un breve delay
            setTimeout(() => {
                setSubmitted(false);
            }, 2000); // 2 segundos de cooldown
        }
    };
    const handleOpenModal = () => dispatch(toggleClientModal({ mode: create }));

    const handleCancel = () => handleOpenModal();

    const items = [
        {
            key: '1',
            label: 'Info. General',
            children: (
                <ClientGeneralInfo
                    form={form}
                    creditLimitForm={creditLimitForm}
                    customerData={customerData}
                    isUpdating={isUpdating}
                    setIsSubmitButtonDisabled={setIsSubmitButtonDisabled}
                />
            ),
        },
        {
            key: '2',
            label: 'Info. Financiera',
            children: (
                <ClientFinancialInfo
                    creditLimitForm={creditLimitForm}
                    client={client}
                />
            ),
            disabled: !isUpdating
        },
    ];

    return (
        <Modal
            style={{ top: 10 }}
            open={isOpen}
            title={isUpdating ? "Editar Cliente" : "Nuevo Cliente 2"}
            okText={isUpdating ? "Actualizar" : "Crear"}
            cancelText="Cerrar"
            confirmLoading={loading || submitted}
            okButtonProps={{ disabled: loading || submitted }}
            styles={{
                content: {
                    padding: "1.2em"
                }
            }}
            onCancel={handleCancel}
            onOk={handleSubmit}
        >
            <Tabs defaultActiveKey="1" items={items} />
        </Modal>
    );
};

export default ClientFormAnt;
