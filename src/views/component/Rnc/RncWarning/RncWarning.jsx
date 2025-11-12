import { WarningOutlined } from '@ant-design/icons';
import { Typography, Space } from 'antd';
import styled from 'styled-components';

const { Text, Paragraph } = Typography;

const WarningBox = styled.div`
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  position: relative;
  overflow: hidden;
  border: 1px solid;

  ${({ $status }) => {
    switch ($status) {
      case 'ACTIVO':
        return `
          background: #f6ffed;
          border-color: #b7eb8f;
          .icon { color: #52c41a; }
        `;
      case 'SUSPENDIDO':
        return `
          background: #fffbe6;
          border-color: #ffe58f;
          .icon { color: #faad14; }
        `;
      case 'DADO DE BAJA':
        return `
          background: #fff2f0;
          border-color: #ffccc7;
          .icon { color: #ff4d4f; }
        `;
      default:
        return `
          background: #f5f5f5;
          border-color: #d9d9d9;
          .icon { color: #8c8c8c; }
        `;
    }
  }}

  .details-section {
    margin-top: 12px;
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.5;
    
    ${({ $status }) => {
      switch ($status) {
        case 'ACTIVO':
          return `
            background: #f6ffed;
            color: #135200;
          `;
        case 'SUSPENDIDO':
          return `
            background: #fff7e6;
            color: #874d00;
          `;
        case 'DADO DE BAJA':
          return `
            background: #fff1f0;
            color: #a8071a;
          `;
        default:
          return `
            background: #fafafa;
            color: #262626;
          `;
      }
    }}
  }

  .details-list {
    margin: 8px 0 0 0;
    padding-left: 0;
    list-style-type: none;

    li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 4px;

      &:before {
        content: "•";
        position: absolute;
        left: 0;
        color: currentColor;
        opacity: 0.7;
      }
    }
  }
`;

const IconWrapper = styled.div`
  font-size: 20px;
  margin-right: 12px;
`;

const Content = styled.div`
  display: flex;
  align-items: flex-start;
`;

const STATUS_MESSAGES = {
  'ACTIVO': {
    title: 'RNC Activo',
    description: 'Contribuyente habilitado para fines tributarios.',
    details: 'El contribuyente se encuentra habilitado para realizar todas sus operaciones tributarias y debe mantenerse al día con sus obligaciones.'
  },
  'SUSPENDIDO': {
    title: 'RNC Suspendido',
    description: 'Contribuyente en incumplimiento prolongado de obligaciones tributarias.',
    details: `Restricciones principales:
      • Inhabilitado para nuevos comprobantes fiscales
      • No puede realizar deducciones fiscales
      • Limitaciones en trámites administrativos
      
      Para reactivar:
      • Presentar declaraciones de los últimos 3 años
      • No requiere pago de multa por reactivación`
  },
  'CESE_TEMPORAL': {
    title: 'RNC en Cese Temporal',
    description: 'Pausa temporal de operaciones comerciales (máximo 3 años).',
    details: `Condiciones actuales:
      • Mantiene acceso a Oficina Virtual
      • No puede emitir comprobantes fiscales
      • Debe presentar declaraciones anuales
      • Puede gestionar deudas anteriores al cese`
  },
  'DADO DE BAJA': {
    title: 'RNC Dado de Baja',
    description: 'Cese definitivo de operaciones comerciales.',
    details: `Estado actual:
      • RNC inhabilitado completamente
      • Sin acceso a comprobantes fiscales
      • Sin obligaciones tributarias activas
      
      Para reactivar (si la baja fue administrativa):
      • Presentar declaraciones juradas pendientes`
  }
};

export const RncWarning = ({ status }) => {
  const statusInfo = STATUS_MESSAGES[status] || {
    title: 'Estado No Especificado',
    description: 'No hay información disponible sobre este estado.',
    details: ''
  };

  const formatDetails = (details) => {
    return details.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('•')) {
        return <li key={index}>{trimmedLine.substring(1).trim()}</li>;
      }
      return <p key={index}>{trimmedLine}</p>;
    });
  };

  return (
    <WarningBox $status={status}>
      <Content>
        <IconWrapper className="icon">
          <WarningOutlined />
        </IconWrapper>
        <Space direction="vertical" style={{ flex: 1 }}>
          <Text strong>{statusInfo.title}</Text>
          <Paragraph style={{ margin: 0, color: '#262626' }}>
            {statusInfo.description}
          </Paragraph>
          <div className="details-section">
            <ul className="details-list">
              {formatDetails(statusInfo.details)}
            </ul>
          </div>
        </Space>
      </Content>
    </WarningBox>
  );
};