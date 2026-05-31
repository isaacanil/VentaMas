import { Spin } from 'antd';
import { DateTime } from 'luxon';

import {
  LoadingOverlay,
  LoadingSpacer,
  Panel,
  PanelRoot,
} from './RncPanel.styles';

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

export const RncPanel = ({ rncInfo, loading }: RncPanelProps) => {
  if (!rncInfo && !loading) return null;

  return (
    <PanelRoot>
      {loading && (
        <LoadingOverlay>
          <Spin tip="Consultando RNC...">
            <LoadingSpacer />
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
    </PanelRoot>
  );
};
