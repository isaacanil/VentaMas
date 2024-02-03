import React, { useEffect, useState } from 'react';
import * as ant from 'antd';
import { fbUpdateClient } from '../../../../../../firebase/client/fbUpdateClient';
import { fbAddClient } from '../../../../../../firebase/client/fbAddClient';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from 'nanoid';
import { OPERATION_MODES } from '../../../../../../constants/modes';
import { toggleClientModal } from '../../../../../../features/modals/modalSlice';
import { addClient, setClientMode } from '../../../../../../features/clientCart/clientCartSlice';
import { CLIENT_MODE_BAR } from '../../../../../../features/clientCart/clientMode';
const { Modal, Form, Input, Button, notification, message } = ant;
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
   const dispatch = useDispatch();
    const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] = useState(true);
    const user = useSelector(selectUser);
    const customerData = {
        name: '',
        address: '',
        tel: '',
        personalID: '',
        delivery: {
            status: false,
            value: ''
        },
        ...data
    
    }
    useEffect(() => {
        if (mode === update && data) {
            form.setFieldsValue(data);
        }
        if (mode === create && !data) {
            form.resetFields();
        }
    }, [mode, data])

    useEffect(() => {
        if (isUpdating && customerData) {
            form.setFieldsValue(customerData);
        } else {
            form.resetFields();
        }
        
    }, [form,  customerData, isUpdating]);

    const handleSubmit = async () => {

        try {
            let clientCreated = null;
            const values = await form.validateFields();
            
            delete values.clear;
            const client = {
                ...values,
                delivery: customerData.delivery
            }
            if (isUpdating) {
                await fbUpdateClient(user, { ...customerData, ...client })
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
            if(addClientToCart && clientCreated){
                dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id))
                dispatch(addClient(clientCreated))
            }
            
            // Ensure the form is reset only when the modal is still open
            if (isOpen) {
                form.resetFields();
            }
            dispatch(toggleClientModal({ mode: create }))
        } catch (info) {
            console.log('Validate Failed:', info);
            notification.error({
                message: 'Error al Procesar',
                description: 'Hubo un error al procesar el formulario. Por favor, inténtelo de nuevo.'
            });
        }
    };
    const handleOpenModal = () => {
        dispatch(toggleClientModal({ mode: create }))
    }
    const handleCancel = () => {
        handleOpenModal()
    }

    return (
        <Modal
            open={isOpen}
            title={isUpdating ? "Editar Cliente" : "Nuevo Cliente"}
            okText={isUpdating ? "Actualizar" : "Crear"}
            cancelText="Cerrar"
            onCancel={handleCancel}
            onOk={handleSubmit}
        >
           
            <Form
                form={form}
                layout="vertical"
                name="form_in_modal"
                initialValues={{
                    ...customerData,
                    modifier: 'public',
                }}
            >
                <Form.Item
                    name="name"
                    label="Nombre"

                    rules={[
                        {
                            required: true,
                            message: 'Por favor ingrese el nombre del cliente',
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="tel"
                    label="Teléfono"
                   
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="personalID"
                    label="RNC/Cédula"
                   
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="address"
                    label="Dirección"
                   
                >
                    <Input />
                </Form.Item>
                
                <Form.Item
                    name="clear"
                    label="Limpiar"

                >
                    <Button
                        onClick={() => {
                            form.resetFields();
                        }}
                        
                    >
                        Limpiar
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ClientFormAnt;
