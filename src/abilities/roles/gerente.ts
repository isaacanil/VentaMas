import { AbilityBuilder, PureAbility } from '@casl/ability';

import routesName from '@/router/routes/routesName';

export function defineAbilitiesForManager(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;

  const {
    SALES_TERM,
    CONTACT_TERM,
    BASIC_TERM,
    INVENTORY_TERM,
    PURCHASE_TERM,
    CASH_RECONCILIATION_TERM,
    CREDIT_NOTE_TERM,
  } = routesName;

  const { CLIENTS } = CONTACT_TERM;

  const {
    CASH_RECONCILIATION_CLOSURE,
    CASH_RECONCILIATION_LIST,
    CASH_RECONCILIATION_OPENING,
  } = CASH_RECONCILIATION_TERM;

  const { SALES, BILLS } = SALES_TERM;
  const { HOME } = BASIC_TERM;
  const { INVENTORY_ITEMS } = INVENTORY_TERM;
  const { CREDIT_NOTE_LIST } = CREDIT_NOTE_TERM;
  const { BACKORDERS } = PURCHASE_TERM;

  can('manage', 'Bill');
  can('manage', 'Product');
  can('manage', 'CashCount');
  can('manage', 'User');
  can('manage', 'Business');
  can('manage', 'CreditNote');

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
  can('access', CREDIT_NOTE_LIST);
  can('access', BACKORDERS);
  cannot('access', '/users');
  cannot('access', '/users/list');
  cannot('access', '/users/session-logs');
  cannot('access', '/users/activity');

  return rules;
}
