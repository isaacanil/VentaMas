import { InboxOutlined } from '@/constants/icons/antd';
import { useRef } from 'react';
import type { ChangeEvent, ComponentProps } from 'react';
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
  transition:
    color 0.3s,
    border-color 0.3s;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }
`;

type UploadButtonProps = Omit<ComponentProps<'button'>, 'onClick' | 'children'> & {
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  buttonText?: string;
  acceptedFileTypes?: string | null;
};

const UploadButton = ({
  onFileInput,
  buttonText = 'Cargar',
  acceptedFileTypes = null,
  type,
  ...buttonProps
}: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <Button
        type={type ?? 'button'}
        onClick={() => inputRef.current?.click()}
        {...buttonProps}
      >
        <InboxOutlined />
        {buttonText}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onFileInput}
        accept={acceptedFileTypes ?? undefined}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default UploadButton;
