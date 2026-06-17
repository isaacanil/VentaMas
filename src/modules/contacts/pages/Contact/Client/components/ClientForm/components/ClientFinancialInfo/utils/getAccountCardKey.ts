type AccountCardKeySource = {
  arId?: string;
  accountNumber?: string | number;
  id?: string;
  numberId?: string | number;
};

export function getAccountCardKey(account: AccountCardKeySource) {
  return (
    account.arId ?? account.accountNumber ?? account.id ?? account.numberId
  );
}
