import { InboxOutlined } from '@/constants/icons/antd';
import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }
`;

type UploadButtonProps = {
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  buttonText?: string;
  acceptedFileTypes?: string | null;
};

const UploadButton = ({
  onFileInput,
  buttonText = 'Cargar',
  acceptedFileTypes = null,
}: UploadButtonProps) => (
  <>
    <Button
      onClick={() => {
        const input = document.getElementById(
          'fileInput',
        ) as HTMLInputElement | null;
        input?.click();
      }}
    >
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
