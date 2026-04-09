import {
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  QuestionCircleOutlined,
} from '@/constants/icons/antd';
import { Spin, Button, Modal } from 'antd';
import { DateTime } from 'luxon';
import { createElement, useState, type ComponentType } from 'react';
import styled from 'styled-components';

type RncStatus = 'ACTIVO' | 'SUSPENDIDO' | 'DADO DE BAJA';

interface StatusBoxProps {
  $status?: RncStatus | (string & {});
}

interface RncInfo {
  status?: RncStatus | (string & {});
  rnc_number?: string;
  full_name?: string;
  business_name?: string;
  business_activity?: string;
  registration_date?: string;
  condition?: string;
  [key: string]: unknown;
}

interface StatusInfo {
  color: 'success' | 'warning' | 'error' | 'default';
  title: string;
  description: string;
  details: string;
  icon: ComponentType;
}

const Panel = styled.div`
  position: sticky;
  position: relative;
  top: 10px;
  height: fit-content;
  padding: 24px;
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 80%);
  border-radius: 4px;
`;

const Header = styled.div`
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: #8c8c8c;
`;

const Info = styled.div`
  display: grid;
  gap: 16px;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: baseline;

  label {
    font-size: 13px;
    color: #595959;
  }

  span {
    font-size: 14px;
    color: #262626;
  }
`;

const DatePill = styled.div`
  display: inline-block;
  margin-top: 16px;
  padding: 3px 10px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 12px;
  color: #8c8c8c;
`;

const StatusBox = styled.div<StatusBoxProps>`
  border: 1px solid;
  border-radius: 8px;
  margin-top: 16px;
  padding: 16px;
  position: relative;

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
    padding-top: 12px;
    margin-top: 12px;
    border-top: 1px dashed currentcolor;
    opacity: 0.9;
  }

  .details-list {
    padding-left: 16px;
    margin: 8px 0 0;
    list-style-type: none;

    li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 4px;
      font-size: 14px;

      &::before {
        position: absolute;
        left: 0;
        content: '•';
        opacity: 0.7;
      }
    }
  }
`;

const STATUS_INFO: Record<RncStatus, StatusInfo> = {
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

interface RncPanelProps {
  rncInfo?: RncInfo | null;
  loading?: boolean;
}

export const RncPanel = ({ rncInfo, loading }: RncPanelProps) => {
  const formatDate = (dateString?: string) => {
    try {
      if (!dateString) return '';
      return DateTime.fromISO(dateString)
        .setLocale('es')
        .toFormat('dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const [isStatusModalVisible, setStatusModalVisible] = useState(false);

  const status = rncInfo?.status;
  const statusInfo =
    status && status in STATUS_INFO
      ? STATUS_INFO[status as RncStatus]
      : {
          color: 'default',
          title: 'Estado No Especificado',
          description: 'No hay información disponible',
          details: '',
          icon: QuestionCircleOutlined,
        };

  if (!rncInfo && !loading) return null;

  const formatDetails = (details: string) => {
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
          <Spin tip="Consultando RNC...">
            <div style={{ width: 140, height: 96 }} />
          </Spin>
        </LoadingOverlay>
      )}

      <Header>
        <Title>Datos Registrados DGII</Title>
        <Subtitle>Información oficial del contribuyente</Subtitle>
      </Header>

      <Info style={{ opacity: loading ? 0.6 : 1 }}>
        <Field>
          <label>Razón Social:</label>
          <span>{rncInfo?.full_name}</span>
        </Field>
        <Field>
          <label>Nombre Comercial:</label>
          <span>{rncInfo?.business_name}</span>
        </Field>
        <Field>
          <label>Condición:</label>
          <span>{rncInfo?.condition}</span>
        </Field>
      </Info>

      {rncInfo?.registration_date && (
        <DatePill style={{ opacity: loading ? 0.6 : 1 }}>
          Reg. DGII: {formatDate(rncInfo.registration_date)}
        </DatePill>
      )}

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
