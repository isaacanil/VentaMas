import type { ReactNode } from 'react';
import styled from 'styled-components';

const Label = styled.label`
  display: inline-flex;
  gap: 0.35em;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 500;
`;

const ModifiedMarker = styled.div`
  width: 0.7rem;
  height: 0.7rem;
  font-size: 0.7rem;
  background-color: #ffaa0bff;
  border: 1px solid #ffff;
  border-radius: 50%;
  box-shadow: 0 0 4px rgb(0 0 0 / 20%);
`;

type LabelWithStatusProps = {
  children: ReactNode;
  modified?: boolean;
};

export const LabelWithStatus = ({
  children,
  modified,
}: LabelWithStatusProps) => (
  <Label>
    <span>{children}</span>
    {modified ? <ModifiedMarker aria-hidden="true" /> : null}
  </Label>
);
