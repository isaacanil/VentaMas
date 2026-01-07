// @ts-nocheck
import {
  InboxOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`;

const DragOverlayContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  visibility: ${(props) => (props.isDragging ? 'visible' : 'hidden')};
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 75%);
  opacity: ${(props) => (props.isDragging ? 1 : 0)};
  backdrop-filter: blur(4px);
  transition: all 0.3s ease-in-out;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const DropMessage = styled.div`
  padding: 48px 64px;
  text-align: center;
  background: rgb(255 255 255 / 95%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 20%);
  transform: scale(${(props) => (props.isDragging ? '1.02' : '1')});
  transition: transform 0.2s ease-in-out;

  .icon-wrapper {
    margin-bottom: 20px;
    animation: ${floatAnimation} 2s infinite ease-in-out;
  }

  h3 {
    margin: 16px 0;
    font-size: 24px;
    font-weight: 600;
    color: #1890ff;
  }

  p {
    margin: 8px 0;
    font-size: 16px;
    color: #666;
  }
`;

const getFileIcon = (fileType) => {
  switch (fileType.toLowerCase()) {
    case 'imagen':
      return <FileImageOutlined style={{ fontSize: '56px', color: '#1890ff' }} />;
    case 'pdf':
      return <FilePdfOutlined style={{ fontSize: '56px', color: '#1890ff' }} />;
    default:
      return <InboxOutlined style={{ fontSize: '56px', color: '#1890ff' }} />;
  }
};

const DragOverlay = ({
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  fileType,
}) => (
  <DragOverlayContainer
    isDragging={isDragging}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
  >
    <DropMessage isDragging={isDragging}>
      <div className="icon-wrapper">{getFileIcon(fileType)}</div>
      <h3>Arrastra y suelta tus archivos aquí</h3>
      <p>Suelta los archivos para agregarlos como {fileType}</p>
    </DropMessage>
  </DragOverlayContainer>
);

export default DragOverlay;
