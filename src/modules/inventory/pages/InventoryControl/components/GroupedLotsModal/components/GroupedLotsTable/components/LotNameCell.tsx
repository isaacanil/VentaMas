import { Tag } from 'antd';
import styled from 'styled-components';

import type { ReactNode } from 'react';

interface LotNameCellProps {
  label: ReactNode;
  showEditedTag: boolean;
}

export function LotNameCell({ label, showEditedTag }: LotNameCellProps) {
  return (
    <LotCellWrap>
      <LotNameBlock>
        <span style={{ display: 'block' }}>{label}</span>
        {showEditedTag && (
          <Tag color="orange" style={{ marginTop: 2 }}>
            Editado
          </Tag>
        )}
      </LotNameBlock>
    </LotCellWrap>
  );
}

const LotCellWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
`;

const LotNameBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 36px;
  line-height: 1.1;
`;
