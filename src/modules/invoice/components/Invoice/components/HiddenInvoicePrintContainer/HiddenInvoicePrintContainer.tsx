import styled from 'styled-components';

export const INVOICE_LETTER_PRINT_PAGE_STYLE =
  '@page { size: A4 portrait; margin: 0; } html, body { margin: 0 !important; }';

export const HiddenInvoicePrintContainer = styled.div`
  position: fixed;
  top: 0;
  left: -10000px;
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  pointer-events: none;
  visibility: visible;
  z-index: -1;

  @media print {
    position: static;
    left: auto;
    width: auto;
    min-height: 0;
  }
`;
