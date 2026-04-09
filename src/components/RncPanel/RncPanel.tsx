import { Spin } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

type RncInfo = {
  rnc_number?: string;
  full_name?: string;
  status?: string;
  registration_date?: string;
  economic_activity?: string;
};

type RncPanelProps = {
  rncInfo?: RncInfo | null;
  loading: boolean;
};

type PanelStyleProps = {
  $dimmed?: boolean;
};

export const RncPanel = ({ rncInfo, loading }: RncPanelProps) => {
  if (!rncInfo && !loading) return null;

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <LoadingOverlay>
          <Spin tip="Consultando RNC...">
            <div style={{ width: 140, height: 96 }} />
          </Spin>
        </LoadingOverlay>
      )}
      {rncInfo && (
        <Panel $dimmed={loading}>
          <h3>Información del RNC</h3>
          <p>
            <strong>RNC:</strong> {rncInfo.rnc_number}
          </p>
          <p>
            <strong>Nombre:</strong> {rncInfo.full_name}
          </p>
          <p>
            <strong>Estado:</strong> {rncInfo.status}
          </p>
          <p>
            <strong>Fecha de Registro:</strong>{' '}
            {DateTime.fromISO(rncInfo.registration_date).toLocaleString(
              DateTime.DATE_MED,
            )}
          </p>
          <p>
            <strong>Actividad Económica:</strong> {rncInfo.economic_activity}
          </p>
        </Panel>
      )}
    </div>
  );
};

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 80%);
`;

const Panel = styled.div<PanelStyleProps>`
  padding: 1em;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  opacity: ${(props) => (props.$dimmed ? 0.6 : 1)};
`;
