import { Typography } from 'antd';

import type { BusinessInfo } from '../../BusinessEditModal.types';

import {
  BusinessDetailsBox,
  BusinessInfoSection,
} from './BusinessInfoSummary.styles';

const { Title, Text, Paragraph } = Typography;

interface BusinessInfoSummaryProps {
  business?: BusinessInfo | null;
}

export const BusinessInfoSummary = ({ business }: BusinessInfoSummaryProps) => (
  <BusinessInfoSection>
    <Title level={4}>Información del Negocio</Title>
    <Paragraph>
      Aquí podrás gestionar la información y configuraciones de este negocio.
    </Paragraph>

    <BusinessDetailsBox>
      <Text strong>ID:</Text> <Text>{business?.id}</Text>
      <br />
      <Text strong>Dirección:</Text>{' '}
      <Text>{business?.address || 'No especificada'}</Text>
      <br />
      <Text strong>Teléfono:</Text>{' '}
      <Text>{business?.tel || 'No especificado'}</Text>
    </BusinessDetailsBox>
  </BusinessInfoSection>
);
