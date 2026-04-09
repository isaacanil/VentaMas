// src/components/PreventaList.tsx
import React from 'react';
import styled from 'styled-components';

import PreventaCard from '@/modules/sales/pages/PreorderSale/components/PreventaCard/PreventaCard';

type PreventaCardData = {
  id: string | number;
  estado: string;
  cliente: string;
  fecha: string;
  articulos: string[];
  total: number;
};

type PreventaListProps = {
  preventas: PreventaCardData[];
  onCancel: (id: PreventaCardData['id']) => void;
  onComplete: (id: PreventaCardData['id']) => void;
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (width >= 640px) {
    /* sm */
    grid-template-columns: repeat(2, 1fr);
  }

  @media (width >= 1024px) {
    /* lg */
    grid-template-columns: repeat(3, 1fr);
  }

  @media (width >= 1280px) {
    /* xl */
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PreventaList = ({
  preventas,
  onCancel,
  onComplete,
}: PreventaListProps) => {
  return (
    <Grid>
      {preventas.map((preventa) => (
        <PreventaCard
          key={preventa.id}
          preventa={preventa}
          onCancel={onCancel}
          onComplete={onComplete}
        />
      ))}
    </Grid>
  );
};

export default PreventaList;
