import { InboxOutlined, FileImageOutlined, FilePdfOutlined } from '@ant-design/icons';
import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const DragOverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  visibility: ${props => props.isDragging ? 'visible' : 'hidden'};
  opacity: ${props => props.isDragging ? 1 : 0};
  transition: all 0.3s ease-in-out;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const DropMessage = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 48px 64px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transform: scale(${props => props.isDragging ? '1.02' : '1'});
  transition: transform 0.2s ease-in-out;

  .icon-wrapper {
    animation: ${floatAnimation} 2s infinite ease-in-out;
    margin-bottom: 20px;
  }

  h3 {
    margin: 16px 0;
    color: #1890ff;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    color: #666;
    font-size: 16px;
    margin: 8px 0;
  }
`;

const getFileIcon = (fileType) => {
  switch(fileType.toLowerCase()) {
    case 'imagen':
      return <FileImageOutlined style={{ fontSize: 56, color: '#1890ff' }} />;
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: 56, color: '#1890ff' }} />;
    default:
      return <InboxOutlined style={{ fontSize: 56, color: '#1890ff' }} />;
  }
};

const DragOverlay = ({ isDragging, onDrop, onDragOver, onDragLeave, fileType }) => (
  <DragOverlayContainer
    isDragging={isDragging}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
  >
    <DropMessage isDragging={isDragging}>
      <div className="icon-wrapper">
        {getFileIcon(fileType)}
      </div>
      <h3>Arrastra y suelta tus archivos aquí</h3>
      <p>Suelta los archivos para agregarlos como {fileType}</p>
    </DropMessage>
  </DragOverlayContainer>
);

export default DragOverlay;