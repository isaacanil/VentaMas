// src/components/PreventaList.jsx
import React from 'react';
import styled from 'styled-components';
import PreventaCard from '../PreventaCard/PreventaCard';


const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) { /* sm */
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) { /* lg */
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) { /* xl */
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PreventaList = ({ preventas, onCancel, onComplete }) => {
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
