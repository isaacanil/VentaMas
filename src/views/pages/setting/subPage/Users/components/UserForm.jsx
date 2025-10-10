import { Modal, Form, Input, Button, Select, message, Alert, Spin, Typography, Switch } from 'antd';
import { Fragment, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { getAssignableRoles } from '../../../../../../abilities/roles';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { SelectSignUpUserModal, toggleSignUpUser } from '../../../../../../features/modals/modalSlice';
import { fbSignUp } from '../../../../../../firebase/Auth/fbAuthV2/fbSignUp';
import { fbUpdateUser } from '../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser';
import { userAccess } from '../../../../../../hooks/abilities/useAbilities';

import DynamicPermissionsManager from './DynamicPermissionsManager';
import { ChangePassword } from './EditUser/ChangePassword/ChangePassword';
import RoleDowngradeConfirmationModal from './RoleDowngradeConfirmationModal';


export const SignUpModal = () => {
    const user = useSelector(selectUser);
    const signUpModal = useSelector(SelectSignUpUserModal);
    const dispatch = useDispatch();
    const { abilities } = userAccess();

    const canManageUsers = abilities.can('manage', 'User');
    const canCreateUsers = abilities.can('create', 'User') || canManageUsers;
    const canUpdateUsers = abilities.can('update', 'User') || canManageUsers;
    const canManagePermissions = abilities.can('manage', 'users');

    const assignableRoles = getAssignableRoles(user);

    if (!canManageUsers && !canCreateUsers && !canUpdateUsers) {
        return null;
    }

    return (
        <SignUpModalInner
            user={user}
            signUpModal={signUpModal}
            dispatch={dispatch}
            assignableRoles={assignableRoles}
            canCreateUsers={canCreateUsers}
            canUpdateUsers={canUpdateUsers}
            canManagePermissions={canManagePermissions}
        />
    );
};

const SignUpModalInner = ({
    user,
    signUpModal,
    dispatch,
    assignableRoles,
    canCreateUsers,
    canUpdateUsers,
    canManagePermissions,
}) => {
    const [form] = Form.useForm();
    const [isOpenChangePassword, setIsOpenChangePassword] = useState(false);
    const [isOpenPermissions, setIsOpenPermissions] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [pendingFormValues, setPendingFormValues] = useState(null);
    const [loading, setLoading] = useState(false);
    const { isOpen, data } = signUpModal;
    const [fbError, setFbError] = useState(null);

    const handleIsOpenChangePassWord = () => {
        setIsOpenChangePassword(!isOpenChangePassword);
    };

    const handleIsOpenPermissions = () => {
        setIsOpenPermissions(!isOpenPermissions);
    };

    const handleSubmit = async (values) => {
        // Verificar permisos antes de proceder
        if (data && !canUpdateUsers) {
            message.error('No tienes permisos para actualizar usuarios');
            return;
        }
        if (!data && !canCreateUsers) {
            message.error('No tienes permisos para crear usuarios');
            return;
        }

        // Verificar si hay un downgrade de rol y solicitar confirmación
        if (data && data.role && values.role && isRoleDowngrade(data.role, values.role)) {
            setPendingFormValues(values);
            setShowDowngradeModal(true);
            return;
        }

        // Proceder con la actualización normal
        await processUserUpdate(values);
    };

    const processUserUpdate = async (values) => {
        setLoading(true);
        const userData = {
            ...data,
            ...values,
            businessID: signUpModal.businessID || user.businessID,
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

    // Handlers para el modal de confirmación de downgrade
    const handleDowngradeConfirm = async () => {
        setShowDowngradeModal(false);
        if (pendingFormValues) {
            await processUserUpdate(pendingFormValues);
            setPendingFormValues(null);
        }
    };

    const handleDowngradeCancel = () => {
        setShowDowngradeModal(false);
        setPendingFormValues(null);
    };

    useEffect(() => {
        form.resetFields();
        setFbError(null);
    }, [isOpen, form]);
    
    useEffect(() => {
        if (data) {
            form.setFieldsValue(data)
            setFbError(null);
        }
    }, [data, form]);
    
    const handleClose = () => {
        dispatch(toggleSignUpUser({ isOpen: false }));
    };

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
                        disabled={data ? !canUpdateUsers : !canCreateUsers}
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
                                { max: 30, message: 'El nombre de usuario debe tener como máximo 30 caracteres!' },
                            ]}
                            help="Elige un identificador único para acceder al sistema."
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item
                            label="Rol"
                            name="role"
                            rules={[{ required: true, message: 'Por favor, selecciona un rol!' }]}
                            help={assignableRoles.length === 0 ? "No tienes permisos para asignar roles a otros usuarios." : "Selecciona el rol que tendrá el usuario en el sistema."}
                        >
                            <Select
                                placeholder={assignableRoles.length === 0 ? "Sin roles disponibles" : "Selecciona un rol"}
                                options={assignableRoles}
                                disabled={assignableRoles.length === 0}
                            />
                        </Form.Item>
                        {
                            !data && (
                                <Form.Item
                                    label="Contraseña"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Por favor, ingresa tu contraseña!' },
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
                                    
                                    {canManagePermissions && (
                                        <Button
                                            type="default"
                                            style={{ marginLeft: '8px' }}
                                            onClick={handleIsOpenPermissions}
                                        >
                                            Gestionar Permisos
                                        </Button>
                                    )}
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
            {canManagePermissions && data && (
                <DynamicPermissionsManager
                    userId={data.id}
                    userName={data.name}
                    userRole={data.role}
                    isOpen={isOpenPermissions}
                    onClose={handleIsOpenPermissions}
                />
            )}
            <RoleDowngradeConfirmationModal
                isOpen={showDowngradeModal}
                currentRole={data?.role}
                newRole={pendingFormValues?.role}
                userName={data?.name || data?.realName}
                onConfirm={handleDowngradeConfirm}
                onCancel={handleDowngradeCancel}
            />
        </Fragment>
    );
};

// Jerarquía de roles (mayor a menor privilegio)
const ROLE_HIERARCHY = {
    'dev': 6,
    'owner': 5,
    'admin': 4,
    'manager': 3,
    'buyer': 2,
    'cashier': 1
};

// Función para detectar si hay un downgrade de rol
const isRoleDowngrade = (currentRole, newRole) => {
    const currentLevel = ROLE_HIERARCHY[currentRole] || 0;
    const newLevel = ROLE_HIERARCHY[newRole] || 0;
    return currentLevel > newLevel;
};
