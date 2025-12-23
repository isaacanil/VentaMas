import React, { useCallback, useEffect, useState } from 'react';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';
import { Button } from '@/views/templates/system/Button/Button';

const EXPORT_EVENT = 'utility-export-request';
const AVAILABILITY_EVENT = 'utility-export-availability';

export const UtilityToolbar = ({ side = 'left' }) => {
  const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;
  const matchUtilityReport = useMatch(UTILITY_REPORT);
  const [canExport, setCanExport] = useState(false);

  useEffect(() => {
    const handleAvailability = (event) => {
      if (typeof event?.detail?.canExport === 'boolean') {
        setCanExport(event.detail.canExport);
      }
    };

    window.addEventListener(AVAILABILITY_EVENT, handleAvailability);
    return () => {
      window.removeEventListener(AVAILABILITY_EVENT, handleAvailability);
    };
  }, []);

  const handleExport = useCallback(() => {
    const event = new CustomEvent(EXPORT_EVENT);
    window.dispatchEvent(event);
  }, []);

  if (!matchUtilityReport || side !== 'right') {
    return null;
  }

  return (
    <Container>
      <Button
        title="Exportar Excel"
        startIcon={icons.finances.fileInvoiceDollar}
        onClick={handleExport}
        disabled={!canExport}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;
