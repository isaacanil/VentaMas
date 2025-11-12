import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { toggleAddPurchaseModal } from '@/features/modals/modalSlice';
import { Button } from '@/views/templates/system/Button/Button';
import { Tooltip } from '@/views/templates/system/Button/Tooltip';

export const ToolBar = () => {
  const dispatch = useDispatch();
  const openModal = () => {
    dispatch(toggleAddPurchaseModal());
  };
  return (
    <Container>
      <Wrapper>
        {/* <OrderFilter></OrderFilter> */}
        <Tooltip
          description="Realizar Comprar"
          Children={
            <Button
              borderRadius="normal"
              bgcolor="primary"
              startIcon={<FontAwesomeIcon icon={faPlus} />}
              title={`Comprar`}
              onClick={openModal}
            />
          }
        />
      </Wrapper>
    </Container>
  );
};
const Container = styled.div`
  height: 2.5em;
  width: 100%;
  background-color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Wrapper = styled.div`
  width: 100%;
  padding: 0 1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
`;
