import { InboxOutlined } from '@ant-design/icons';
import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
`;

const UploadButton = ({
  onFileInput,
  buttonText = 'Cargar',
  acceptedFileTypes = null,
}) => (
  <>
    <Button onClick={() => document.getElementById('fileInput').click()}>
      <InboxOutlined />
      {buttonText}
    </Button>
    <input
      id="fileInput"
      type="file"
      multiple
      onChange={onFileInput}
      accept={acceptedFileTypes}
      style={{ display: 'none' }}
    />
  </>
);

export default UploadButton;
