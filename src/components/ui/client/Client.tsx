import { ExclamationCircleOutlined } from '@/constants/icons/antd';
import { faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { addClient } from '@/features/clientCart/clientCartSlice';
import { clearAuthData } from '@/features/insurance/insuranceAuthSlice';
import { highlightSearch } from '@/components/ui/highlight/Highlight';

import { clientGridTemplateWithActions } from './Client.styles';

const desktopCardStyles = css`
  display: grid;
  grid-template-columns: ${clientGridTemplateWithActions};
  gap: 0.5em;
  align-items: start;
  padding: 0.9em 1em;
`;

const mobileCardStyles = css`
  grid-template-columns: 1fr auto;
  gap: 0.5em 0.8em;
  align-items: start;
  padding: 1em;
`;

const Container = styled.div`
  position: relative;
  ${desktopCardStyles};
  min-height: 70px;
  font-size: 0.9rem;
  color: #1f2937;
  cursor: pointer;
  background-color: ${(props) =>
    props.hasMissingName
      ? '#fff7f7'
      : props.hasMissingID
        ? '#fffaf0'
        : '#ffffff'};
  border: 1px solid
    ${(props) =>
      props.hasMissingName
        ? '#fecaca'
        : props.hasMissingID
          ? '#fcd34d'
          : props.isSelected
            ? '#4096ff'
            : '#e5e7eb'};
  border-radius: 12px;
  box-shadow: ${(props) =>
    props.isSelected
      ? '0 8px 20px rgba(64, 150, 255, 0.16)'
      : '0 2px 8px rgba(15, 23, 42, 0.05)'};
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: ${(props) =>
      props.hasMissingName
        ? '#f87171'
        : props.hasMissingID
          ? '#fbbf24'
          : '#1677ff'};
    box-shadow: ${(props) =>
      props.isSelected
        ? '0 10px 24px rgba(64, 150, 255, 0.2)'
        : '0 6px 16px rgba(15, 23, 42, 0.08)'};
    background-color: ${(props) =>
      props.hasMissingName
        ? '#fff3f3'
        : props.hasMissingID
          ? '#fff7ea'
          : '#f7fbff'};
  }

  @media (width <= 700px) {
    ${mobileCardStyles};
    min-height: auto;
    border-radius: 14px;
  }

  .highlight {
    container-type: inline-size;
    font-weight: 500;
    color: #1f2937;
  }

  .warning {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .warning-name {
    color: #e74c3c;
  }

  .warning-id {
    color: #f39c12;
  }

  span.search-highlight {
    padding: 0 2px;
    background-color: rgb(0 62 236 / 10%);
    border-radius: 2px;
  }
`;

const MissingValue = styled.span`
  color: #7c8086ff;
  font-weight: 600;
`;

const ClientInfo = styled.div`
  display: contents;
  align-items: start;
  column-gap: 0.8em;

  .client-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    font-size: 0.9em;
    font-weight: 700;
    color: #475569;
    white-space: nowrap;
    border-radius: 999px;
  }

  .client-name {
    display: flex;
    gap: 1em;
    justify-content: flex-start;
    min-height: 45px;
    font-size: 0.95em;
    font-weight: 500;
    line-height: 1.2;
    color: #122042ff;
    
    /* IMPORTANTE: min-width: 0 es necesario en Flexbox para permitir 
       que el contenedor se encoja y active el text-overflow */
    min-width: 0; 
    overflow: hidden; 

    & > div {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
  }

  .client-detail {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 45px;
    overflow: hidden;
    font-size: 0.95em;
    color: #475569;
    overflow-wrap: break-word;

    .detail-label {
      font-size: 0.85em;
      font-weight: 600;
      color: #94a3b8;
      display: none;
    }

    @media (width <= 700px) {
      display: flex;
      flex-direction: column; 
      gap: 2px; 
      min-height: auto;

      .detail-label {
        display: block;
        font-size: 0.75rem;
      }
    }
  }

  @media (width <= 700px) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em 0;
    grid-column: 1 / 2;
    width: 100%;
    /* Aseguramos que el contenedor padre también maneje el ancho correctamente */
    min-width: 0; 

    .client-number {
      flex: 0 0 70px;
      justify-content: flex-start;
    }

    .client-name {
      /* Calcula el espacio restante */
      flex: 1 1 calc(100% - 70px);
      min-height: auto;
      /* Refuerzo para móvil */
      min-width: 0; 
    }

    .client-detail {
      flex: 0 0 50%;
      box-sizing: border-box;
      
      &:nth-of-type(1) { padding-right: 8px; }
      &:nth-of-type(2) { padding-left: 8px; }
    }
  }

  .warning {
    font-size: 1em;
    font-style: italic;

    &.warning-name {
      font-weight: 500;
      color: #e74c3c;
    }

    &.warning-id {
      color: #f39c12;
    }
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 0.4em;
  align-self: start;
  justify-self: end;
  grid-column: 5;
  padding-top: 0.5em;

  button {
    svg {
      font-size: 16px;
    }
  }

  @media (width <= 700px) {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    justify-self: end;
    gap: 0.3em;
    padding-top: 0;
  }
`;

export const Client = ({
  client,
  Close,
  updateClientMode,
  onDelete,
  searchTerm,
  selectedClient,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const hasMissingName = !client.name;
  const hasMissingID = !client.personalID;

  const handleSubmit = (client) => {
    dispatch(addClient(client));

    if (!client.id || !user) {
      dispatch(clearAuthData());
    }

    Close();
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    updateClientMode(client);
    Close();
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();

    Modal.confirm({
      title: '¿Eliminar cliente?',
      icon: <ExclamationCircleOutlined />,
      content:
        '¿Estás seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      cancelText: 'No, cancelar',
      okButtonProps: { danger: true },
      zIndex: 10000000,
      onOk: () => {
        onDelete(client?.id);
      },
    });
  };

  return (
    <Container
      onClick={() => handleSubmit(client)}
      hasMissingName={hasMissingName}
      hasMissingID={hasMissingID}
      isSelected={selectedClient?.id === client.id}
    >
      <ClientInfo>
        <div className="client-number">{client?.numberId ?? '—'}</div>
        <div className="client-name">
          {client.name ? (
            <div>{highlightSearch(client.name, searchTerm)}</div>
          ) : (
            <span className="warning warning-name">Nombre no disponible</span>
          )}
        </div>
        <div className="client-detail">
          {client.personalID ? (
            <>
              <div className="detail-label">RNC/Cédula</div>
              <div>{client.personalID}</div>
            </>
          ) : (
            <MissingValue>—</MissingValue>
          )}
        </div>
        <div className="client-detail">
          {client.tel ? (
            <>
              <div className="detail-label">Tel.</div>
              <div>{client.tel}</div>
            </>
          ) : (
            <MissingValue>—</MissingValue>
          )}
        </div>
      </ClientInfo>
      <ActionButtons>
        <Tooltip title="Editar Cliente">
          <Button
            size="small"
            variant="text"
            color={'gray' as any}
            icon={<FontAwesomeIcon icon={faPencil} />}
            onClick={handleEdit}
          />
        </Tooltip>
        <Tooltip title="Eliminar Cliente">
          <Button
            size="small"
            color="red"
            variant="text"
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={handleDelete}
          />
        </Tooltip>
      </ActionButtons>
    </Container>
  );
};
