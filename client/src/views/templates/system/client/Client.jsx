import styled from "styled-components";
import { useDispatch, useSelector } from 'react-redux';
import { SelectFacturaData } from "../../../../features/cart/cartSlice";
import { highlightSearch } from "../highlight/Highlight";
import { addClient } from "../../../../features/clientCart/clientCartSlice";
import { MdDelete, MdEdit } from 'react-icons/md';
import { Button, Modal, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const Container = styled.li`
    list-style: none;
    border: 2px solid ${props => props.hasMissingName ? '#ffd1d1' : props.hasMissingID ? '#fff2cc' : props.isSelected ? '#4096ff' : '#eaeaea'};
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: 1em;
    padding: 0.2em 0.8em;
    align-items: center;
    margin: 0;
    font-size: 0.9rem;
    border-radius: 6px;
    background-color: ${props =>
        props.hasMissingName ? '#fff5f5' :
            props.hasMissingID ? '#fffbeb' : '#ffffff'
    };
  
    color: #2c3e50;
    cursor: pointer;
    transition: all 0.2s ease;
    /* box-shadow: ${props => props.isSelected ? '0 0 0 1px #1677ff' : '0 1px 3px rgba(0,0,0,0.05)'}; */
    position: relative;
    
    &:hover {
        
        background-color: ${props =>
        props.isSelected ? '#e6f4ff' :
            props.hasMissingName ? '#fff0f0' :
                props.hasMissingID ? '#fff7e0' :
                    '#f8f9fa'
    };
    }

    .highlight {
        container-type: inline-size;
        font-weight: 500;
        color: #2d3436;
    }

    .warning {
        font-weight: 500;
        font-size: 0.85rem;
    }

    .warning-name {
        color: #e74c3c;
    }

    .warning-id {
        color: #f39c12;
    }

    span.search-highlight {
        background-color: rgba(0, 62, 236, 0.1);
        border-radius: 2px;
        padding: 0 2px;
    }
`

const ClientInfo = styled.div`
    display: grid;
    align-items: center;
  
    grid-template-columns: minmax(150px, 1fr) minmax(150px, 1fr) minmax(150px, 1fr);
    gap: 1em;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
        gap: 0.3em;
    }

    .client-name {
        font-size: 1em;
        font-weight: 600;
        color: #3078bf;
    }
  

    .client-detail {
        font-size: 1em;
        color: #4e4e4e;
       
        @media (max-width: 700px) {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 1em;
        }
    }

    .warning {
        font-size: 1em;
        font-style: italic;
        &.warning-name {
            color: #e74c3c;
            font-weight: 500;
        }
        &.warning-id {
            color: #f39c12;
        }
    }
`

const ActionButtons = styled.div`
    display: flex;
    gap: 0.4em;
    align-self: center;

    button {
        svg {
            font-size: 16px;
        }
    }
`

export const Client = ({ client, Close, updateClientMode, onDelete, searchTerm, selectedClient }) => {
    const dispatch = useDispatch()
    const hasMissingName = !client.name;
    const hasMissingID = !client.personalID;

    const handleSubmit = (client) => {
        dispatch(addClient(client))
        Close()
    }

    const handleEdit = (e) => {
        e.stopPropagation();
        updateClientMode(client)
        Close()
    }

    const handleDelete = (e) => {
        e.stopPropagation();

        Modal.confirm({
            title: '¿Eliminar cliente?',
            icon: <ExclamationCircleOutlined />,
            content: '¿Estás seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.',
            okText: 'Sí, eliminar',
            cancelText: 'No, cancelar',
            okButtonProps: { danger: true },
            zIndex: 10000000,
            onOk: () => {
                onDelete(client?.id)
            },
        });
    }

    return (
        <Container
            onClick={() => handleSubmit(client)}
            hasMissingName={hasMissingName}
            hasMissingID={hasMissingID}
            isSelected={selectedClient?.id === client.id}
        >
            <ClientInfo>
                
                <div className="client-name">
                    {client.name ? (
                        highlightSearch(client.name, searchTerm)
                    ) : (
                        <span className="warning warning-name">Nombre no disponible</span>
                    )}
                    <div>
                        <div style={{color: '#5a5a5a', fontWeight: '400'}}> # {client.numberId}</div>
                  
                </div>
                </div>
                <div className="client-detail">
                    {client.personalID ? (
                        <>
                            <div style={{ fontSize: '0.9em', fontWeight: 600 }}>
                                RNC/Cédula :
                            </div>
                            <div>
                                {client.personalID}
                            </div>
                        </>
                    ) : (
                        <span className="warning warning-id">Sin identificación</span>
                    )}
                </div>
                <div className="client-detail">
                    {client.tel ? (
                        <>
                            <div style={{ fontSize: '0.9em', fontWeight: 600 }}>
                                Tel:
                            </div>
                            <div>
                                {client.tel}
                            </div>
                        </>

                    ) : (
                        <span className="warning">Sin teléfono</span>
                    )}
                </div>
            </ClientInfo>
            <ActionButtons>
                <Tooltip title="Editar Cliente">
                    <Button size="small" icon={<MdEdit />} onClick={handleEdit}  />
                </Tooltip>
                <Tooltip title="Eliminar Cliente">
                    <Button size="small" danger icon={<MdDelete />} onClick={handleDelete} />
                </Tooltip>
            </ActionButtons>
        </Container>
    )
}