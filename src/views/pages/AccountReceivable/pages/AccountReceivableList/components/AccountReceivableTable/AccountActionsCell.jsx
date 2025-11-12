import { DollarOutlined, EyeOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useDispatch } from 'react-redux'

import { setAccountPayment } from '../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice'
import { setARDetailsModal } from '../../../../../../../features/accountsReceivable/accountsReceivableSlice'

const AccountActionsCell = ({ value }) => {
  const dispatch = useDispatch()

  const handleOpenDetail = () => {
    dispatch(setARDetailsModal({ isOpen: true, arId: value.account.id }))
  }

  const handleOpenPayment = () => {
    const account = value.account
    const client = value.account.client
    const result = {
      isOpen: true,
      paymentDetails: {
        clientId: client.id,
        arId: account.id,
        paymentScope: 'account',
        totalAmount: account.balance,
      },
      extra: {
        ...account?.account,
      },
    }

    dispatch(setAccountPayment(result))
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <Button icon={<EyeOutlined />} onClick={handleOpenDetail} />
      <Button icon={<DollarOutlined />} onClick={handleOpenPayment} />
    </div>
  )
}

export default AccountActionsCell
