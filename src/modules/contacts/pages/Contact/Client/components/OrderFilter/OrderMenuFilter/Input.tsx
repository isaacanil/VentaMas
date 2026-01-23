import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, type ChangeEventHandler } from 'react';
import styled from 'styled-components';

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
      <div onClick={handleDeleteText}>
        <FontAwesomeIcon icon={faTimes} />
      </div>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2em;
  padding: 0 1em;
  background-color: white;
  border-radius: 6px;

  input {
    outline: none;
    border: none;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.2em;
    height: 1.2em;
    background-color: var(--white-2);
  }
`;
