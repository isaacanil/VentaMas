// @ts-nocheck
import { Alert } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { CreditNotePanel } from './CreditNotePanel';

export const RelatedNotesTab = ({
  relatedCreditNotes,
  onNavigateNote,
  isMobile,
}) => {
  if (relatedCreditNotes.length === 0) {
    return (
      <Alert
        type="info"
        showIcon
        message="Sin notas de crédito relacionadas"
        description="No existen notas de crédito asociadas a esta factura."
      />
    );
  }

  return (
    <RelatedNCSection>
      {relatedCreditNotes.map((cn) => (
        <CreditNotePanel
          key={cn.id}
          creditNote={cn}
          onNavigateNote={onNavigateNote}
          isExpanded={false}
          isMobile={isMobile}
        />
      ))}
    </RelatedNCSection>
  );
};

const RelatedNCSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;
