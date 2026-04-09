import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.3;
`;

const Label = styled.span<{ $isPreorder: boolean }>`
  font-size: 0.7em;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ $isPreorder }) => ($isPreorder ? '#d97706' : '#6b7280')};
`;

const Number = styled.span`
  font-weight: 500;
  white-space: nowrap;
`;

interface DocumentCellProps {
  documentType?: 'invoice' | 'preorder';
  documentNumber?: string;
}

export const DocumentCell = ({
  documentType,
  documentNumber,
}: DocumentCellProps) => {
  const isPreorder = documentType === 'preorder';
  const label = isPreorder ? 'Preventa' : 'Factura';
  const number = documentNumber || 'N/A';

  return (
    <Wrapper>
      <Label $isPreorder={isPreorder}>{label}</Label>
      <Number>{number}</Number>
    </Wrapper>
  );
};
