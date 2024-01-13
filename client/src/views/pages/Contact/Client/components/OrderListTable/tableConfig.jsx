import { useDispatch, useSelector } from "react-redux"
import { icons } from "../../../../../../constants/icons/icons"
import { Button, ButtonGroup } from "../../../../../templates/system/Button/Button"
import { Message } from "../../../../../templates/system/message/Message"
import { fbDeleteClient } from "../../../../../../firebase/client/fbDeleteClient"
import { toggleClientModal } from "../../../../../../features/modals/modalSlice"
import { OPERATION_MODES } from "../../../../../../constants/modes"
import { useFormatPhoneNumber } from "../../../../../../hooks/useFormatPhoneNumber"
import { truncateString } from "../../../../../../utils/text/truncateString"
import { selectUser } from "../../../../../../features/auth/userSlice"

export const tableConfig = () => {
    const user = useSelector(selectUser)
    const updateMode = OPERATION_MODES.UPDATE.id
    const noData = <Message title='(vacio)' fontSize='small' bgColor='error' />
    const dispatch = useDispatch();

    const handleDeleteClient = (id) => fbDeleteClient(user, id);

    const openModalUpdateMode = (client) => { dispatch(toggleClientModal({ mode: updateMode, data: client })) }

    const columns = [
       
        {
            Header: "Nombre",
            accessor: "name",
        },
        {
            Header: "Telefono",
            accessor: "phone",
            cell: ({ value }) => value ? useFormatPhoneNumber(value) : noData
        },
        {
            Header: "RNC/Cedula",
            accessor: "rnc",
            cell: ({ value }) => value ? value : noData
        },
        {
            Header: "Direccion",
            accessor: "address",

            cell: ({ value }) => value ? truncateString(value, 14) : noData
        },
        {
            Header: "Acciones",
            accessor: "actions",
            align: 'right',
            cell: ({ value }) => {
                return (
                    <ButtonGroup>
                        <Button
                            borderRadius='normal'
                            title={icons.operationModes.edit}
                            width='icon32'
                            color='gray-dark'
                            onClick={() => openModalUpdateMode(value)}
                        />
                        <Button
                            borderRadius='normal'
                            title={icons.operationModes.delete}
                            width='icon32'
                            color='gray-dark'
                            onClick={() => handleDeleteClient(value.id)}
                        />
                    </ButtonGroup>
                )
            }
        }
    ]

    const filterConfig = [
        {
            label: 'Cliente',
            accessor: 'name',
        },

    ]
    return {
        columns,
        filterConfig
    }
}