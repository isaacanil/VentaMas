import { EditOutlined } from '@ant-design/icons';
import { Checkbox, Input, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import {
  openModal,
  selectInsuranceAuthData,
  setAuthData,
} from '@/features/insurance/insuranceAuthSlice';
import {
  selectInsuranceData,
  updateInsuranceData,
} from '@/features/insurance/insuranceSlice';
import { getClientInsuranceByClientId } from '@/firebase/insurance/clientInsuranceService';

import { InsuranceAuthModal } from './InsuranceAuthModal/InsuranceAuthModal';

export const InsuranceAuthFields = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const client = useSelector(selectClient);
  const authData = useSelector(selectInsuranceAuthData);
  const insuranceData = useSelector(selectInsuranceData);
  const [clientInsurance, setClientInsurance] = useState(null);

  useEffect(() => {
    const fetchClientInsurance = async () => {
      if (client?.id) {
        const insuranceData = await getClientInsuranceByClientId(
          user,
          client.id,
        );
        if (insuranceData) {
          setClientInsurance(insuranceData);
          dispatch(
            setAuthData({
              insuranceId: insuranceData.insuranceId,
              insuranceType: insuranceData.insuranceType,
              birthDate: insuranceData.birthDate,
            }),
          );
        }
      }
    };

    if (client?.id) {
      fetchClientInsurance();
    }
  }, [client, user, dispatch]);

  if (!client) return null;

  const handleOpenModal = () => {
    dispatch(
      openModal({
        initialValues: {
          clientId: client?.id,
          insuranceId: clientInsurance?.insuranceId || authData?.insuranceId,
          insuranceType:
            clientInsurance?.insuranceType || authData?.insuranceType,
          birthDate: clientInsurance?.birthDate || authData?.birthDate,
        },
      }),
    );
  };

  const handleRecurrenceChange = (e) => {
    dispatch(updateInsuranceData({ recurrence: e.target.checked }));
  };

  const handleInputChange = (e) => {
    dispatch(setAuthData({ authNumber: e.target.value.trim() }));
  };

  return (
    <Container>
      <FormRow>
        <StyledCheckbox
          checked={insuranceData?.recurrence}
          onChange={handleRecurrenceChange}
        >
          Guardar recurrencia de seguro
        </StyledCheckbox>
      </FormRow>
      <FormRow>
        <InputContainer>
          <StyledInput
            placeholder="Número de autorización del seguro"
            value={authData?.authNumber}
            onChange={handleInputChange}
          />
          <EditButton
            type="primary"
            icon={<EditOutlined />}
            onClick={handleOpenModal}
          >
            Editar
          </EditButton>
        </InputContainer>
      </FormRow>
      <InsuranceAuthModal />
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4em;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 0.4em;
  box-shadow:
    0 -8px 10px -1px rgb(0 0 0 / 10%),
    0 -2px 4px -1px rgb(0 0 0 / 15.8%);
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const StyledCheckbox = styled(Checkbox)`
    &.ant-checkbox-wrapper {
    color: ${(props) => props.theme.text.color1};
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const StyledInput = styled(Input)`
  width: 100%;

    &:hover {
    border-color: #40a9ff;
  }
`;

const EditButton = styled(Button)`
  flex-shrink: 0;
`;
