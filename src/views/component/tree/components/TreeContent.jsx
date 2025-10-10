import { Empty } from 'antd';
import React from 'react';
import styled from 'styled-components';


const Items = styled.div`
  display: grid;
  overflow-x: hidden;
  overflow-y: auto;
  align-content: start;
  width: 100%;
`;

const TreeContent = ({ 
    children,
  filteredData, 
  selectedId, 
  renderTree 
}) => {
  if (filteredData.length > 0) {
    return <Items>
        {/* {renderTree(filteredData)} */}
        {children}
        </Items>;
  }
  
  return selectedId ? (
    <Empty description="Sin selección" />
  ) : (
    <Empty description="No se encontraron elementos" />
  );
};

export default TreeContent;