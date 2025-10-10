import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Modal, Button, Select, List, Tag, Typography, Space, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities';
import { 
    getUserDynamicPermissions, 
    setUserDynamicPermissions,
    getAvailablePermissionsForRole,
    getRolePermissionsInfo 
} from '../../../../../../../services/dynamicPermissions';

const { Title, Text } = Typography;
const { Option } = Select;

const DynamicPermissionsManager = ({ userId, userName, userRole, isOpen, onClose }) => {
    const [permissions, setPermissions] = useState({
        additionalPermissions: [],
        restrictedPermissions: []
    });    const [selectedAdditional, setSelectedAdditional] = useState(null);
    // const [selectedRestricted, setSelectedRestricted] = useState(null); // TODO: Para futuro uso de permisos restringidos
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const user = useSelector(selectUser)
    
    const { abilities } = userAccess();
    
    // Verificar si el usuario actual puede gestionar permisos
    const canManagePermissions = abilities.can('manage', 'users');

    useEffect(() => {
        if (isOpen && userId) {
            loadUserPermissions();
        }
    }, [isOpen, userId]);      const loadUserPermissions = async () => {
        setLoading(true);
        try {
            const userPermissions = await getUserDynamicPermissions(userId, user);
            setPermissions(userPermissions);
        } catch (error) {
            console.error('Error loading user permissions:', error);
        }
        setLoading(false);
    };
    const handleAddPermission = (type) => {
        const selected = type === 'additional' ? selectedAdditional : null; // selectedRestricted comentado por ahora
        if (!selected) return;

        setPermissions(prev => ({
            ...prev,
            [type === 'additional' ? 'additionalPermissions' : 'restrictedPermissions']: [
                ...prev[type === 'additional' ? 'additionalPermissions' : 'restrictedPermissions'],
                selected
            ]
        }));

        // Limpiar selección
        if (type === 'additional') {
            setSelectedAdditional(null);
        }
        // TODO: Para futuro uso de permisos restringidos
        // else {
        //     setSelectedRestricted(null);
        // }
    };

    const handleRemovePermission = (type, index) => {
        setPermissions(prev => ({
            ...prev,
            [type === 'additional' ? 'additionalPermissions' : 'restrictedPermissions']: 
                prev[type === 'additional' ? 'additionalPermissions' : 'restrictedPermissions']
                    .filter((_, i) => i !== index)
        }));
    };    const handleSave = async () => {
        setSaving(true);
        try {
            await setUserDynamicPermissions(user, userId, permissions);
            onClose();
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Error guardando permisos: ' + error.message);
        }
        setSaving(false);
    };const getAvailablePermissions = (excludeList) => {
        // Obtener permisos disponibles para el rol específico del usuario
        const availableForRole = getAvailablePermissionsForRole(userRole);
        
        return availableForRole.filter(permission => 
            !excludeList.some(existing => 
                existing.action === permission.action && existing.subject === permission.subject
            )
        ).map(permission => ({
            id: `${permission.action}-${permission.subject}`,
            label: `${permission.label || `${permission.action} ${permission.subject}`} (${permission.category})`,
            value: permission        }));
    };    if (!canManagePermissions) {
        return null;
    }

    // Obtener información del rol para mostrar en el modal
    const roleInfo = getRolePermissionsInfo(userRole);

    return (
        <Modal
            title={
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Gestionar Permisos Dinámicos
                    </Title>
                    <Text type="secondary">
                        Usuario: <strong>{userName}</strong> | 
                        Rol: <strong>{userRole}</strong> | 
                        {roleInfo.totalAvailable} permisos disponibles
                    </Text>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={800}
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
                </Button>
            ]}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '1rem' }}>Cargando permisos...</div>
                </div>
            ) : (
                <div>
                    {/* Permisos Adicionales */}
                    <div style={{ marginBottom: '2rem' }}>
                        <Title level={5}>Permisos Adicionales</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>
                            Permisos extra que se agregan al rol base del usuario
                        </Text>
                        
                        <Space.Compact style={{ width: '100%', marginBottom: '1rem' }}>
                            <Select
                                placeholder="Seleccionar permiso para agregar"
                                style={{ flex: 1 }}
                                value={selectedAdditional ? `${selectedAdditional.action}-${selectedAdditional.subject}` : undefined}                                onChange={(value) => {
                                    const availableForRole = getAvailablePermissionsForRole(userRole);
                                    const permission = availableForRole.find(p => 
                                        `${p.action}-${p.subject}` === value
                                    );
                                    setSelectedAdditional(permission);
                                }}
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {getAvailablePermissions(permissions.additionalPermissions).map(option => (
                                    <Option key={option.id} value={option.id}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                onClick={() => handleAddPermission('additional')}
                                disabled={!selectedAdditional}
                            >
                                Agregar
                            </Button>
                        </Space.Compact>

                        <List
                            size="small"
                            bordered
                            dataSource={permissions.additionalPermissions}
                            locale={{ emptyText: 'No hay permisos adicionales' }}
                            renderItem={(permission, index) => (
                                <List.Item
                                    actions={[
                                        <Button 
                                            key="delete"
                                            type="text" 
                                            danger 
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemovePermission('additional', index)}
                                        >
                                            Eliminar
                                        </Button>
                                    ]}
                                >                                    <Tag color="green">
                                        {permission.action} - {permission.subject}
                                    </Tag>
                                    <span style={{ marginLeft: '8px' }}>
                                        {getAvailablePermissionsForRole(userRole).find(p => 
                                            p.action === permission.action && p.subject === permission.subject
                                        )?.label || 'Permiso personalizado'}
                                    </span>
                                </List.Item>
                            )}                        />
                    </div>

                    {/* TODO: Quizás más adelante - Permisos Restringidos
                    <div>
                        <Title level={5}>Permisos Restringidos</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '1rem' }}>
                            Permisos que se quitan del rol base del usuario
                        </Text>
                        
                        <Space.Compact style={{ width: '100%', marginBottom: '1rem' }}>
                            <Select
                                placeholder="Seleccionar permiso para restringir"
                                style={{ flex: 1 }}
                                value={selectedRestricted ? `${selectedRestricted.action}-${selectedRestricted.subject}` : undefined}                                onChange={(value) => {
                                    const availableForRole = getAvailablePermissionsForRole(userRole);
                                    const permission = availableForRole.find(p => 
                                        `${p.action}-${p.subject}` === value
                                    );
                                    setSelectedRestricted(permission);
                                }}
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {getAvailablePermissions(permissions.restrictedPermissions).map(option => (
                                    <Option key={option.id} value={option.id}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                            <Button 
                                type="primary" 
                                danger
                                icon={<PlusOutlined />}
                                onClick={() => handleAddPermission('restricted')}
                                disabled={!selectedRestricted}
                            >
                                Restringir
                            </Button>
                        </Space.Compact>

                        <List
                            size="small"
                            bordered
                            dataSource={permissions.restrictedPermissions}
                            locale={{ emptyText: 'No hay permisos restringidos' }}
                            renderItem={(permission, index) => (
                                <List.Item
                                    actions={[
                                        <Button 
                                            key="delete"
                                            type="text" 
                                            danger 
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemovePermission('restricted', index)}
                                        >
                                            Eliminar
                                        </Button>
                                    ]}
                                >
                                    <Tag color="red">
                                        {permission.action} - {permission.subject}
                                    </Tag>                                    <span style={{ marginLeft: '8px' }}>
                                        {getAvailablePermissionsForRole(userRole).find(p => 
                                            p.action === permission.action && p.subject === permission.subject
                                        )?.label || 'Permiso personalizado'}
                                    </span>
                                </List.Item>
                            )}
                        />
                    </div>
                    */}
                </div>
            )}
        </Modal>
    );
};

export default DynamicPermissionsManager;
