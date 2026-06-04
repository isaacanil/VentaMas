import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRef, type ChangeEventHandler } from 'react';

import { Container } from './Input.styles';

type OrderFilterInputProps = {
  data: { name: string };
  onChange?: ChangeEventHandler<HTMLInputElement>;
  fn: () => void;
};

export const Input = ({ data, onChange, fn }: OrderFilterInputProps) => {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleDeleteText = () => {
    fn();
    if (ref.current) {
      ref.current.value = '';
    }
  };

  return (
    <Container>
      <input
        type="text"
        ref={ref}
        onChange={onChange}
        placeholder={`Buscar ${data.name}`}
      />
      <button
        type="button"
        aria-label="Limpiar busqueda"
        onClick={handleDeleteText}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </Container>
  );
};
