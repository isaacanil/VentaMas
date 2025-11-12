
import { Spin } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

export const RncPanel = ({ rncInfo, loading }) => {
  if (!rncInfo && !loading) return null;

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <LoadingOverlay>
          <Spin tip="Consultando RNC..." />
        </LoadingOverlay>
      )}
      {rncInfo && (
        <Panel style={{ opacity: loading ? 0.6 : 1 }}>
          <h3>Información del RNC</h3>
          <p><strong>RNC:</strong> {rncInfo.rnc_number}</p>
          <p><strong>Nombre:</strong> {rncInfo.full_name}</p>
          <p><strong>Estado:</strong> {rncInfo.status}</p>
          <p><strong>Fecha de Registro:</strong> {DateTime.fromISO(rncInfo.registration_date).toLocaleString(DateTime.DATE_MED)}</p>
          <p><strong>Actividad Económica:</strong> {rncInfo.economic_activity}</p>
        </Panel>
      )}
    </div>
  );
};

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
`;

const Panel = styled.div`
  background: #fff;
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;