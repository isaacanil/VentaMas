import { InboxOutlined } from '@/constants/icons/antd';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
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

interface UploadButtonProps {
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
}

const UploadButton = ({ onFileInput }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <Button type="button" onClick={() => inputRef.current?.click()}>
      <InboxOutlined />
      Cargar
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onFileInput}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default UploadButton;
