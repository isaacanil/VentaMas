// @ts-nocheck
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  UserOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { OPERATION_MODES } from '@/constants/modes';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { toggleClientModal } from '@/features/modals/modalSlice';

import { MiniClientSelector } from './MiniClientSelector/MiniClientSelector';

const UnifiedARAlert = ({
  isGenericClient,
  isInvoiceLimitExceeded,
  isCreditLimitExceeded,
  creditLimit,
  activeAccountsReceivableCount,
  clientId,
  invoiceId,
  hasAccountReceivablePermission,
  isChangeNegative,
  abilitiesLoading,
  creditLimitValue,
}) => {
  const dispatch = useDispatch();
  const client = useSelector(selectClient);
  const [isMiniClientSelectorOpen, setIsMiniClientSelectorOpen] =
    useState(false);

  const openCreditLimitModal = () =>
    dispatch(
      toggleClientModal({
        mode: OPERATION_MODES.UPDATE.id,
        data: client,
        addClientToCart: true,
      }),
    );

  const openMiniClientSelector = () => {
    setIsMiniClientSelectorOpen(true);
  };

  const closeMiniClientSelector = () => {
    setIsMiniClientSelectorOpen(false);
  };

  // Construir lista de validaciones según las condiciones
  const validations = [];

  // 0. Acceso restringido (prioridad más alta)
  if (
    !hasAccountReceivablePermission &&
    isChangeNegative &&
    !abilitiesLoading
  ) {
    validations.push({
      status: 'error',
      icon: <LockOutlined />,
      title: 'Acceso Restringido',
      message:
        'No se puede facturar ventas con cambio negativo sin permisos de CxC',
      priority: 0,
    });
  }
  // 1. Cliente genérico
  if (isGenericClient && isChangeNegative) {
    validations.push({
      status: 'error',
      icon: <UserOutlined />,
      title: 'No se puede agregar a cuenta por cobrar con cliente genérico',
      message:
        'Selecciona un cliente específico para continuar con la cuenta por cobrar',
      priority: 1,
      action: 'selectClient',
    });
  }

  // 2. Sin cliente o factura
  if (!clientId && !invoiceId) {
    validations.push({
      status: 'error',
      icon: <ExclamationCircleOutlined />,
      title: 'Información incompleta',
      message: 'Se requiere cliente para CxC',
      priority: 2,
    });
  }

  // 3. Sin límites configurados
  if (
    !isGenericClient &&
    !creditLimit?.creditLimit?.status &&
    !creditLimit?.invoice?.status
  ) {
    validations.push({
      status: 'warning',
      icon: <WarningOutlined />,
      title: 'Configuración pendiente',
      message: 'Define límites de crédito y facturas',
      action: true,
      priority: 3,
    });
  } // 4. Límite de crédito superado
  if (isCreditLimitExceeded) {
    const newBalanceDisplay =
      creditLimitValue != null ? creditLimitValue.toFixed(2) : '0.00';
    const limitDisplay = creditLimit?.creditLimit?.value || 0;

    validations.push({
      status: 'warning',
      icon: <CreditCardOutlined />,
      title: 'Límite de crédito excedido',
      message: `Nuevo balance: $${newBalanceDisplay} (límite: $${limitDisplay})`,
      action: true,
      priority: 4,
    });
  }
  // 5. Límite de facturas superado
  if (isInvoiceLimitExceeded) {
    validations.push({
      status: 'warning',
      icon: <FileTextOutlined />,
      title: 'Límite de facturas alcanzado',
      message: `${activeAccountsReceivableCount + 1} / ${creditLimit?.invoice?.value} facturas (incluyendo esta)`,
      action: true,
      priority: 5,
    });
  }

  // Si no hay validaciones (todo está bien), no mostrar nada
  if (validations.length === 0) {
    return null;
  }

  // Ordenar por prioridad
  validations.sort((a, b) => a.priority - b.priority);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'error':
        return {
          color: '#ff4d4f',
          backgroundColor: '#fff2f0',
          borderColor: '#ffccc7',
        };
      case 'warning':
        return {
          color: '#faad14',
          backgroundColor: '#fffbe6',
          borderColor: '#ffe58f',
        };
      case 'success':
        return {
          color: '#52c41a',
          backgroundColor: '#f6ffed',
          borderColor: '#b7eb8f',
        };
      default:
        return {
          color: '#1890ff',
          backgroundColor: '#e6f7ff',
          borderColor: '#91d5ff',
        };
    }
  };

  const primaryStatus = validations[0]?.status || 'info';
  const statusStyle = getStatusStyle(primaryStatus);

  return (
    <div
      style={{
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        padding: '16px',
        width: '100%',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '20px',
            backgroundColor: statusStyle.color,
            borderRadius: '3px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#262626',
          }}
        >
          Validación CxC
        </span>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#8c8c8c',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {validations.length} {validations.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {validations.map((validation, index) => {
          const itemStyle = getStatusStyle(validation.status);
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: itemStyle.backgroundColor,
                border: `1px solid ${itemStyle.borderColor}`,
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Status Icon */}
              <div
                style={{
                  color: itemStyle.color,
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                {validation.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#262626',
                    marginBottom: '2px',
                  }}
                >
                  {validation.title}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#595959',
                    lineHeight: '1.3',
                  }}
                >
                  {validation.message}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: itemStyle.color,
                  backgroundColor: 'rgb(255 255 255 / 80%)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  flexShrink: 0,
                }}
              >
                {validation.status}
              </div>
            </div>
          );
        })}
      </div>{' '}
      {/* Action Button */}
      {validations.some((v) => v.action) && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {validations.some((v) => v.action === 'selectClient') && (
            <Button
              type="primary"
              size="small"
              onClick={openMiniClientSelector}
              icon={<UserOutlined />}
              style={{
                height: '32px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '6px',
              }}
            >
              Seleccionar Cliente
            </Button>
          )}
          {validations.some((v) => v.action === true) && (
            <Button
              type="primary"
              size="small"
              onClick={openCreditLimitModal}
              style={{
                height: '32px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '6px',
              }}
            >
              Configurar límites
            </Button>
          )}
        </div>
      )}
      {/* Mini Client Selector Modal */}
      <MiniClientSelector
        isOpen={isMiniClientSelectorOpen}
        onClose={closeMiniClientSelector}
      />
    </div>
  );
};

export default UnifiedARAlert;
