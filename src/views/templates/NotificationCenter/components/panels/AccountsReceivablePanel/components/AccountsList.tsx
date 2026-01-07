import { ScrollArea } from '@/views/templates/NotificationCenter/components/panels/shared/PanelPrimitives';

import AccountRow from './AccountRow';

const buildAccountKey = (account) => {
  if (!account) return 'account-row';
  if (account.id) return account.id;
  const invoiceRef = account.invoiceId || account.invoiceNumber || 'invoice';
  const clientRef = account.clientId || account.clientName || 'client';
  return `${clientRef}-${invoiceRef}`;
};

const AccountsList = ({ accounts = [] }) => (
  <ScrollArea>
    {(Array.isArray(accounts) ? accounts : []).map((account) => (
      <AccountRow key={buildAccountKey(account)} account={account} />
    ))}
  </ScrollArea>
);

export default AccountsList;
