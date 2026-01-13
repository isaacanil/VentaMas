// @ts-nocheck
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import styled from 'styled-components';

export const Input = ({ data, onChange, fn }) => {
  const ref = useRef();
  const handleDeleteText = () => {
    fn();
    ref.current.value = '';
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
