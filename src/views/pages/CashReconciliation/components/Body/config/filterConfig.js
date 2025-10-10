import { faTruck, faMoneyBill } from '@fortawesome/free-solid-svg-icons'


const createFilterConfig = ({ users }) => ({
    filters: [
        {
            type: 'select',
            key: 'users',
            placeholder: 'Usuarios',
            allowClear: true,
            icon: faMoneyBill,
            options: users.map(({ user }) => ({
                value: user.id,
                label: user.realName.trim() ? user.realName : user.name,
                icon: user.icon
            }))
        },
        {
            type: 'status',
            key: 'status',
            visibleStatus: ['pending', 'completed', 'canceled', 'processing'],
            placeholder: 'Estado'
        },
        {
            type: 'select',
            key: 'providerId',
            placeholder: 'Proveedores',
            icon: faTruck,
            showSearch: true
        }
    ],
    defaultValues: {
        status: 'pending',
        condition: null
    },
    defaultSort: {
        isAscending: false
    },
    showSortButton: true,
    showResetButton: true
})

export default createFilterConfig
