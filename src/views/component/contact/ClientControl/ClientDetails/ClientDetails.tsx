// @ts-nocheck
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  selectClient,
  setClient,
} from '@/features/clientCart/clientCartSlice';
import { useClientPendingBalance } from '@/firebase/accountsReceivable/useClientPendingBalance';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import { formatPrice as formatPrice } from '@/utils/format';
import { updateObject } from '@/utils/object/updateObject';
import { InputV4 } from '@/views/templates/system/Inputs/GeneralInput/InputV4';


export const ClientDetails = ({ mode }) => {
  const dispatch = useDispatch();
  const client = useSelector(selectClient);
  const isMenuVisible =
    (client?.name && client?.name !== 'Generic Client') || mode;
  // const [pendingBalance, setPendingBalance] = useState(0)
  const user = useSelector(selectUser);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandablePanelRef = useRef(null);
  const insuranceEnabled = useInsuranceEnabled();

  useClickOutSide(
    expandablePanelRef,
    isExpanded,
    () => setIsExpanded(false),
    'mousedown',
  );

  const { balance: pendingBalance } = useClientPendingBalance({
    user,
    clientId: client.id,
  });

  const handlePayment = () => {
    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          paymentScope: 'balance',
          paymentOption: 'installment',
          totalAmount: pendingBalance,
          clientId: client.id,
        },
      }),
    );
  };

  const updateClient = (e) => {
    dispatch(setClient(updateObject(client, e)));
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Separamos los campos comunes de teléfono y dirección
  const PhoneAndAddressFields = (
    <>
      <Row>
        <Group>
          <InputV4
            size="small"
            type="text"
            name="tel"
            label="Teléfono"
            labelVariant="primary"
            value={client.tel}
            onChange={updateClient}
            autoComplete="off"
          />
          <InputV4
            type="text"
            name="tel2"
            label="Teléfono 2"
            size="small"
            labelVariant="primary"
            value={client?.tel2}
            onChange={updateClient}
            autoComplete="off"
          />
        </Group>
      </Row>
      <AddressWrapper>
        <InputV4
          type="text"
          name="address"
          label="Dirección"
          labelVariant="primary"
          size="small"
          value={client.address}
          onChange={updateClient}
          autoComplete="off"
        />
      </AddressWrapper>
    </>
  );

  return (
    isMenuVisible && (
      <Container>
        <MainInfoRow>
          <InputsGroup>
            <ClientIdColumn>
              <ClientId>{`#${client?.numberId}`}</ClientId>
              {insuranceEnabled && (
                <ExpandButton onClick={toggleExpand} isExpanded={isExpanded}>
                  <ExpandIcon isExpanded={isExpanded}>▼</ExpandIcon>
                </ExpandButton>
              )}
            </ClientIdColumn>
            <InputV4
              type="text"
              name="personalID"
              label="Cédula/RNC"
              size="small"
              labelVariant="primary"
              value={client.personalID}
              onChange={updateClient}
              autoComplete="off"
            />
            <BalanceGroup>
              <InputV4
                type="text"
                label="Bal general"
                size="small"
                labelVariant="primary"
                value={`${formatPrice(pendingBalance)}`}
                autoComplete="off"
                readOnly
                buttons={[
                  {
                    name: 'Pagar',
                    onClick: handlePayment,
                    disabled: pendingBalance === 0,
                    color: 'primary',
                  },
                ]}
              />
            </BalanceGroup>
          </InputsGroup>
          <>{!insuranceEnabled && PhoneAndAddressFields}</>
        </MainInfoRow>

        {/* Si insuranceEnabled es true, se usan modal/expandible para los campos */}
        {insuranceEnabled ? (
          <AnimatePresence>
            {isExpanded && (
              <ExpandablePanel
                ref={expandablePanelRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PanelHeader>
                  <PanelTitle>Detalles del cliente</PanelTitle>
                  <CloseButton onClick={toggleExpand}>×</CloseButton>
                </PanelHeader>
                {PhoneAndAddressFields}
              </ExpandablePanel>
            )}
          </AnimatePresence>
        ) : null}
      </Container>
    )
  );
};

const Container = styled.div`
  position: relative;
  gap: 0.6em;
  padding: 0 0.4em;
  border-bottom-right-radius: 6px;
  border-bottom-left-radius: 6px;
`;

const MainInfoRow = styled.div`
  display: grid;
  gap: 0.6em;
  width: 100%;
`;

const ClientIdColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ClientId = styled.div`
  font-weight: 500;
  line-height: 18px;
  color: var(--gray-6);
  white-space: nowrap;
`;

const InputsGroup = styled.div`
  display: flex;
  flex: 1;
  gap: 0.4em;
  align-items: center;
`;

const BalanceGroup = styled.div`
  display: flex;
  gap: 0.2em;
  align-items: center;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  cursor: pointer;
  outline: none;
  background: white;
  border: 1px solid #ddd;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
  transition: all 0.2s;

  &:hover {
    background: #f5f5f7;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ExpandIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: ${(props) => (props.isExpanded ? '-1px' : '1px')};
  font-size: 8px;
  color: #666;
  transform: ${(props) => (props.isExpanded ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.3s;
`;

const ExpandablePanel = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 5;
  display: grid;
  gap: 0.6em;
  padding: 0.6em;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5em;
  margin-bottom: 0.3em;
  border-bottom: 1px solid #eee;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-6);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: #666;
    background: #f5f5f7;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const AddressWrapper = styled.div`
  display: grid;
  gap: 0.6em;
`;

const Row = styled.div`
  display: flex;
  gap: 0.6em;
  width: 100%;
`;

const Group = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
  width: 100%;
`;
