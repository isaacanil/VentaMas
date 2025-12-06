const FORM_FIELDS = [
  'businessType',
  'name',
  'rnc',
  'email',
  'tel',
  'country',
  'province',
  'address',
  'logo',
];

const DEFAULT_FORM_VALUES = {
  businessType: 'general',
  name: '',
  rnc: '',
  email: '',
  tel: '',
  country: '',
  province: '',
  address: '',
  logo: '',
};

const normalizeFormValues = (values = {}) =>
  FORM_FIELDS.reduce((acc, field) => {
    acc[field] = values?.[field] ?? DEFAULT_FORM_VALUES[field];
    return acc;
  }, {});

const mapBusinessDataToFormValues = (business) =>
  normalizeFormValues({
    businessType: business?.businessType,
    name: business?.name,
    rnc: business?.rnc,
    email: business?.email,
    tel: business?.tel,
    country: business?.country,
    province: business?.province,
    address: business?.address,
    logo: business?.logoUrl || business?.logo,
  });

export {
  FORM_FIELDS,
  DEFAULT_FORM_VALUES,
  normalizeFormValues,
  mapBusinessDataToFormValues,
};
