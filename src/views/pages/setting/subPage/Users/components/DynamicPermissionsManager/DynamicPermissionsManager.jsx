import { Modal, Button, Spin, Switch, Empty, Alert } from 'antd';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities';
import {
  getUserDynamicPermissions,
  setUserDynamicPermissions,
  getAvailablePermissionsForRole,
  getRolePermissionsInfo,
} from '../../../../../../../services/dynamicPermissions';

const DynamicPermissionsManager = ({
  userId,
  userName,
  userRole,
  isOpen,
  onClose,
}) => {
  const [permissions, setPermissions] = useState({
    additionalPermissions: [],
    restrictedPermissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = useSelector(selectUser);

  const { abilities } = userAccess();

  // Verificar si el usuario actual puede gestionar permisos
  const canManagePermissions = abilities.can('manage', 'users');

  useEffect(() => {
    if (isOpen && userId) {
      loadUserPermissions();
    }
  }, [isOpen, userId]);

  const availablePermissions = useMemo(
    () => getAvailablePermissionsForRole(userRole),
    [userRole],
  );

  const unknownActivePermissions = useMemo(
    () =>
      permissions.additionalPermissions.filter(
        (permission) =>
          !availablePermissions.some(
            (available) =>
              available.action === permission.action &&
              available.subject === permission.subject,
          ),
      ),
    [availablePermissions, permissions.additionalPermissions],
  );

  const permissionsByCategory = useMemo(() => {
    if (!availablePermissions.length) {
      return [];
    }

    const grouped = new Map();

    availablePermissions.forEach((permission) => {
      const categoryKey = permission.category || 'Sin categoría';
      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, []);
      }
      grouped.get(categoryKey).push(permission);
    });

    return Array.from(grouped, ([category, groupedPermissions]) => ({
      category,
      permissions: groupedPermissions,
    }));
  }, [availablePermissions]);

  const loadUserPermissions = async () => {
    setLoading(true);
    try {
      const userPermissions = await getUserDynamicPermissions(userId, user);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
    setLoading(false);
  };

  const isPermissionEnabled = useCallback(
    (permission) =>
      permissions.additionalPermissions.some(
        (existing) =>
          existing.action === permission.action &&
          existing.subject === permission.subject,
      ),
    [permissions.additionalPermissions],
  );

  const togglePermission = useCallback((permission, enabled) => {
    setPermissions((prev) => {
      const exists = prev.additionalPermissions.some(
        (item) =>
          item.action === permission.action &&
          item.subject === permission.subject,
      );

      let updated = prev.additionalPermissions;

      if (enabled && !exists) {
        updated = [...prev.additionalPermissions, permission];
      } else if (!enabled && exists) {
        updated = prev.additionalPermissions.filter(
          (item) =>
            !(
              item.action === permission.action &&
              item.subject === permission.subject
            ),
        );
      } else {
        updated = prev.additionalPermissions;
      }

      return {
        ...prev,
        additionalPermissions: updated,
      };
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setUserDynamicPermissions(user, userId, permissions);
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error guardando permisos: ' + error.message);
    }
    setSaving(false);
  };

  if (!canManagePermissions) {
    return null;
  }

  // Obtener información del rol para mostrar en el modal
  const roleInfo = getRolePermissionsInfo(userRole);

  return (
    <Modal
      title={
        <ModalHeader>
          <ModalTitle>Gestionar Permisos Dinámicos</ModalTitle>
          <ModalMeta>
            Usuario: <strong>{userName}</strong> · Rol:{' '}
            <strong>{userRole}</strong> · {roleInfo.totalAvailable} permisos
            disponibles
          </ModalMeta>
        </ModalHeader>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          onClick={handleSave}
          disabled={loading}
        >
          Guardar
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spin size="large" />
          <div style={{ marginTop: '1rem' }}>Cargando permisos...</div>
        </div>
      ) : (
        <Content>
          <SectionHeader>
            <SectionHeading>Permisos Adicionales</SectionHeading>
            <Subtitle>
              Activa los permisos extra que este usuario debe tener además de su
              rol base.
            </Subtitle>
          </SectionHeader>

          {permissionsByCategory.length === 0 ? (
            <Empty
              description="No hay permisos dinámicos disponibles para este rol."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <PermissionGroupsWrapper>
              {permissionsByCategory.map(({ category, permissions }) => (
                <PermissionsContainer key={category}>
                  <PermissionGroupHeader>{category}</PermissionGroupHeader>
                  {permissions.map((permission) => {
                    const permissionLabel =
                      permission.label ||
                      `${permission.action} ${permission.subject}`;
                    const description =
                      permission.description ||
                      `Permite ${permission.action === 'read' ? 'consultar' : 'gestionar'} ${permission.subject}.`;
                    const enabled = isPermissionEnabled(permission);

                    return (
                      <PermissionRow
                        key={`${permission.action}-${permission.subject}`}
                      >
                        <PermissionMeta>
                          <PermissionTitle>{permissionLabel}</PermissionTitle>
                          <PermissionDescription>
                            {description}
                          </PermissionDescription>
                        </PermissionMeta>
                        <Switch
                          checked={enabled}
                          onChange={(checked) =>
                            togglePermission(permission, checked)
                          }
                        />
                      </PermissionRow>
                    );
                  })}
                </PermissionsContainer>
              ))}
            </PermissionGroupsWrapper>
          )}

          {unknownActivePermissions.length > 0 && (
            <InfoAlert
              type="info"
              showIcon
              message="Permisos personalizados activos"
              description="Este usuario conserva permisos que no forman parte del catálogo actual. Permanecerán activos al guardar."
            />
          )}

          <SummaryText>
            Permisos adicionales activos:{' '}
            <strong>{permissions.additionalPermissions.length}</strong>
          </SummaryText>
        </Content>
      )}
    </Modal>
  );
};

export default DynamicPermissionsManager;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ModalTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
`;

const ModalMeta = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.text?.secondary ?? '#4b5563'};
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const SectionHeading = styled.h5`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.88rem;
  color: ${({ theme }) => theme?.text?.secondary ?? '#4b5563'};
`;

const PermissionGroupsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PermissionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme?.border?.primary ?? '#f0f0f0'};
  border-radius: 12px;
`;

const PermissionMeta = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const PermissionTitle = styled.h5`
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.text?.primary ?? '#111827'};
`;

const PermissionDescription = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.text?.secondary ?? '#4b5563'};
`;

const PermissionGroupHeader = styled.div`
  padding: 0.75rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.text?.secondary ?? '#4b5563'};
  background: ${({ theme }) => theme?.background?.muted ?? '#f9fafb'};
  border-bottom: 1px solid ${({ theme }) => theme?.border?.primary ?? '#f0f0f0'};
`;

const InfoAlert = styled(Alert)`
  margin-top: 1rem;
`;

const SummaryText = styled.span`
  display: block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.text?.secondary ?? '#4b5563'};
`;

const PermissionRow = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.85rem 1.1rem;

    &:not(:last-child) {
    border-bottom: 1px solid
      ${({ theme }) => theme?.border?.primary ?? '#f0f0f0'};
  }
`;
