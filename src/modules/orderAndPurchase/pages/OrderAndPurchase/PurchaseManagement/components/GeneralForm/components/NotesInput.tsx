import { TransactionNotesInput } from '../../../../shared/components/TransactionNotesInput';

interface NotesInputProps {
  initialValue?: string;
  onNoteChange: (value: string) => void;
}

const NotesInput = ({ initialValue = '', onNoteChange }: NotesInputProps) => {
  return (
    <TransactionNotesInput
      initialValue={initialValue}
      onNoteChange={onNoteChange}
      label="Notas"
      placeholder="Agrega notas adicionales"
      maxLength={300}
      enforceMaxLength
    />
  );
};

export default NotesInput;
