import { Navigate, useParams } from 'react-router-dom';

import { buildAccountReceivableListUrl } from '@/modules/accountsReceivable/utils/accountReceivableNavigation';

export default function AccountReceivableInfo() {
  const { id } = useParams<{ id?: string }>();

  return <Navigate replace to={buildAccountReceivableListUrl(id)} />;
}
