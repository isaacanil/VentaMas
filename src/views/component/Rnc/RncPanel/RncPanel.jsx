import {
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Spin, Button, Modal } from 'antd';
import { DateTime } from 'luxon';
import { createElement, useState } from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  padding: 24px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 10px;
  border: 1px solid #f0f0f0;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1;
  border-radius: 4px;
`;

const Header = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h3`
  color: #262626;
  font-size: 16px;
  margin: 0;
  font-weight: 500;
`;

const Subtitle = styled.p`
  color: #8c8c8c;
  font-size: 13px;
  margin: 4px 0 0 0;
`;

const Info = styled.div`
  display: grid;
  gap: 16px;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: baseline;
  gap: 12px;

  label {
    color: #595959;
    font-size: 13px;
  }

  span {
    color: #262626;
    font-size: 14px;
  }
`;

const StatusBox = styled.div`
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  position: relative;
  border: 1px solid;

  ${({ $status }) => {
    switch ($status) {
      case 'ACTIVO':
        return `
          background: #f6ffed;
          border-color: #b7eb8f;
          .icon { color: #52c41a; }
          .details-section { color: #135200; }
        `;
      case 'SUSPENDIDO':
        return `
          background: #fffbe6;
          border-color: #ffe58f;
          .icon { color: #faad14; }
          .details-section { color: #874d00; }
        `;
      case 'DADO DE BAJA':
        return `
          background: #fff2f0;
          border-color: #ffccc7;
          .icon { color: #ff4d4f; }
          .details-section { color: #a8071a; }
        `;
      default:
        return `
          background: #f5f5f5;
          border-color: #d9d9d9;
          .icon { color: #8c8c8c; }
          .details-section { color: #262626; }
        `;
    }
  }}

  .details-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed currentColor;
    opacity: 0.9;
  }

  .details-list {
    margin: 8px 0 0 0;
    padding-left: 16px;
    list-style-type: none;

    li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 4px;
      font-size: 14px;

      &:before {
        content: '•';
        position: absolute;
        left: 0;
        opacity: 0.7;
      }
    }
  }
`;

const STATUS_INFO = {
  ACTIVO: {
    color: 'success',
    title: 'RNC Activo',
    description: 'Contribuyente habilitado para fines tributarios.',
    details: `• Habilitado para todos los servicios de la DGII
      • Puede emitir y recibir comprobantes fiscales
      • Debe mantener sus obligaciones tributarias al día`,
    icon: CheckCircleOutlined,
  },
  SUSPENDIDO: {
    color: 'warning',
    title: 'Estado Suspendido',
    description: 'Contribuyente en incumplimiento prolongado.',
    details: `• Inhabilitado para solicitar nuevos comprobantes fiscales
      • Inadmisibilidad de deducción por comprobantes fiscales
      • Restricciones en trámites administrativos
      • Mantiene acceso a Oficina Virtual
      • Puede reactivarse presentando declaraciones pendientes
      • No requiere pago de multa para reactivación`,
    icon: WarningOutlined,
  },
  'DADO DE BAJA': {
    color: 'error',
    title: 'Estado Dado de Baja',
    description: 'Cese definitivo de operaciones comerciales.',
    details: `• RNC inhabilitado
      • Comprobantes fiscales inhabilitados
      • Sin obligaciones tributarias activas
      • Debe solicitar reactivación para operar`,
    icon: StopOutlined,
  },
};

export const RncPanel = ({ rncInfo, loading }) => {
  const formatDate = (dateString) => {
    try {
      return DateTime.fromISO(dateString)
        .setLocale('es')
        .toFormat('dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  if (!rncInfo && !loading) return null;

  const [isStatusModalVisible, setStatusModalVisible] = useState(false);

  const status = rncInfo?.status;
  const statusInfo = STATUS_INFO[status] || {
    color: 'default',
    title: 'Estado No Especificado',
    description: 'No hay información disponible',
    details: '',
    icon: QuestionCircleOutlined,
  };

  const formatDetails = (details) => {
    return details
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('•')) {
          return <li key={index}>{trimmedLine.substring(1).trim()}</li>;
        }
        return null;
      })
      .filter(Boolean);
  };

  return (
    <Panel>
      {loading && (
        <LoadingOverlay>
          <Spin tip="Consultando RNC..." />
        </LoadingOverlay>
      )}

      <Header>
        <Title>Datos Registrados DGII</Title>
        <Subtitle>Información oficial del contribuyente</Subtitle>
      </Header>

      <Info style={{ opacity: loading ? 0.6 : 1 }}>
        <Field>
          <label>Número RNC:</label>
          <span>{rncInfo?.rnc_number}</span>
        </Field>
        <Field>
          <label>Razón Social:</label>
          <span>{rncInfo?.full_name}</span>
        </Field>
        <Field>
          <label>Nombre Comercial:</label>
          <span>{rncInfo?.business_name}</span>
        </Field>
        <Field>
          <label>Actividad:</label>
          <span>{rncInfo?.business_activity}</span>
        </Field>
        <Field>
          <label>Fecha de Registro:</label>
          <span>{formatDate(rncInfo?.registration_date)}</span>
        </Field>
        {/* <StatusField>
          <label>Estado:</label>
          <Tag color={statusInfo.color}>{status}</Tag>
        </StatusField> */}
        <Field>
          <label>Condición:</label>
          <span>{rncInfo?.condition}</span>
        </Field>
      </Info>

      <Button
        type="link"
        onClick={() => setStatusModalVisible(true)}
        style={{ marginTop: '12px' }}
      >
        Más información
      </Button>

      <Modal
        open={isStatusModalVisible}
        footer={null}
        onCancel={() => setStatusModalVisible(false)}
        title="Estado del RNC"
        centered
      >
        <StatusBox $status={status}>
          <div
            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
          >
            <span className="icon" style={{ fontSize: '20px' }}>
              {createElement(statusInfo.icon)}
            </span>
            <div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {statusInfo.title}
              </div>
              <div style={{ fontSize: '14px' }}>{statusInfo.description}</div>
              {statusInfo.details && (
                <div className="details-section">
                  <ul className="details-list">
                    {formatDetails(statusInfo.details)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </StatusBox>
      </Modal>
    </Panel>
  );
};
