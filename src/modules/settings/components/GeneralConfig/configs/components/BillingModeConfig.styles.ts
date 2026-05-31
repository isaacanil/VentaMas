import styled from 'styled-components';

export const FULL_WIDTH_SELECT_STYLE = { width: '100%' } as const;

export const ModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ModalSectionTitle = styled.h4`
  margin-bottom: 12px;
  color: #262626;
  font-size: 14px;
  font-weight: 600;
`;

export const ModalDescription = styled.p`
  margin-bottom: 16px;
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.5;
`;

export const FullWidthSelectWrapper = styled.div`
  width: 100%;
`;

export const SelectOptionTitle = styled.div`
  font-weight: 600;
`;

export const SelectOptionDescription = styled.div`
  color: #3d3d3d;
  font-size: 12px;
`;

export const SwitchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const SwitchLabel = styled.span`
  font-weight: 500;
`;
