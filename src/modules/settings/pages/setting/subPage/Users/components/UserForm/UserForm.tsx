import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  message,
  Alert,
  Spin,
  Switch,
  Tag,
  Space,
} from 'antd';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import { getAssignableRoles } from '@/abilities/roles';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectSignUpUserModal,
  toggleSignUpUser,
} from '@/features/modals/modalSlice';
import { fbSignUp } from '@/firebase/Auth/fbAuthV2/fbSignUp';
import { fbUpdateUser } from '@/firebase/Auth/fbAuthV2/fbUpdateUser';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { getAvailablePermissionsForRole } from '@/services/dynamicPermissions';
import type { UserRoleLike, UserRoleOption } from '@/types/users';
import { PASSWORD_STRENGTH_RULE } from '@/utils/formRules';

import DynamicPermissionsManager from '../DynamicPermissionsManager/DynamicPermissionsManager';
import RoleDowngradeConfirmationModal from '../RoleDowngradeConfirmationModal/RoleDowngradeConfirmationModal';
import { ChangeUserPasswordModal } from '../UsersList/ChangeUserPasswordModal';

import { EmailVerificationModal } from './components/EmailVerificationModal';
import { useEmailVerification } from './hooks/useEmailVerification';

type CurrentUser = ReturnType<typeof selectUser>;
type ModalRootState = Parameters<typeof SelectSignUpUserModal>[0];

type UserFormValues = {
  id?: string;
  uid?: string;
  name?: string;
  username?: string;
  realName?: string;
  role?: UserRoleLike;
  active?: boolean;
  email?: string;
  password?: string;
  businessID?: string | null;
  businessId?: string | null;
  [key: string]: unknown;
};

type SignUpModalState = {
  isOpen: boolean;
  data: UserFormValues | null;
  businessID: string | null;
};

type DialogKey = 'password' | 'permissions' | 'downgrade';

type AbilityLike = {
  can: (action: string, subject: string) => boolean;
};

