import { Form, Input } from 'antd';
import { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { debounce } from '@/utils/lodash-minimal';

const { TextArea } = Input;

type DebouncedFn = ((value: string) => void) & { cancel: () => void };

interface NotesInputProps {
  initialValue?: string;
  onNoteChange: (value: string) => void;
  errors?: { note?: boolean };
}

interface NotesTextAreaProps {
  initialValue: string;
  onNoteChange: (value: string) => void;
  hasError: boolean;
}

const NotesTextArea = ({
  initialValue,
  onNoteChange,
  hasError,
}: NotesTextAreaProps) => {
  const debouncedDispatch = useMemo(
    () =>
      debounce((value: string) => {
        onNoteChange(value);
      }, 500) as DebouncedFn,
    [onNoteChange],
  );

  useEffect(() => () => debouncedDispatch.cancel(), [debouncedDispatch]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    debouncedDispatch(value);
  };

  return (
    <TextArea
      defaultValue={initialValue}
      onChange={handleChange}
      status={hasError ? 'error' : ''}
      cols={30}
      rows={4}
      count={{
        show: true,
        max: 300,
      }}
      style={{
        maxWidth: '1000px',
        resize: 'none',
      }}
    />
  );
};

const NotesInput = ({
  initialValue = '',
  onNoteChange,
  errors,
}: NotesInputProps) => {
  return (
    <Form.Item
      label="Notas (opcional)"
      validateStatus={errors?.note ? 'error' : ''}
      help={errors?.note ? 'La nota no puede exceder los 300 caracteres' : ''}
    >
      <NotesTextArea
        key={initialValue}
        initialValue={initialValue}
        onNoteChange={onNoteChange}
        hasError={Boolean(errors?.note)}
      />
    </Form.Item>
  );
};

export default NotesInput;
