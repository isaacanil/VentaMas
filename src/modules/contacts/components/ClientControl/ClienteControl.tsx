import { Button as HeroButton, InputGroup } from '@heroui/react';
import { Button as AntButton, Checkbox, Select, Tooltip } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes.js';
import { selectBusinessData } from '@/features/auth/businessSlice.js';
import {
  setClient as setClientInClientCart,
  toggleCart,
  updateInsuranceStatus,
  setDefaultClient,
} from '@/features/cart/cartSlice';
import {
  deleteClient,
  selectClient,
  selectClientMode,
  selectClientSearchTerm,
  setClient,
  setClientSearchTerm,
  setIsOpen,
} from '@/features/clientCart/clientCartSlice';
import { CLIENT_MODE_BAR } from '@/features/clientCart/clientMode';
import { clearAuthData } from '@/features/insurance/insuranceAuthSlice.js';
import { toggleClientModal } from '@/features/modals/modalSlice.js';
import {
  selectNcfType,
  selectTaxReceipt,
  selectTaxReceiptType,
  selectNcfTypeLocked,
} from '@/features/taxReceipt/taxReceiptSlice.js';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt.js';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { updateObject } from '@/utils/object/updateObject';
import type { TaxReceiptDocument } from '@/types/taxReceipt';

import { ClientDetails } from './ClientDetails/ClientDetails';

type BusinessRootState = Parameters<typeof selectBusinessData>[0];
type ClientRootState = Parameters<typeof selectClient>[0];
type ClientModeRootState = Parameters<typeof selectClientMode>[0];
type ClientSearchRootState = Parameters<typeof selectClientSearchTerm>[0];
type TaxReceiptRootState = Parameters<typeof selectTaxReceipt>[0];
type NcfTypeRootState = Parameters<typeof selectNcfType>[0];
type NcfTypeLockedRootState = Parameters<typeof selectNcfTypeLocked>[0];

