import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faShop,
  faUser,
  faBolt,
  faCheckCircle,
  faExclamationTriangle,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography, Button, Alert, Divider, Tooltip, Tag } from 'antd';
import React, { useState } from 'react';

import type {
  ActionDefinition,
  ActionPreviewProps,
  ActionResultProps,
} from '../types';

const { Title, Text } = Typography;

type UserRole = 'admin' | 'owner' | 'manager' | 'cashier' | 'buyer';

interface BusinessPayload {
  name?: string;
  rnc?: string;
  address?: string;
  tel?: string;
  email?: string;
  businessType?: string;
}

interface UserPayload {
  realName?: string;
  name?: string;
  role?: UserRole;
  password?: string;
  email?: string;
}

interface CreateBusinessData {
  business?: BusinessPayload;
  users?: UserPayload[];
  createdBusinessId?: string;
}
export const createBusinessAction: ActionDefinition<CreateBusinessData, CreateBusinessData> = {
  id: 'create_business',
  name: 'Registro de Negocio y Usuarios',
  description: 'Genera la estructura para un nuevo negocio y sus usuarios.',

  PreviewComponent: ({
    data,
    onExecute,
    loading,
    isTestMode,
    readonly,
  }: ActionPreviewProps<CreateBusinessData>) => {
    const [showDetails, setShowDetails] = useState(false);

    const businessName = data.business?.name ?? 'Sin nombre';
    const usersCount = data.users?.length ?? 0;
    const ownerCount = data.users?.filter((u) => u.role === 'owner').length ?? 0;
    const hasExactlyOneOwner = ownerCount === 1;

    return (
      <div
        style={{
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: '#e6f7ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesomeIcon icon={faShop} style={{ color: '#1890ff', fontSize: 18 }} />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                NEGOCIO DETECTADO
              </Text>
              <Text strong style={{ fontSize: 16 }}>
                {businessName}
              </Text>
            </div>
          </div>

          <Tooltip title={showDetails ? "Ocultar detalles" : "Ver información detallada"}>
            <Button
              type="text"
              shape="circle"
              icon={<FontAwesomeIcon icon={showDetails ? faChevronUp : faChevronDown} />}
              onClick={() => setShowDetails(!showDetails)}
              style={{ color: '#8c8c8c' }}
            />
          </Tooltip>
        </div>

        <Text style={{ margin: 0, color: '#595959', fontSize: 14 }}>
          Negocio y <strong>{usersCount} {usersCount === 1 ? 'usuario' : 'usuarios'}</strong> listos para crear.
        </Text>

        {!hasExactlyOneOwner && (
          <Alert
            type="error"
            showIcon
            icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
            message={
              ownerCount === 0 ? 'Falta usuario Owner' : 'Hay múltiples Owner'
            }
            description={
              ownerCount === 0
                ? 'Se requiere al menos un usuario con rol "owner".'
                : 'Debe existir exactamente 1 usuario con rol "owner".'
            }
          />
        )}

        {showDetails && (
          <div style={{
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
          }}>
            <div>
              <Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.5px' }}>
                DATOS DEL NEGOCIO
              </Text>
              <div style={{ marginTop: '8px', fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{ color: '#8c8c8c' }}>Tipo:</span> {data.business?.businessType || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>RNC:</span> {data.business?.rnc || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>Teléfono:</span> {data.business?.tel || '-'}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#8c8c8c' }}>Correo:</span> {data.business?.email || '-'}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#8c8c8c' }}>Dirección:</span> {data.business?.address || '-'}</div>
              </div>
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.5px' }}>
                USUARIOS A CREAR
              </Text>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.users?.map((u) => (
                  <div
                    key={u.email || `${u.name || 'user'}-${u.role || 'role'}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'white',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e8e8e8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          background: '#f5f5f5',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FontAwesomeIcon icon={faUser} style={{ color: '#bfbfbf', fontSize: 14 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{u.realName || u.name}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{u.email || u.name}</div>
                      </div>
                    </div>
                    <Tag
                      color={u.role === 'owner' ? 'blue' : 'default'}
                      style={{ margin: 0, border: 'none', background: u.role === 'owner' ? '#e6f7ff' : '#f5f5f5', color: u.role === 'owner' ? '#1890ff' : '#595959', fontWeight: 500 }}
                    >
                      {u.role?.toUpperCase() || 'ADMIN'}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          size="large"
          type="primary"
          icon={<FontAwesomeIcon icon={faBolt} />}
          onClick={onExecute}
          loading={loading}
          disabled={readonly || !hasExactlyOneOwner}
          style={{
            marginTop: '8px',
            height: '48px',
            borderRadius: '24px',
            width: '100%',
            fontSize: '15px',
            fontWeight: 500,
            boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)',
          }}
        >
          {isTestMode ? 'SIMULAR CREACIÓN' : 'CREAR NEGOCIO AHORA'}
        </Button>
      </div>
    );
  },

  // Componente de Resultado (Después de ejecutar)
  ResultComponent: ({
    data,
    onReset,
    readonly,
  }: ActionResultProps<CreateBusinessData>) => {
    const handleShareWhatsApp = () => {
      try {
        const business = data.business ?? {};
        const getRoleLabel = (role?: UserRole | string) =>
          ({
            admin: 'Administrador',
            owner: 'Dueno',
            manager: 'Gerente',
            cashier: 'Caja',
            buyer: 'Compras',
          })[role] ||
          role ||
          'Usuario';

        const formatLine = (label: string, value: unknown) => {
          const normalized = typeof value === 'string' ? value.trim() : value;
          return normalized ? `${label}: ${normalized}` : null;
        };

        const businessLines = [
          formatLine('ID', data.createdBusinessId),
          formatLine('Nombre', business.name),
          formatLine('Tipo', business.businessType),
          formatLine('RNC', business.rnc),
          formatLine('Telefono', business.tel),
          formatLine('Correo', business.email),
          formatLine('Direccion', business.address),
          'URL: https://ventamax.web.app',
        ]
          .filter(Boolean)
          .join('\n');

        const groupedUsers = (data.users || []).reduce(
          (acc: Record<string, UserPayload[]>, user) => {
            const role = user.role || 'admin';
            const section = getRoleLabel(role);
            if (!acc[section]) acc[section] = [];
            acc[section].push({ ...user, role });
            return acc;
          },
          {},
        );

        let msg = 'ALBUSINESS SEEDING - Registro listo\n\n';
        msg += '*Datos del negocio*\n';
        msg += `${businessLines}\n\n`;
        msg += '*Usuarios creados*\n';

        Object.entries(groupedUsers).forEach(([section, users]) => {
          msg += `${section}:\n`;
          users.forEach((u) => {
            msg += `- Nombre completo: ${u.realName || 'Pendiente'}\n`;
            msg += `- Nombre de usuario: ${u.name || 'Pendiente'}\n`;
            msg += `- Contrasena: ${u.password || 'Pendiente'}\n`;
            msg += `- Rol: ${getRoleLabel(u.role)}\n\n`;
          });
        });

        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: '#52c41a',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesomeIcon
            icon={faCheckCircle}
            style={{ fontSize: '40px', color: 'white' }}
          />
        </div>
        <Title level={3} style={{ margin: 0 }}>
          Negocio Creado!
        </Title>
        <Text type="secondary">
          Las credenciales se han generado exitosamente.
        </Text>

        {!readonly && (
          <>
            <Button
              size="large"
              icon={<FontAwesomeIcon icon={faWhatsapp as any} />}
              onClick={handleShareWhatsApp}
              type="primary"
              style={{
                height: '50px',
                borderRadius: '25px',
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                marginTop: '1rem',
                padding: '0 3rem',
                fontSize: '16px',
              }}
            >
              Enviar por WhatsApp
            </Button>
            <Button type="link" onClick={onReset}>
              Crear otro
            </Button>
          </>
        )}
      </div>
    );
  },
};
