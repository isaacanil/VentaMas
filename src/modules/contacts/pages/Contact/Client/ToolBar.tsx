import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { OPERATION_MODES } from '@/constants/modes';
import { toggleClientModal } from '@/features/modals/modalSlice';
import { Button } from '@/components/ui/Button/Button';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

type ToolBarProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

export const ToolBar = ({ searchTerm, setSearchTerm }: ToolBarProps) => {
  const createMode = OPERATION_MODES.CREATE.id;
  const dispatch = useDispatch();

  const openModal = () =>
    dispatch(toggleClientModal({ mode: createMode, data: null }));

  return (
    <Container>
      <Wrapper>
        {' '}
        <InputV4
          placeholder={'Buscar Cliente ...'}
          icon={<FontAwesomeIcon icon={faSearch} />}
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
        <Button
          borderRadius="normal"
          bgcolor="primary"
          title="Nuevo Cliente"
          onClick={openModal}
        />
      </Wrapper>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 2.5em;
  margin-bottom: 1em;
  background-color: rgb(255 255 255);
`;
const Wrapper = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1000px;
  padding: 0 1em;
`;
