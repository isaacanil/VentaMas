// @ts-nocheck
import { PrinterOutlined } from '@/constants/icons/antd';
import { Button } from 'antd';
import { DateTime } from 'luxon';
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';

export const CreditNoteActions = ({
  onClose,
  effectiveIsView,
  effectiveIsEdit,
  canUseCreditNotes,
  onPrint,
  pdfLoading,
  creditNoteData,
  onSubmit,
  selectedInvoiceId,
  selectedItems,
  loading,
  isTimeAllowed,
  hasApplications,
  createdAtDate,
  allowedEditMs,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // Actualizar cada minuto
    return () => clearInterval(timer);
  }, []);

  const timeRemainingHours = useMemo(() => {
    if (!isTimeAllowed || !createdAtDate) return 0;
    const expirationDate = DateTime.fromJSDate(createdAtDate).plus({
      milliseconds: allowedEditMs,
    });
    const diff = expirationDate.diff(DateTime.fromMillis(now), 'hours');
    return Math.max(0, Math.floor(diff.hours));
  }, [isTimeAllowed, createdAtDate, allowedEditMs, now]);

  return (
    <>
      <ActionButtons>
        <Button onClick={onClose}>Cancelar</Button>
        {(effectiveIsView || effectiveIsEdit) && (
          <Button
            icon={<PrinterOutlined />}
            onClick={() => onPrint(creditNoteData)}
            loading={pdfLoading}
            disabled={!creditNoteData}
          >
            Imprimir
          </Button>
        )}
        {!effectiveIsView && canUseCreditNotes && (
          <Button
            type="primary"
            onClick={onSubmit}
            disabled={!selectedInvoiceId || selectedItems.length === 0}
            loading={loading}
          >
            {effectiveIsEdit ? 'Guardar Cambios' : 'Crear Nota de Crédito'}
          </Button>
        )}
      </ActionButtons>
      {effectiveIsEdit && (
        <CountdownText>
          {isTimeAllowed && !hasApplications
            ? `Tiempo restante para editar: ${timeRemainingHours}h`
            : hasApplications
              ? 'No se puede editar: nota ya aplicada'
              : 'Edición expirada'}
        </CountdownText>
      )}
    </>
  );
};

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#d9d9d9'};

  @media (width <= 768px) {
    position: sticky;
    bottom: 0;
    flex-direction: column-reverse;
    gap: 0.75rem;
    padding: 1rem 16px;
    margin: 1rem -16px -20px;
    background: white;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);

    button {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }
  }
`;

const CountdownText = styled.div`
  margin-top: -0.5rem;
  font-size: 0.75rem;
  color: ${(props) => props.theme?.text?.secondary || '#888'};
  text-align: right;
`;

