import React, { Fragment, useEffect, useState } from 'react';
import * as antd from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useNavigate } from 'react-router-dom';
import { fbSignUp } from '../../../../../../firebase/Auth/fbAuthV2/fbSignUp';
import { userAccess } from '../../../../../../hooks/abilities/useAbilities';
import { SelectSignUpUserModal, toggleSignUpUser } from '../../../../../../features/modals/modalSlice';
const { Modal, Form, Input, Button, Select, message, Alert, Spin, Typography, Switch } = antd;
const { Option } = Select;
import { useDispatch } from 'react-redux';
import { ChangePassword } from './EditUser/ChangePassword/ChangePassword';
import { fbUpdateUser } from '../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser';
export const SignUpModal = () => {
    const [form] = Form.useForm();
    const user = useSelector(selectUser);
    const [isOpenChangePassword, setIsOpenChangePassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const { abilities } = userAccess();
    const signUpModal = useSelector(SelectSignUpUserModal)
    const { isOpen, data } = signUpModal;
    const [fbError, setFbError] = useState(null);
    const dispatch = useDispatch()

    const userRoles = [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Gerente' },
        { value: 'cashier', label: 'Cajero' },
        { value: 'specialCashier1', label: 'Cajero - Especial 1' },
        { value: 'specialCashier2', label: 'Cajero - Especial 2' },
        { value: 'buyer', label: 'Comprador' },
    ];

    const handleSubmit = async (values) => {
        setLoading(true);
        const userData = {
            ...data,
            ...values,
            businessID: user.businessID,
        };
        try {
            if (data) {
                await fbUpdateUser(userData);
                message.success('Usuario actualizado exitosamente');
                form.resetFields();

            } else {
                await fbSignUp(userData);
                message.success('Usuario creado exitosamente');
                form.resetFields();
            }
            handleClose();
        }
        catch (error) {
            console.error(error);
            setFbError(error.message);
            message.error(error.message);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    };

    useEffect(() => {
        form.resetFields();
        setFbError(null);
    }, [isOpen]);

    useEffect(() => {
        if (data) {
            form.setFieldsValue(data)
            setFbError(null);
        }
    }, [data])

    const handleClose = () => {

        dispatch(toggleSignUpUser({ isOpen: false }))
    }
    const handleIsOpenChangePassWord = () => {
        setIsOpenChangePassword(!isOpenChangePassword)
    }

    return (
        <Fragment>
            <Modal
                onCancel={handleClose}
                style={{ top: 20 }}
                open={isOpen}
                footer={[
                    <Button key="back" onClick={handleClose}>
                        Cancelar
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"

                        onClick={() => form.submit()}
                    >
                        {data ? "Actualizar Usuario" : "Crear Usuario"}
                    </Button>,
                ]}
            >
                <Spin
                    spinning={loading}
                    tip={data ? 'Actualizando Usuario...' : 'Creando Usuario...'}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        style={{
                            display: 'grid',
                            gap: '1em',
                        }}
                    >
                        <Typography.Title level={3}> {data ? "Actualizar" : "Crear Usuario"}</Typography.Title>
                        <Form.Item
                            label="Nombre o Alias"
                            name="realName"
                            help="Nombre real o alias del usuario. Este campo es opcional."
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Nombre de Usuario"
                            name="name"
                            rules={[
                                { required: true, message: 'Por favor, ingresa tu nombre de usuario!' },
                                { min: 3, message: 'El nombre de usuario debe tener al menos 3 caracteres!' },
                                { max: 20, message: 'El nombre de usuario debe tener como máximo 30 caracteres!' },
                            ]}
                            help="Elige un identificador único para acceder al sistema."
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Rol"
                            name="role"
                            rules={[{ required: true, message: 'Por favor, selecciona un rol!' }]}
                        >
                            <Select
                                placeholder="Selecciona un rol"
                                options={userRoles}
                            />
                        </Form.Item>
                        {
                            !data && (
                                <Form.Item
                                    label="Contraseña"
                                    name="password"

                                    rules={[
                                        { required: true, message: 'Por favor, ingresa tu contraseña!' },
                                        { min: 6, message: 'La contraseña debe tener al menos 6 caracteres!' },
                                        { pattern: /(?=.*[A-Z])/, message: 'La contraseña debe tener al menos una letra mayúscula.' },
                                        { pattern: /(?=.*[a-z])/, message: 'La contraseña debe tener al menos  una letra minúscula.' },
                                        { pattern: /(?=.*[0-9])/, message: 'La contraseña debe tener al menos un número' }
                                    ]}
                                >
                                    <Input.Password
                                        autoComplete='new-password'
                                    />
                                </Form.Item>
                            )
                        }
                        {
                            data && (
                                <div>
                                    <Form.Item
                                        label="Estado del Usuario"
                                        name="active"
                                        valuePropName="checked" // Importante para que el Form.Item controle el estado checked del Switch basado en el valor del formulario
                                    >
                                        <Switch
                                            checkedChildren="Activo"
                                            unCheckedChildren="Inactivo"
                                            onChange={(checked) => form.setFieldsValue({ active: checked })}
                                        />
                                    </Form.Item>

                                    <Button
                                        onClick={handleIsOpenChangePassWord}
                                    >
                                        Cambiar Contraseña
                                    </Button>
                                </div>
                            )
                        }

                        {fbError &&
                            <Alert
                                message={fbError ? fbError : null}
                                type="error"
                                showIcon
                            />}
                        <br />
                    </Form>
                </Spin>
            </Modal>
            <ChangePassword
                isOpen={isOpenChangePassword}
                setIsOpen={setIsOpenChangePassword}
                user={data}
                onClose={handleIsOpenChangePassWord}
            />
        </Fragment>
    );
};


