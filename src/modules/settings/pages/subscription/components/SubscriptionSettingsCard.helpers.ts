import { asRecord, toCleanString } from '../subscription.utils';

export const resolveBusinessLabel = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.name) ||
    toCleanString(nestedBusiness.name) ||
    toCleanString(root.businessName) ||
    toCleanString(nestedBusiness.businessName) ||
    'No disponible'
  );
};

export const resolveTaxId = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.rnc) ||
    toCleanString(nestedBusiness.rnc) ||
    toCleanString(root.cedula) ||
    toCleanString(nestedBusiness.cedula) ||
    toCleanString(root.personalID) ||
    toCleanString(nestedBusiness.personalID) ||
    'No disponible'
  );
};

export const resolveNcfType = (business: unknown) => {
  const root = asRecord(business);
  const nestedBusiness = asRecord(root.business);
  return (
    toCleanString(root.ncfType) ||
    toCleanString(nestedBusiness.ncfType) ||
    'No definido'
  );
};
