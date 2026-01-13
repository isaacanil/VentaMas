import { useState } from 'react';
import type { InvoiceClient } from '@/types/invoice';

import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { InfoCard } from '@/components/ui/InfoCard/InfoCard';

type ClientInfoCardProps = {
  client?: InvoiceClient | null;
};

export const ClientInfoCard = ({ client }: ClientInfoCardProps) => {
  const safeClient = client ?? {};
  const formattedPhoneNumber = safeClient.tel
    ? formatPhoneNumber(client.tel)
    : null;
  const [showFullAddress, setShowFullAddress] = useState(false);

  const addressElement = safeClient.address ? (
    safeClient.address.length > 40 && !showFullAddress ? (
      <>
        {safeClient.address.slice(0, 40)}...
        <span
          style={{ color: '#2563eb', cursor: 'pointer' }}
          onClick={() => setShowFullAddress(true)}
        >
          {' '}
          ver más
        </span>
      </>
    ) : (
      safeClient.address
    )
  ) : null;

  const elements = [];
  if (formattedPhoneNumber) {
    elements.push({ label: 'Teléfono', value: formattedPhoneNumber });
  }
  if (addressElement) {
    elements.push({ label: 'Dirección', value: addressElement });
  }

  return <InfoCard title={safeClient.name ?? 'Sin Cliente'} elements={elements} />;
};
