import { ExclamationCircleOutlined } from '@ant-design/icons';
import { faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal, Tag, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from "styled-components";

import { selectUser } from "../../../../features/auth/userSlice";
import { addClient } from "../../../../features/clientCart/clientCartSlice";
import { clearAuthData } from "../../../../features/insurance/insuranceAuthSlice";
import { highlightSearch } from "../highlight/Highlight";



const Container = styled.li`
    list-style: none;
    border: 2px solid ${props => props.hasMissingName ? '#ffd1d1' : props.hasMissingID ? '#fff5d6' : props.isSelected ? '#4096ff' : '#eaeaea'};
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: 1em;
    min-height: 75px;
    padding: 0.8em;
    align-items: start;
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
    
    @media (max-width: 700px) {
        min-height: auto;
        align-items: center;
    }
    
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
    align-items: start;
  
    grid-template-columns: minmax(150px, 2fr) minmax(110px, 1fr) minmax(130px, 1fr);
    gap: 0.8em;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
        gap: 0.3em;
        min-height: auto;
    }
    .client-name {
        font-size: 1em;
        line-height: 1.2;
        font-weight: 600;
        color: #3078bf;
        display: flex;
        gap: 1em;
        display: flex;
        justify-content: flex-start;
        min-height: 45px;
        
        @media (max-width: 700px) {
            min-height: auto;
        }
    }
    .client-detail {
        font-size: 1em;
        color: #4e4e4e;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        min-height: 45px;
        overflow: hidden;
        word-wrap: break-word;
       
        @media (max-width: 700px) {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 1em;
            min-height: auto;
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
    align-self: start;
    padding-top: 0.5em;

    button {
        svg {
            font-size: 16px;
        }
    }
    
    @media (max-width: 700px) {
        align-self: center;
        padding-top: 0;
    }
`

export const Client = ({ client, Close, updateClientMode, onDelete, searchTerm, selectedClient }) => {
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
    }

    const handleEdit = (e) => {
        e.stopPropagation();
        updateClientMode(client);
        Close();
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
                    <div style={{ color: '#5a5a5a', fontWeight: '400', whiteSpace: 'nowrap' }}> # {client.numberId}</div>
                    {client.name ? (
                        <div>
                            {highlightSearch(client.name, searchTerm)}
                        </div>
                    ) : (
                        <span className="warning warning-name">Nombre no disponible</span>
                    )}

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
                        <Tag color="red">Sin identificación</Tag>
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
                        <Tag color="red">Sin teléfono</Tag>
                    )}
                </div>
            </ClientInfo>
            <ActionButtons>
                <Tooltip title="Editar Cliente">
                    <Button
                        size="small"
                        variant='text'
                        color="gray"
                        icon={<FontAwesomeIcon icon={faPencil} />}
                        onClick={handleEdit}
                    />
                </Tooltip>
                <Tooltip title="Eliminar Cliente">
                    <Button
                        size="small"
                        color="red"
                        variant='text'
                        icon={<FontAwesomeIcon icon={faTrash} />}
                        onClick={handleDelete}
                    />
                </Tooltip>
            </ActionButtons>
        </Container>
    )
}