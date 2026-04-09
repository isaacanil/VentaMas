import { Form, Input } from 'antd';
import { useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';

import { debounce } from '@/utils/lodash-minimal';

const { TextArea } = Input;

type DebouncedFn = ((value: string) => void) & { cancel: () => void };

interface NotesInputProps {
  initialValue?: string;
  onNoteChange: (value: string) => void;
}

interface NotesTextAreaProps {
  initialValue: string;
  onNoteChange: (value: string) => void;
}

const NotesTextArea = ({
  initialValue,
  onNoteChange,
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
    if (value.length <= 300) {
      debouncedDispatch(value);
    }
  };

  return (
    <TextArea
      defaultValue={initialValue}
      onChange={handleChange}
      placeholder={'Agrega notas adicionales'}
      cols={30}
      rows={4}
      style={{
        maxWidth: '1000px',
        resize: 'none',
      }}
    />
  );
};

const NotesInput = ({ initialValue = '', onNoteChange }: NotesInputProps) => {
  return (
    <Form.Item label="Notas">
      <NotesTextArea
        key={initialValue}
        initialValue={initialValue}
        onNoteChange={onNoteChange}
      />
    </Form.Item>
  );
};

export default NotesInput;
