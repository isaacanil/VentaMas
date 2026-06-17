import { TransactionNotesInput } from '../../../../shared/components/TransactionNotesInput';

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
  return (
    <TransactionNotesInput
      initialValue={initialValue}
      onNoteChange={onNoteChange}
      label="Notas (opcional)"
      hasError={Boolean(errors?.note)}
      errorMessage="La nota no puede exceder los 300 caracteres"
      maxLength={300}
      showCount
    />
  );
};

export default NotesInput;
