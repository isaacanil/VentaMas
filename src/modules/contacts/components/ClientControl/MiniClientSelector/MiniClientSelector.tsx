import { SearchOutlined, UserOutlined } from '@/constants/icons/antd';
import { useMemo, useState, type ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';

import { VmButton, VmModal, VmSpinner } from '@/components/heroui';
import { addClient } from '@/features/clientCart/clientCartSlice';
import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { filterByDeepSearchText } from '@/utils/searchText';

import {
  ClearSearchButton,
  ClientAvatar,
  ClientDetails,
  ClientList,
  ClientListItem,
  ClientMeta,
  ClientName,
  ClientOption,
  ClientOptionContent,
  SearchIcon,
  SearchInput,
  SearchShell,
  SelectorContent,
  StateBlock,
  StateDescription,
  StateTitle,
} from './MiniClientSelector.styles';

type ClientRecord = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
};

type ClientRow = {
  client: ClientRecord;
};

type MiniClientSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formatClientMeta = (client: ClientRecord): string => {
  const meta = [
    client.phone ? `Tel: ${client.phone}` : null,
    client.email ? `Email: ${client.email}` : null,
  ].filter(Boolean);

  return meta.join(' | ');
};

export const MiniClientSelector = ({
  isOpen,
  onClose,
}: MiniClientSelectorProps) => {
  const dispatch = useDispatch();
  const { clients, loading } = useFbGetClientsOnOpen({ isOpen }) as {
    clients: ClientRow[];
    loading: boolean;
  };

  const [searchTerm, setSearchTerm] = useState('');

  const nonGenericClients = useMemo<ClientRow[]>(
    () =>
      clients.filter(({ client }) => client.name && client.name.trim() !== ''),
    [clients],
  );

  const filteredClients = useMemo<ClientRow[]>(
    () => filterByDeepSearchText(nonGenericClients, searchTerm),
    [nonGenericClients, searchTerm],
  );

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelectClient = (clientData: ClientRow) => {
    dispatch(addClient(clientData.client as any));
    handleClose();
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <VmModal
      isOpen={isOpen}
      title="Seleccionar Cliente"
      size="lg"
      isDismissable={false}
      isKeyboardDismissDisabled
      closeButtonLabel="Cerrar selector de cliente"
      ariaLabel="Seleccionar Cliente"
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      footer={
        <VmButton variant="secondary" onPress={handleClose}>
          Cerrar
        </VmButton>
      }
    >
      <SelectorContent>
        <SearchShell>
          <SearchIcon aria-hidden="true">
            <SearchOutlined />
          </SearchIcon>
          <SearchInput
            fullWidth
            aria-label="Buscar cliente"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm ? (
            <ClearSearchButton
              size="sm"
              variant="secondary"
              onPress={() => setSearchTerm('')}
            >
              Limpiar
            </ClearSearchButton>
          ) : null}
        </SearchShell>

        {loading ? (
          <StateBlock role="status" aria-live="polite">
            <VmSpinner size="sm" />
            <StateTitle>Cargando clientes</StateTitle>
            <StateDescription>
              Estamos preparando la lista de clientes disponibles.
            </StateDescription>
          </StateBlock>
        ) : filteredClients.length === 0 ? (
          <StateBlock role="status" aria-live="polite">
            <StateTitle>No se encontraron clientes</StateTitle>
            <StateDescription>
              Ajusta la búsqueda o crea un cliente específico antes de continuar
              con CxC.
            </StateDescription>
          </StateBlock>
        ) : (
          <ClientList role="list" aria-label="Clientes disponibles">
            {filteredClients.map((clientData) => {
              const { client } = clientData;
              const clientName = client.name?.trim() || 'Cliente sin nombre';
              const clientMeta = formatClientMeta(client);
              const clientKey = client.id || clientName;

              return (
                <ClientListItem key={clientKey}>
                  <ClientOption
                    variant="ghost"
                    aria-label={`Seleccionar ${clientName}`}
                    onPress={() => handleSelectClient(clientData)}
                  >
                    <ClientOptionContent>
                      <ClientAvatar aria-hidden="true">
                        <UserOutlined />
                      </ClientAvatar>
                      <ClientDetails>
                        <ClientName>{clientName}</ClientName>
                        {clientMeta ? (
                          <ClientMeta>{clientMeta}</ClientMeta>
                        ) : null}
                      </ClientDetails>
                    </ClientOptionContent>
                  </ClientOption>
                </ClientListItem>
              );
            })}
          </ClientList>
        )}
      </SelectorContent>
    </VmModal>
  );
};