export const SignUpModal = () => {
  const user = useSelector<Parameters<typeof selectUser>[0], CurrentUser>(
    selectUser,
  );
  const signUpModal = useSelector<ModalRootState, SignUpModalState>(
    SelectSignUpUserModal,
  );
  const dispatch = useDispatch();
  const { abilities } = useUserAccess() as { abilities: AbilityLike };

  if (!abilities) {
    return null;
  }

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

interface SignUpModalInnerProps {
  user: CurrentUser;
  signUpModal: SignUpModalState;
  dispatch: ReturnType<typeof useDispatch>;
  assignableRoles: UserRoleOption[];
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canManagePermissions: boolean;
}

const SignUpModalInner = ({
  user,
  signUpModal,
  dispatch,
  assignableRoles,
  canCreateUsers,
  canUpdateUsers,
  canManagePermissions,
}: SignUpModalInnerProps) => {
  const [form] = Form.useForm<UserFormValues>();
  const { isOpen, data, businessID } = signUpModal;
  const isEditMode = Boolean(data);

  const [loading, setLoading] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<UserFormValues | null>(
    null,
  );
  const [dialogs, setDialogs] = useState({
    password: false,
    permissions: false,
    downgrade: false,
  });

  const userId = (data?.id || data?.uid || null) as string | null;
  const emailVerification = useEmailVerification({
    form,
    isEditMode,
    userId,
    initialEmail: data?.email,
    initialEmailVerified: data?.emailVerified === true,
  });

  const currentEmailNormalized = emailVerification.currentEmailNormalized;
  const isCurrentEmailVerified = emailVerification.isCurrentEmailVerified;
  const mustVerifyEmailToSubmit = emailVerification.mustVerifyEmailToSubmit;

  const modalLabels = useMemo(
    () => ({
      title: isEditMode ? 'Actualizar Usuario' : 'Crear Usuario',
      submit: isEditMode ? 'Actualizar Usuario' : 'Crear Usuario',
      spin: isEditMode ? 'Actualizando Usuario...' : 'Creando Usuario...',
    }),
    [isEditMode],
  );

  const abilityError = useMemo(() => {
    if (isEditMode && !canUpdateUsers)
      return 'No tienes permisos para actualizar usuarios';
    if (!isEditMode && !canCreateUsers)
      return 'No tienes permisos para crear usuarios';
    return null;
  }, [canCreateUsers, canUpdateUsers, isEditMode]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return { active: true };
    }
    return {
      ...data,
      name:
        typeof data?.name === 'string' ? data.name.toLowerCase() : data?.name,
      active: data?.active ?? true,
    };
  }, [data, isEditMode]);

  const availableDynamicPermissions = useMemo(() => {
    if (!isEditMode) return [];
    return getAvailablePermissionsForRole(data?.role);
  }, [data?.role, isEditMode]);

  const canUseDynamicPermissions = useMemo(
    () =>
      canManagePermissions &&
      isEditMode &&
      availableDynamicPermissions.length > 0,
    [availableDynamicPermissions.length, canManagePermissions, isEditMode],
  );

  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(initialValues);
  }, [form, initialValues, isOpen, data?.email, data?.emailVerified]);

  const handleClose = useCallback(() => {
    setFbError(null);
    setPendingValues(null);
    setDialogs({ password: false, permissions: false, downgrade: false });
    dispatch(toggleSignUpUser({ isOpen: false }));
  }, [dispatch]);

  const setDialogState = useCallback((key: DialogKey, value: boolean) => {
    setDialogs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openPasswordDialog = useCallback(
    () => setDialogState('password', true),
    [setDialogState],
  );
  const closePasswordDialog = useCallback(
    () => setDialogState('password', false),
    [setDialogState],
  );
  const openPermissionsDialog = useCallback(() => {
    if (!canUseDynamicPermissions) return;
    setDialogState('permissions', true);
  }, [canUseDynamicPermissions, setDialogState]);
  const closePermissionsDialog = useCallback(
    () => setDialogState('permissions', false),
    [setDialogState],
  );
  const openDowngradeDialog = useCallback(
    () => setDialogState('downgrade', true),
    [setDialogState],
  );
  const closeDowngradeDialog = useCallback(
    () => setDialogState('downgrade', false),
    [setDialogState],
  );

  const mutateUser = useCallback(
    (values: UserFormValues) => {
      setLoading(true);
      setFbError(null);

      const normalizedName =
        typeof values?.name === 'string'
          ? values.name.trim().toLowerCase()
          : values?.name;

      const normalizedEmail =
        typeof values?.email === 'string' && values.email.trim()
          ? values.email.trim().toLowerCase()
          : undefined;

      const payload: UserFormValues = {
        ...(isEditMode
          ? { id: data?.id || data?.uid }
          : {}),
        ...values,
        name: normalizedName,
        email: normalizedEmail,
        businessID: businessID || user?.businessID || null,
      };

      const submitPromise = isEditMode ? fbUpdateUser(payload) : fbSignUp(payload);

      void submitPromise.then(
        () => {
          message.success(
            isEditMode
              ? 'Usuario actualizado exitosamente'
              : 'Usuario creado exitosamente',
          );
          form.resetFields();
          handleClose();
          setLoading(false);
        },
        (error) => {
          console.error(error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Error procesando la operación';
          setFbError(errorMessage);
          message.error(errorMessage);
          setLoading(false);
        },
      );
    },
    [businessID, data, form, handleClose, isEditMode, user?.businessID],
  );

  const handleSubmit = useCallback(
    (values: UserFormValues) => {
      if (abilityError) {
        message.error(abilityError);
        return;
      }

      const normalizedValues = {
        ...values,
        name:
          typeof values?.name === 'string'
            ? values.name.trim().toLowerCase()
            : values?.name,
        active: values?.active ?? data?.active ?? true,
      };

      if (
        isEditMode &&
        data?.role &&
        values?.role &&
        isRoleDowngrade(data.role, values.role)
      ) {
        setPendingValues(normalizedValues);
        openDowngradeDialog();
        return;
      }

      mutateUser(normalizedValues);
    },
    [abilityError, data, isEditMode, mutateUser, openDowngradeDialog],
  );

  const handleDowngradeConfirm = useCallback(async () => {
    const values = pendingValues;
    closeDowngradeDialog();
    if (!values) return;
    await mutateUser(values);
    setPendingValues(null);
  }, [closeDowngradeDialog, mutateUser, pendingValues]);

  const handleDowngradeCancel = useCallback(() => {
    closeDowngradeDialog();
    setPendingValues(null);
  }, [closeDowngradeDialog]);

  const footerButtons = useMemo(
    () => [
      <Button key="cancel" onClick={handleClose}>
        Cancelar
      </Button>,
      <Button
        key="submit"
        type="primary"
        disabled={
          loading ||
          (isEditMode ? !canUpdateUsers : !canCreateUsers) ||
          mustVerifyEmailToSubmit
        }
        onClick={() => form.submit()}
      >
        {modalLabels.submit}
      </Button>,
    ],
    [
      canCreateUsers,
      canUpdateUsers,
      form,
      handleClose,
      isEditMode,
      loading,
      modalLabels.submit,
      mustVerifyEmailToSubmit,
    ],
  );

  return (
    <Fragment>
      <Modal
        key={userId || 'create'}
        style={{ top: 20 }}
        open={isOpen}
        title={modalLabels.title}
        onCancel={handleClose}
        footer={footerButtons}
      >
        <Spin spinning={loading} tip={modalLabels.spin}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ display: 'grid', gap: '1em' }}
          >
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
              normalize={(value: unknown) =>
                typeof value === 'string' ? value.trim().toLowerCase() : value
              }
              rules={[
                {
                  required: true,
                  message: 'Por favor, ingresa tu nombre de usuario!',
                },
                {
                  min: 3,
                  message:
                    'El nombre de usuario debe tener al menos 3 caracteres!',
                },
                {
                  max: 30,
                  message:
                    'El nombre de usuario debe tener como máximo 30 caracteres!',
                },
              ]}
              help="Elige un identificador único para acceder al sistema. Se convierte automáticamente a minúsculas."
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>Correo Electrónico</span>
                  {isEditMode && isCurrentEmailVerified && (
                    <Tag color="success">Verificado</Tag>
                  )}
                </Space>
              }
              name="email"
              normalize={(value: unknown) =>
                typeof value === 'string' ? value.trim().toLowerCase() : value
              }
              rules={[
                {
                  type: 'email',
                  message: 'Ingresa un correo electrónico válido.',
                },
              ]}
              help="Correo asociado al usuario. Permite iniciar sesión con Google u otros proveedores de autenticación."
            >
              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                disabled={!isEditMode}
                onChange={() => {
                  emailVerification.onEmailInputChanged();
                }}
              />
            </Form.Item>

            {!isEditMode && (
              <Alert
                type="info"
                showIcon
                message="Para vincular un correo, primero crea el usuario. Luego edítalo para enviar el código y verificar el email."
              />
            )}

            {isEditMode && mustVerifyEmailToSubmit && (
              <Alert
                type="warning"
                showIcon
                message="Cambiaste el correo. Verifícalo antes de poder actualizar el usuario."
              />
            )}

            {isEditMode && currentEmailNormalized && !isCurrentEmailVerified && (
              <div style={{ marginTop: -8, marginBottom: 16 }}>
                <Button
                  size="small"
                  type="link"
                  onClick={emailVerification.openEmailVerificationModal}
                >
                  Verificar correo
                </Button>
              </div>
            )}

            <Form.Item
              label="Rol"
              name="role"
              rules={[
                { required: true, message: 'Por favor, selecciona un rol!' },
              ]}
              help={
                assignableRoles.length === 0
                  ? 'No tienes permisos para asignar roles a otros usuarios.'
                  : 'Selecciona el rol que tendrá el usuario en el sistema.'
              }
            >
              <Select
                placeholder={
                  assignableRoles.length === 0
                    ? 'Sin roles disponibles'
                    : 'Selecciona un rol'
                }
                options={assignableRoles}
                disabled={assignableRoles.length === 0}
              />
            </Form.Item>

            {!isEditMode && (
              <Form.Item
                label="Contraseña"
                name="password"
                rules={PASSWORD_STRENGTH_RULE}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            )}

            {isEditMode && (
              <Fragment>
                <Form.Item
                  label="Estado del Usuario"
                  name="active"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Activo"
                    unCheckedChildren="Inactivo"
                  />
                </Form.Item>

                <div
                  style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}
                >
                  <Button onClick={openPasswordDialog}>
                    Cambiar Contraseña
                  </Button>
                  {canUseDynamicPermissions && (
                    <Button onClick={openPermissionsDialog}>
                      Gestionar Permisos
                    </Button>
                  )}
                </div>
              </Fragment>
            )}

            {fbError && <Alert message={fbError} type="error" showIcon />}
          </Form>
        </Spin>
      </Modal>

      <EmailVerificationModal
        open={emailVerification.isEmailVerificationModalOpen}
        email={currentEmailNormalized}
        state={emailVerification.emailVerifyState}
        expiresAtMillis={emailVerification.expiresAtMillis}
        code={emailVerification.verificationCode}
        onCodeChange={emailVerification.setVerificationCode}
        onSend={emailVerification.sendVerification}
        onVerify={emailVerification.verifyCode}
        onCancel={emailVerification.closeEmailVerificationModal}
      />

      <ChangeUserPasswordModal
        isOpen={dialogs.password}
        user={data}
        onClose={closePasswordDialog}
      />

      {canUseDynamicPermissions && (
        <DynamicPermissionsManager
          userId={data?.id}
          userName={data?.name}
          userRole={data?.role}
          isOpen={dialogs.permissions}
          onClose={closePermissionsDialog}
        />
      )}

      <RoleDowngradeConfirmationModal
        isOpen={dialogs.downgrade}
        currentRole={data?.role}
        newRole={pendingValues?.role}
        userName={data?.name || data?.realName}
        onConfirm={handleDowngradeConfirm}
        onCancel={handleDowngradeCancel}
      />
    </Fragment>
  );
};

// Jerarquía de roles (mayor a menor privilegio)
const ROLE_HIERARCHY: Record<string, number> = {
  dev: 6,
  owner: 5,
  admin: 4,
  manager: 3,
  buyer: 2,
  cashier: 1,
};

// Función para detectar si hay un downgrade de rol
const isRoleDowngrade = (
  currentRole?: UserRoleLike,
  newRole?: UserRoleLike,
) => {
  const currentLevel = ROLE_HIERARCHY[currentRole] || 0;
  const newLevel = ROLE_HIERARCHY[newRole] || 0;
  return currentLevel > newLevel;
};
