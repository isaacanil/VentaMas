import React, { useEffect, useState, useRef } from 'react'
import { MdClose, MdPersonAdd, MdContentCopy, MdFilterList } from 'react-icons/md'
import styled, { createGlobalStyle } from 'styled-components'

import { Client } from '../../../templates/system/client/Client'
import { useDispatch, useSelector } from 'react-redux'
import { selectClient, selectClientMode, selectClientSearchTerm, selectIsOpen, setClientMode, setIsOpen } from '../../../../features/clientCart/clientCartSlice'
import { CLIENT_MODE_BAR } from '../../../../features/clientCart/clientMode'
import { useFbGetClients } from '../../../../firebase/client/useFbGetClients'
import { filtrarDatos } from '../../../../hooks/useSearchFilter'
import { Button, Badge, Tooltip, Dropdown, Space, Typography, Pagination } from 'antd'
import { toggleClientModal } from '../../../../features/modals/modalSlice'
import { OPERATION_MODES } from '../../../../constants/modes'
import { fbDeleteClient } from '../../../../firebase/client/fbDeleteClient'
import { selectUser } from '../../../../features/auth/userSlice'
const { Text, Title } = Typography
const GlobalStyle = createGlobalStyle`
  .ant-dropdown {
    z-index: 10000001 !important;
  }
`;

const ButtonText = styled.div`
    @media (width < 700px) {
        display: none;
    }
`

export const ClientSelector = ({ }) => {
    const dispatch = useDispatch()
    const isOpen = useSelector(selectIsOpen)
    const user = useSelector(selectUser)
    const mode = useSelector(selectClientMode)
    const selectedClient = useSelector(selectClient)
    const searchTerm = useSelector(selectClientSearchTerm)
    const { clients } = useFbGetClients()
    const filteredClients = filtrarDatos(clients, searchTerm)
    const createClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.CREATE.id))
    const updateClientMode = () => dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id))
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const containerRef = useRef(null);

    console.log(clients[0])

    const handleClose = () => {
        dispatch(setIsOpen(false))
    }

    const getDuplicateClients = (clients) => {
        const namesCount = clients.reduce((acc, { client }) => {
            acc[client.name?.toLowerCase()] = (acc[client.name?.toLowerCase()] || 0) + 1;
            return acc;
        }, {});

        return clients.filter(({ client }) =>
            client.name && namesCount[client.name.toLowerCase()] > 1
        );
    };

    const getClientsWithoutNames = (clients) => {
        return clients.filter(({ client }) => !client.name);
    };

    const duplicateClients = getDuplicateClients(clients);
    const clientsWithoutNames = getClientsWithoutNames(clients);
    const hasDuplicates = duplicateClients.length > 0;
    const openAddClientModal = () => {
        dispatch(setIsOpen(false));
        dispatch(toggleClientModal({ mode: OPERATION_MODES.CREATE.id, data: null, addClientToCart: true }))
    }
    const openUpdateClientModal = (client) => {
        console.log(client)
        dispatch(setIsOpen(false));
        updateClientMode();
        dispatch(toggleClientModal({ mode: OPERATION_MODES.UPDATE.id, data: client, addClientToCart: true }))
    }
    const handleDeleteClient = async (id) => {
        await fbDeleteClient(user?.businessID, id);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                dispatch(setIsOpen(false));
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const items = [
        {
            key: 'all',
            label: 'Todos los clientes',
        },
        {
            key: 'duplicates',
            label: 'Clientes duplicados',
            icon: <MdContentCopy />,
        },
        // {
        //     key: 'noName',
        //     label: 'Clientes sin nombre',

        // },
    ];

    const handleMenuClick = (e) => {
        setFilter(e.key);
    };

    const getFilteredClients = () => {
        switch (filter) {
            case 'duplicates':
                return duplicateClients;
            case 'noName':
                return clientsWithoutNames;
            default:
                return filteredClients;
        }
    };

    const filteredClientsToShow = getFilteredClients();

    const paginatedClients = filteredClientsToShow.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <>
            <GlobalStyle />
            {isOpen && <Overlay onClick={handleClose} />}
            <Container isOpen={isOpen}>
                <Header>
                    <Title level={5} style={{ margin: 0 }}>Seleccionar Cliente</Title>
                    <ButtonGroup>
                        <Tooltip title="Filtrar clientes">
                            <Dropdown menu={{ items, onClick: handleMenuClick }}>

                                <Badge count={filter === 'all' ? 0 : filteredClientsToShow.length} size="small" >
                                    <Button
                                        icon={<MdFilterList />}
                                    >
                                        <ButtonText> Filtrar</ButtonText>
                                    </Button>
                                </Badge>
                            </Dropdown>
                        </Tooltip>
                        <Tooltip title="Crear cliente">
                            <Button onClick={openAddClientModal} icon={<MdPersonAdd />}>
                                <ButtonText> Crear Cliente</ButtonText>
                            </Button>
                        </Tooltip>
                        <Tooltip title="Cerrar">
                            <Button onClick={() => dispatch(setIsOpen(false))} icon={<MdClose />}>

                                <ButtonText> Cerrar</ButtonText>
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                </Header>
                <Body isEmpty={paginatedClients.length > 0}>
                    <ClientsList>
                        {paginatedClients.length > 0 ? (
                            paginatedClients.map(({ client }, index) => (
                                <Client
                                    updateClientMode={openUpdateClientModal}
                                    key={index}
                                    selectedClient={selectedClient}
                                    client={client}
                                    onDelete={handleDeleteClient}
                                    Close={() => dispatch(setIsOpen(false))}
                                    searchTerm={searchTerm}
                                />
                            ))
                        ) : null}
                        {paginatedClients.length === 0 ? (<h3>Cliente no encontrado</h3>) : null}
                    </ClientsList>

                </Body>
                <Footer>
                    <div style={{ whiteSpace: 'nowrap' }}>Clientes: {filteredClients.length}/{clients.length}</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredClientsToShow.length}
                            onChange={(page, pageSize) => {
                                setCurrentPage(page);
                                setPageSize(pageSize);
                            }}
                            style={{ textAlign: 'center' }}
                        />
                    </div>
                    <div></div>
                </Footer>
            </Container>
        </>
    )
}

const Overlay = styled.div`
    position: fixed;
    top: 2.75em;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
`

const Container = styled.div`
    position: fixed;
    z-index: 100000;
    top: 3em;
    max-width: 700px;
    right: 0;
    overflow: hidden;
    height: calc(100vh - 3.2em);
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    border-radius: 10px;
    width: 100%;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-600px) scaleY(0);
    transition: transform 0.4s ease-in-out;
    ${props => props.isOpen && `
        transform: translateY(0) scaleY(1);
    `}
`

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4em 1em;
    border-bottom: 1px solid #ddd;
    background-color: #f9f9f9;
`

const ButtonGroup = styled.div`
    display: flex;
    gap: 0.5em;
`

const Body = styled.div`
    z-index: 1;
    width: 100%;
    display: grid;
    height: 100%;
    overflow: hidden;
    padding: 1em;
    
    ${props => !props.isEmpty && `
        ${ClientsList} {
            grid-template-columns: 1fr;
        }
    `}
    
    h3 {
        color: #333;
        text-align: center;
    }
`

const ClientsList = styled.div`
    display: grid;
    align-items: start;
    align-content: start;
   
    overflow-y: auto;
    gap: 0.8em;
`
const Footer = styled.div`
    display: grid;
    padding: 0.5em 1em;
    grid-template-columns: 1fr 1fr 1fr;

    justify-content: space-between;
 
    align-items: center;

    border-top: 1px solid #ddd;
`