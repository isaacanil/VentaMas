import { Form, Input } from 'antd';
import { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { debounce } from '@/utils/lodash-minimal';

const { TextArea } = Input;

type DebouncedFn = ((value: string) => void) & { cancel: () => void };

type TransactionNotesInputProps = {
  initialValue?: string;
  onNoteChange: (value: string) => void;
  label: string;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  maxLength?: number;
  enforceMaxLength?: boolean;
  showCount?: boolean;
};

type NotesTextAreaProps = {
  initialValue: string;
  onNoteChange: (value: string) => void;
  hasError: boolean;
  maxLength?: number;
  enforceMaxLength: boolean;
  placeholder?: string;
  showCount: boolean;
};

const NotesTextArea = ({
  initialValue,
  onNoteChange,
  hasError,
  maxLength,
  enforceMaxLength,
  placeholder,
  showCount,
}: NotesTextAreaProps) => {
  const debouncedDispatch = useMemo(
    () =>
      debounce((value: string) => {
        onNoteChange(value);
      }, 500) as DebouncedFn,
    [onNoteChange],
  );

  useEffect(() => () => debouncedDispatch.cancel(), [debouncedDispatch]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    if (enforceMaxLength && maxLength && value.length > maxLength) return;
    debouncedDispatch(value);
  };

  const count = showCount && maxLength ? { show: true, max: maxLength } : undefined;

  return (
    <TextArea
      defaultValue={initialValue}
      onChange={handleChange}
      placeholder={placeholder}
      status={hasError ? 'error' : ''}
      cols={30}
      rows={4}
      count={count}
      style={{
        maxWidth: '1000px',
        resize: 'none',
      }}
    />
  );
};

export const TransactionNotesInput = ({
  initialValue = '',
  onNoteChange,
  label,
  placeholder,
  hasError = false,
  errorMessage = '',
  maxLength,
  enforceMaxLength = false,
  showCount = false,
}: TransactionNotesInputProps) => {
  return (
    <Form.Item
      label={label}
      validateStatus={hasError ? 'error' : ''}
      help={hasError ? errorMessage : ''}
    >
      <NotesTextArea
        key={initialValue}
        initialValue={initialValue}
        onNoteChange={onNoteChange}
        hasError={hasError}
        maxLength={maxLength}
        enforceMaxLength={enforceMaxLength}
        placeholder={placeholder}
        showCount={showCount}
      />
    </Form.Item>
  );
};
