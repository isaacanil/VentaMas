// @ts-nocheck
import { useState } from 'react';

import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { InfoCard } from '@/views/templates/system/InfoCard/InfoCard';

export const ClientInfoCard = ({ client }) => {
  const formattedPhoneNumber = client.tel
    ? formatPhoneNumber(client.tel)
    : null;
  const [showFullAddress, setShowFullAddress] = useState(false);

  const addressElement = client.address ? (
    client.address.length > 40 && !showFullAddress ? (
      <>
        {client.address.slice(0, 40)}...
        <span
          style={{ color: '#2563eb', cursor: 'pointer' }}
          onClick={() => setShowFullAddress(true)}
        >
          {' '}
          ver más
        </span>
      </>
    ) : (
      client.address
    )
  ) : null;

  const elements = [];
  if (formattedPhoneNumber) {
    elements.push({ label: 'Teléfono', value: formattedPhoneNumber });
  }
  if (addressElement) {
    elements.push({ label: 'Dirección', value: addressElement });
  }

  return <InfoCard title={client.name ?? 'Sin Cliente'} elements={elements} />;
};
