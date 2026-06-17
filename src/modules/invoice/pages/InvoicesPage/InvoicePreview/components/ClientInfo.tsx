import { useState } from 'react';
import type { InvoiceClient } from '@/types/invoice';

import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { InfoCard } from './InfoCard';

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
        {safeClient.address.slice(0, 40)}…
        <button
          type="button"
          style={{
            padding: 0,
            color: '#2563eb',
            cursor: 'pointer',
            background: 'none',
            border: 0,
          }}
          onClick={() => setShowFullAddress(true)}
        >
          {' '}
          ver más
        </button>
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

  return (
    <InfoCard title={safeClient.name ?? 'Sin Cliente'} elements={elements} />
  );
};
