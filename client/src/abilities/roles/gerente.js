import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';
import routesName from '../../routes/routesName';

export function defineAbilitiesForManager() {
  const { can, rules } = new AbilityBuilder(PureAbility);

  const {
    SALES_TERM,
    SETTING_TERM,
    CONTACT_TERM,
    BASIC_TERM,
    INVENTORY_TERM,
    CASH_RECONCILIATION_TERM
  } = routesName;

  const { CLIENTS } = CONTACT_TERM;

  const {
    CASH_RECONCILIATION_CLOSURE,
    CASH_RECONCILIATION_INVOICE_OVERVIEW,
    CASH_RECONCILIATION_LIST,
    CASH_RECONCILIATION_OPENING
  } = CASH_RECONCILIATION_TERM;

  const { SALES, BILLS } = SALES_TERM;
  const { HOME } = BASIC_TERM;
  const { INVENTORY_ITEMS } = INVENTORY_TERM;

  can('manage', 'Bill');
  can('manage', 'Product');
  can('manage', 'CashCount');
  can('manage', 'User');
  can('manage', 'Business');

  can(['read', 'create', 'update'], 'Client');
  can(['read', 'create', 'update'], 'Provider');
  can(['read', 'create', 'update'], 'Category');
  
  can('access', HOME);
  can('access', CASH_RECONCILIATION_OPENING);
  can('access', CASH_RECONCILIATION_CLOSURE);
  can('access', CASH_RECONCILIATION_LIST);
  can('access', SALES);
  can('access', BILLS);
  can('access', CLIENTS);
  can('access', INVENTORY_ITEMS);

  return rules;
}

