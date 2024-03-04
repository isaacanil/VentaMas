import { AbilityBuilder, PureAbility } from '@casl/ability';
import { useMatch } from 'react-router-dom';
import routesName from '../../routes/routesName';


export function defineAbilitiesForCashier(user) {
  const { can, rules } = new AbilityBuilder(PureAbility);
  const { SALES_TERM, SETTING_TERM, CONTACT_TERM, BASIC_TERM, INVENTORY_TERM, CASH_RECONCILIATION_TERM } = routesName;
  const { CLIENTS } = CONTACT_TERM
  const {  CASH_RECONCILIATION_CLOSURE, CASH_RECONCILIATION_INVOICE_OVERVIEW, CASH_RECONCILIATION_LIST, CASH_RECONCILIATION_OPENING} = CASH_RECONCILIATION_TERM;  
  const { SALES, BILLS,  } = SALES_TERM;
  const { HOME } = BASIC_TERM;
  const { INVENTORY_ITEMS } = INVENTORY_TERM
  
  can('manage', 'Bill');
  can('manage', 'Product');
  can('modify', 'Price');
  can(['read', 'create', 'update'], 'Client');
  can(['read', 'create', 'update'], 'Provider');
  can(['read', 'create', 'update'], 'Category');
  can('manage', 'CashCount');
  can('access', HOME);
  can('access', CASH_RECONCILIATION_OPENING);
  can('access', CASH_RECONCILIATION_CLOSURE);
  can('access', CASH_RECONCILIATION_LIST);
  
  can('access', SALES);
  can('access', BILLS);
  can('access', CLIENTS);
  can('access', INVENTORY_ITEMS);
  return rules
}


