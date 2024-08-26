import React from 'react'
import * as antd from 'antd';
import styled from 'styled-components';
import { fbDeleteClient } from '../../../../../../../firebase/client/fbDeleteClient';
import { selectUser } from '../../../../../../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toggleClientModal } from '../../../../../../../features/modals/modalSlice';
import { OPERATION_MODES } from '../../../../../../../constants/modes';
const { Form, Input, Button, notification } = antd;
export const ClientGeneralInfo = ({ form, customerData, creditLimitForm }) => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const update = OPERATION_MODES.UPDATE.id;
    const create = OPERATION_MODES.CREATE.id;
    const handleDeleteUser = async () => {
        try {
            await fbDeleteClient(user.businessID, customerData.id);

            form.resetFields();
            creditLimitForm.resetFields();

            notification.success({
                message: 'Cliente Actualizado',
                description: 'Eliminado Correctamente'
            });
            dispatch(toggleClientModal({ mode: create }))

        } catch (error) {
            console.log(error)
        }
    }
    return (
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
                label="Nombre Completo"
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
                name="personalID"
                label="Cédula/RNC"
            >
                <Input />
            </Form.Item>
            <FlexContainer>
                <Form.Item
                    name="tel"
                    label="Teléfono 1"
                    style={{
                        width: '100%'
                    }}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="tel2"
                    label="Teléfono 2"
                    style={{
                        width: '100%'
                    }}
                >
                    <Input />
                </Form.Item>

            </FlexContainer>

            <Form.Item
                name="address"
                label="Dirección"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="sector"
                label="Sector"
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="province"
                label="Provincia"
            >
                <Input />
            </Form.Item>
            <Button danger onClick={handleDeleteUser} >Eliminar Usuarios</Button>
        </Form>
    )
}

const FlexContainer = styled.div`
    display: flex;
    gap: 1em;
    flex-grow: 1;

`