import { Form, Input } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { debounce } from '@/utils/lodash-minimal';

const { TextArea } = Input;

type DebouncedFn = ((value: string) => void) & { cancel: () => void };

interface NotesInputProps {
  initialValue?: string;
  onNoteChange: (value: string) => void;
}

const NotesInput = ({
  initialValue = '',
  onNoteChange,
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
    if (value.length <= 300) {
      setLocalNote(value);
      debouncedDispatch(value);
    }
  };

  return (
    <Form.Item label="Notas">
      <TextArea
        value={localNote}
        onChange={handleChange}
        placeholder={'Agrega notas adicionales'}
        cols={30}
        rows={4}
        style={{
          maxWidth: '1000px',
          resize: 'none',
        }}
      />
    </Form.Item>
  );
};

export default NotesInput;
