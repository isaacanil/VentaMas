import { Form, Input } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { debounce } from '@/utils/lodash-minimal';

const { TextArea } = Input;

type DebouncedFn = ((value: string) => void) & { cancel: () => void };

interface NotesInputProps {
  initialValue?: string;
  onNoteChange: (value: string) => void;
  errors?: { note?: boolean };
}

const NotesInput = ({
  initialValue = '',
  onNoteChange,
  errors,
}: NotesInputProps) => {
  const [localNote, setLocalNote] = useState(initialValue);

  useEffect(() => {
    setLocalNote(initialValue);
  }, [initialValue]);

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
    setLocalNote(value);
    debouncedDispatch(value);
  };

  return (
    <Form.Item
      label="Notas (opcional)"
      validateStatus={errors?.note ? 'error' : ''}
      help={errors?.note ? 'La nota no puede exceder los 300 caracteres' : ''}
    >
      <TextArea
        value={localNote}
        onChange={handleChange}
        status={errors?.note ? 'error' : ''}
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
    </Form.Item>
  );
};

export default NotesInput;
