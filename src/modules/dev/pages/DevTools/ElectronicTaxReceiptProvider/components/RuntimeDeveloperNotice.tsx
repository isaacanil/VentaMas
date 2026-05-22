import styled from 'styled-components';

import { VmAlert } from '@/components/heroui';
import { InfoCircleOutlined } from '@/constants/icons/antd';

export const RuntimeDeveloperNotice = () => (
  <Notice status="accent">
    <NoticeIndicator>
      <InfoCircleOutlined />
    </NoticeIndicator>
    <VmAlert.Content>
      <NoticeTitle>
        Solo para desarrolladores - parametros globales de VentaMax/Functions
        para GISYS
      </NoticeTitle>
      <NoticeDescription>
        Base URL, secret, instancia GISYS, preparacion e-CF, etapa de envio y
        timeout son compartidos por todos los negocios conectados a este
        runtime.
      </NoticeDescription>
    </VmAlert.Content>
  </Notice>
);

const Notice = styled(VmAlert)`
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-color: var(--ds-color-state-info);
  background: var(--ds-color-state-info-subtle);
`;

const NoticeIndicator = styled(VmAlert.Indicator)`
  margin-top: 2px;
  color: var(--ds-color-state-info-text);
`;

const NoticeTitle = styled(VmAlert.Title)`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-state-info-text);
`;

const NoticeDescription = styled(VmAlert.Description)`
  max-width: 860px;
  margin: var(--ds-space-1) 0 0;
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-relaxed);
  color: var(--ds-color-state-info-text);
`;
