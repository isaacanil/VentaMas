import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useNavigate } from 'react-router-dom';
import { fbSignUp } from '../../../../../../firebase/Auth/fbAuthV2/fbSignUp';
const { Modal, Form, Input, Button, Select, message, Alert } = antd;
const { Option } = Select;

export const SignUpModal = () => {
    const [form] = Form.useForm();
    const [modalVisible, setModalVisible] = useState(false);
    const userInfo = useSelector(selectUser);
    const navigate = useNavigate();
    const [fbError, setFbError] = useState(null);
    const rolOptions = [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Gerente' },
        { value: 'cashier', label: 'Cajero' },
        { value: 'buyer', label: 'Comprador' },
    ];

    const handleSubmit = async (values) => {
        const user = {
            ...values,
            businessID: userInfo.businessID,
        };

        try {
            await fbSignUp(user);
            message.success('Usuario creado exitosamente');
            setModalVisible(false);
            navigate('/users/list');
            form.resetFields();
        } catch (error) {
            console.error(error);
            setFbError(error.message);
            message.error(error.message);
        }
    };
    useEffect(() => {
        form.resetFields();
    }, []);
        const handleUsernameChange = (e) => {
        // Convertir a minúsculas y quitar espacios en blanco
        const transformedValue = e.target.value.toLowerCase();
        // Actualizar el valor del campo en el formulario
        form.setFieldsValue({ name: transformedValue });
    };

    return (
        <>
          
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{
                        display: 'grid',
                        gap: '1em',
                    
                    }}
                >
                    <Form.Item
                        label="Nombre de Usuario"
                        name="name"
                        rules={[
                            { required: true, message: 'Por favor, ingresa tu nombre de usuario!' },
                            { min: 3, message: 'El nombre de usuario debe tener al menos 3 caracteres!' },
                            { max: 20, message: 'El nombre de usuario debe tener como máximo 30 caracteres!' },

                        ]}
                        help="El nombre de usuario puede contener letras, números, puntos, guiones y guiones bajos."
                        
                    >
                        <Input
                            onChange={handleUsernameChange}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Contraseña"
                        name="password"
                        rules={[
                            { required: true, message: 'Por favor, ingresa tu contraseña!' },
                            { min: 6, message: 'La contraseña debe tener al menos 6 caracteres!' },
                            { pattern: /(?=.*[A-Z])/, message: 'La contraseña debe tener al menos una letra mayúscula.' },
                            { pattern: /(?=.*[a-z])/, message: 'La contraseña debe tener al menos  una letra minúscula.' },
                            { pattern: /(?=.*[0-9])/, message: 'La contraseña debe tener al menos un número'}
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item
                        label="Rol"
                        name="role"
                        rules={[{ required: true, message: 'Por favor, selecciona un rol!' }]}
                    >
                        <Select
                            placeholder="Selecciona un rol"
                            options={rolOptions}
                        />
                    </Form.Item>
                    {fbError &&
                        <Alert
                            message={fbError ? fbError : null}
                            type="error"
                            showIcon
                        />}
                    <br />
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Crear Usuario
                        </Button>
                    </Form.Item>
                </Form>
          
        </>
    );
};


