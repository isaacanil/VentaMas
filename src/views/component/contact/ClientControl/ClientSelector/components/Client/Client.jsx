import { ExclamationCircleOutlined } from '@ant-design/icons';
import { faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Tag, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { addClient } from '@/features/clientCart/clientCartSlice';
import { clearAuthData } from '@/features/insurance/insuranceAuthSlice';
import { highlightSearch } from '@/views/templates/system/highlight/Highlight';


export const clientGridTemplate =
  'minmax(80px, 0.8fr) minmax(170px, 1.8fr) minmax(130px, 1fr) minmax(130px, 1fr)';
export const clientGridTemplateWithActions = `${clientGridTemplate} minmax(110px, min-content)`;

const Container = styled.li`

  /* box-shadow: ${(props) =>
    props.isSelected ? '0 0 0 1px #1677ff' : '0 1px 3px rgba(0,0,0,0.05)'}; */
  position: relative;
  display: grid;
  grid-template-columns: ${clientGridTemplateWithActions};
  gap: 1em;
  align-items: start;
  min-height: 75px;
  padding: 0.8em;
  margin: 0;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  list-style: none;
  background-color: ${(props) =>
    props.hasMissingName
      ? '#fff5f5'
      : props.hasMissingID
        ? '#fffbeb'
        : '#ffffff'};
  border: 2px solid
    ${(props) =>
      props.hasMissingName
        ? '#ffd1d1'
        : props.hasMissingID
          ? '#fff5d6'
          : props.isSelected
          ? '#4096ff'
          : '#eaeaea'};
  border-radius: 6px;
  transition: all 0.2s ease;

  @media (width <= 700px) {
    align-items: center;
    grid-template-columns: 1fr min-content;
    min-height: auto;
  }

  &:hover {
    background-color: ${(props) =>
      props.isSelected
        ? '#e6f4ff'
        : props.hasMissingName
          ? '#fff0f0'
          : props.hasMissingID
            ? '#fff7e0'
            : '#f8f9fa'};
  }

  .highlight {
    container-type: inline-size;
    font-weight: 500;
    color: #2d3436;
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

const ClientInfo = styled.div`
  display: contents;
  align-items: start;
  column-gap: 0.8em;

  .client-number {
    display: flex;
    align-items: center;
    font-size: 0.95em;
    font-weight: 600;
    color: #5a5a5a;
    white-space: nowrap;
  }

  .client-name {
    display: flex;
    gap: 1em;
    justify-content: flex-start;
    min-height: 45px;
    font-size: 1em;
    font-weight: 600;
    line-height: 1.2;
    color: #3078bf;
  }

  .client-details {
    display: contents;
  }

  .client-detail {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 45px;
    overflow: hidden;
    font-size: 1em;
    color: #4e4e4e;
    overflow-wrap: break-word;

    .detail-label {
      font-size: 0.9em;
      font-weight: 600;
      color: #727272;
      display: none;
    }

    @media (width <= 700px) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35em;
      min-height: auto;

      .detail-label {
        display: block;
        font-size: 0.85em;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
    }
  }

  @media (width <= 700px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4em 1em;
    min-height: auto;
    grid-column: 1 / 2;

    .client-number {
      grid-column: 1;
      grid-row: 1;
      justify-content: flex-start;
    }

    .client-name {
      grid-column: 2;
      grid-row: 1;
      min-height: auto;
    }

    .client-details {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6em 1em;
      width: 100%;
    }

    .client-detail {
      grid-column: auto;
      min-height: auto;
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
    align-self: center;
    justify-self: end;
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

    if (client.id && user) {
      // dispatch(fetchInsuranceAuthByClientId({
      //     user,
      //     clientId: client.id
      // }));
    } else {
      dispatch(clearAuthData());
    }

    Close();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    updateClientMode(client);
    Close();
  };

  const handleDelete = (e) => {
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
        <div className="client-number">#{client?.numberId ?? '—'}</div>
        <div className="client-name">
          {client.name ? (
            <div>{highlightSearch(client.name, searchTerm)}</div>
          ) : (
            <span className="warning warning-name">Nombre no disponible</span>
          )}
        </div>
        <div className="client-details">
          <div className="client-detail">
            {client.personalID ? (
              <>
                <div className="detail-label">RNC/Cédula</div>
                <div>{client.personalID}</div>
              </>
            ) : (
              <Tag color="red">Sin identificación</Tag>
            )}
          </div>
          <div className="client-detail">
            {client.tel ? (
              <>
                <div className="detail-label">Tel.</div>
                <div>{client.tel}</div>
              </>
            ) : (
              <Tag color="red">Sin teléfono</Tag>
            )}
          </div>
        </div>
      </ClientInfo>
      <ActionButtons>
        <Tooltip title="Editar Cliente">
          <Button
            size="small"
            variant="text"
            color="gray"
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
