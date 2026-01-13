import { Tag, Tooltip } from 'antd';
import styled from 'styled-components';

interface ProductNameCellProps {
  productName: string;
  isModified: boolean;
}

export function ProductNameCell({
  productName,
  isModified,
}: ProductNameCellProps) {
  return (
    <Tooltip title={productName} placement="topLeft">
      <ProductNameWrapper>
        <ProductNameText>{productName}</ProductNameText>
        {isModified && (
          <Tag color="orange" style={{ marginTop: 4, fontSize: 12 }}>
            Editado
          </Tag>
        )}
      </ProductNameWrapper>
    </Tooltip>
  );
}

const ProductNameText = styled.span`
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
`;