export const ClientControl = () => {
  const dispatch = useDispatch();
  const business = useSelector<
    BusinessRootState,
    ReturnType<typeof selectBusinessData>
  >(selectBusinessData);
  const client = useSelector<ClientRootState, ReturnType<typeof selectClient>>(
    selectClient,
  );
  const mode = useSelector<
    ClientModeRootState,
    ReturnType<typeof selectClientMode>
  >(selectClientMode);
  const taxReceipt = useSelector<
    TaxReceiptRootState,
    ReturnType<typeof selectTaxReceipt>
  >(selectTaxReceipt);
  const taxReceiptSettingEnabled = taxReceipt?.settings?.taxReceiptEnabled;
  const searchTerm = useSelector<
    ClientSearchRootState,
    ReturnType<typeof selectClientSearchTerm>
  >(selectClientSearchTerm);
  const taxReceiptData = useFbGetTaxReceipt() as {
    taxReceipt: TaxReceiptDocument[];
    isLoading: boolean;
  };
  const nfcType = useSelector<
    NcfTypeRootState,
    ReturnType<typeof selectNcfType>
  >(selectNcfType);
  const ncfTypeLocked = useSelector<
    NcfTypeLockedRootState,
    ReturnType<typeof selectNcfTypeLocked>
  >(selectNcfTypeLocked);
  const insuranceEnabled = useInsuranceEnabled();

  const inputIcon = useMemo(() => {
    switch (mode) {
      case CLIENT_MODE_BAR.SEARCH.id:
        return CLIENT_MODE_BAR.SEARCH.icon;
      case CLIENT_MODE_BAR.UPDATE.id:
        return CLIENT_MODE_BAR.UPDATE.icon;
      case CLIENT_MODE_BAR.CREATE.id:
        return CLIENT_MODE_BAR.CREATE.icon;
      default:
        return undefined;
    }
  }, [mode]);
  const openAddClientModal = () =>
    dispatch(
      toggleClientModal({
        mode: OPERATION_MODES.CREATE.id,
        data: null,
        addClientToCart: true,
      }),
    );
  const openUpdateClientModal = () =>
    dispatch(
      toggleClientModal({
        mode: OPERATION_MODES.UPDATE.id,
        data: client,
        addClientToCart: true,
      }),
    );

  const handleDeleteData = () => {
    dispatch(deleteClient());
    dispatch(clearAuthData());
    dispatch(setDefaultClient());
    dispatch(updateInsuranceStatus(false));
  };

  const handleChangeClient = (e: ChangeEvent<HTMLInputElement>) => {
    if (mode === CLIENT_MODE_BAR.SEARCH.id) {
      dispatch(setClientSearchTerm(e.target.value));
    }
    if (
      mode === CLIENT_MODE_BAR.UPDATE.id ||
      mode === CLIENT_MODE_BAR.CREATE.id
    ) {
      dispatch(setClient(updateObject(client, e)));
    }
  };

  const handleInsuranceChange = (e: CheckboxChangeEvent) => {
    const isChecked = e.target.checked;
    dispatch(updateInsuranceStatus(isChecked));
  };

  useEffect(() => {
    if (mode === CLIENT_MODE_BAR.SEARCH.id) {
      dispatch(setClientSearchTerm(''));
      return;
    }

    if (
      mode === CLIENT_MODE_BAR.UPDATE.id ||
      mode === CLIENT_MODE_BAR.CREATE.id
    ) {
      dispatch(setIsOpen(false));
    }
  }, [mode, dispatch]);

  useEffect(() => {
    dispatch(setClientInClientCart(client));
  }, [client, dispatch]);

  useEffect(() => {
    if (!client?.id) {
      dispatch(updateInsuranceStatus(false));
    }
  }, [client, dispatch]);

  const searchClientRef = useRef<HTMLDivElement | null>(null);

  const handleOpenClientList = () => {
    switch (mode) {
      case CLIENT_MODE_BAR.CREATE.id:
        dispatch(setIsOpen(false));
        break;
      case CLIENT_MODE_BAR.SEARCH.id:
        dispatch(setIsOpen(true));
        break;
      case CLIENT_MODE_BAR.UPDATE.id:
        dispatch(setIsOpen(true));
        break;

      default:
        break;
    }
  };

  const handleCloseCart = () => dispatch(toggleCart());

  const limitByWindowWidth = useWindowWidth();
  const comprobanteTooltipTitle = nfcType
    ? `Comprobante seleccionado: ${nfcType}`
    : 'Seleccionar el tipo de comprobante fiscal para la factura';
  const clientInputValue =
    mode === CLIENT_MODE_BAR.SEARCH.id ? searchTerm : client.name;
  const clientAction =
    mode === CLIENT_MODE_BAR.SEARCH.id
      ? {
          icon: icons.operationModes.add,
          label: 'Cliente',
          onPress: openAddClientModal,
          title: 'Agregar nuevo cliente',
        }
      : mode === CLIENT_MODE_BAR.UPDATE.id
        ? {
            icon: icons.operationModes.edit,
            label: 'Cliente',
            onPress: openUpdateClientModal,
            title: 'Editar cliente seleccionado',
          }
        : null;

  return (
    <Container ref={searchClientRef}>
      <Header>
        {!limitByWindowWidth && (
          <AntButton
            onClick={handleCloseCart}
            data-client-control-input="true"
            icon={icons.arrows.chevronLeft}
          >
            Atrás
          </AntButton>
        )}
        <InputWrapper data-client-control-input="true">
          <ClientInputGroup fullWidth>
            {inputIcon && (
              <InputGroup.Prefix>{inputIcon}</InputGroup.Prefix>
            )}
            <InputGroup.Input
              placeholder="Buscar cliente..."
              value={clientInputValue}
              onChange={(e) => handleChangeClient(e)}
              onClick={handleOpenClientList}
              data-client-control-input="true"
            />
            {(clientInputValue || clientAction) && (
              <InputGroup.Suffix className="client-input-actions">
                {clientInputValue && (
                  <ClearClientButton
                    aria-label="Limpiar cliente"
                    data-client-control-input="true"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteData();
                    }}
                    type="button"
                  >
                    ×
                  </ClearClientButton>
                )}
                {clientAction && (
                  <Tooltip title={clientAction.title}>
                    <ClientButton
                      size="sm"
                      variant="primary"
                      onPress={clientAction.onPress}
                      data-client-control-input="true"
                    >
                      {clientAction.icon}
                      {clientAction.label}
                    </ClientButton>
                  </Tooltip>
                )}
              </InputGroup.Suffix>
            )}
          </ClientInputGroup>
        </InputWrapper>
      </Header>
      <ClientDetails mode={mode === CLIENT_MODE_BAR.CREATE.id} />

      {(taxReceiptSettingEnabled || business?.businessType === 'pharmacy') && (
        <ControlsContainer>
          {taxReceiptSettingEnabled && (
            <Select
              style={{ width: 200 }}
              value={nfcType}
              onChange={(e) => dispatch(selectTaxReceiptType(e))}
              disabled={ncfTypeLocked}
              placeholder="Selecciona comprobante"
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                typeof option?.label === 'string' &&
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              title={comprobanteTooltipTitle}
              options={[
                {
                  label: 'Comprobantes Fiscal',
                  options: taxReceiptData.taxReceipt
                    .filter((receipt) => !receipt.data?.disabled)
                    .filter((receipt) => {
                      const rawName = receipt?.data?.name || '';
                      // Normalizar acentos
                      const name = rawName
                        .normalize('NFD')
                        .replace(/\p{Diacritic}/gu, '')
                        .toLowerCase();
                      const serie = (receipt?.data?.serie || '')
                        .toString()
                        .padStart(2, '0');
                      // Regla principal: excluir serie 04 (Notas de Crédito en RD) o nombres que contengan ambos tokens
                      const containsNota = name.includes('nota');
                      const containsCredito = name.includes('credito');
                      const isCreditNoteBySerie = serie === '04';
                      const isCreditNoteByName = containsNota && containsCredito;
                      return !(isCreditNoteBySerie || isCreditNoteByName);
                    })
                    .map(({ data }) => ({ value: data.name, label: data.name })),
                },
              ]}
            />
          )}

          {business?.businessType === 'pharmacy' && (
            <Checkbox
              onChange={handleInsuranceChange}
              disabled={!client?.id}
              checked={insuranceEnabled} // Directly use cart's insurance status
            >
              Seguro
            </Checkbox>
          )}
        </ControlsContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: grid;
  gap: 6px;
  width: 100%;
  margin: 0;
  border: 0;
`;
const Header = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.64em;
  padding: 0 0.5em;
  background-color: var(--gray-8);

  .ant-input-affix-wrapper {
    border-right: none;
  }
`;

const InputWrapper = styled.div`
  width: 100%;
  min-width: 0;
`;

const ClientInputGroup = styled(InputGroup)`
  width: 100%;
  min-width: 0;
  height: 32px;
  min-height: 32px;
  overflow: hidden;

  .input-group__input,
  [data-slot='input-group-input'] {
    min-width: 0;
    height: 100%;
    font-size: 14px;
  }

  .client-input-actions,
  .input-group__suffix {
    gap: 4px;
    height: 100%;
    padding-right: 0;
  }
`;

const ClearClientButton = styled.button`
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-size: 16px;
  line-height: 1;
  color: currentColor;
  cursor: pointer;
  border-radius: 999px;
  opacity: 0.62;

  &:hover {
    opacity: 1;
  }
`;

const ClientButton = styled(HeroButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 86px;
  border-radius: 0;
  white-space: nowrap;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 0 6px;

  .ant-select {
    width: 200px;
  }

  .ant-select:hover {
    border-color: var(--primary-color);
  }

  .ant-checkbox-wrapper {
    margin-left: auto;
    white-space: nowrap;
  }
`;
