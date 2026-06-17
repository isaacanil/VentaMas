import { describe, expect, it } from 'vitest';

import type { BusinessDoc } from '../types';
import { filterBusinesses, INITIAL_BUSINESS_FILTERS } from './businessControl';

const makeBusiness = ({
  address,
  email,
  id,
  name,
  rnc,
  tel,
}: {
  address?: string;
  email?: string;
  id: string;
  name?: string;
  rnc?: string;
  tel?: string;
}): BusinessDoc => ({
  business: {
    address,
    email,
    fiscalRollout: {
      electronicModelEnabled: false,
      electronicTransportEnabled: false,
      monthlyComplianceEnabled: false,
      reportingEnabled: false,
    },
    hasOwner: false,
    id,
    name,
    ownerCandidates: [],
    ownerSource: 'none',
    rnc,
    tel,
  },
  id,
  raw: {},
});

describe('businessControl filters', () => {
  it('filters businesses with normalized case and accent-insensitive search', () => {
    const businesses = [
      makeBusiness({
        address: 'Av. Independencia',
        email: 'contacto@clinica.test',
        id: 'business-1',
        name: 'Clínica Duarte',
        rnc: '101-12345-6',
        tel: '809-555-0101',
      }),
      makeBusiness({
        address: 'Calle Principal',
        email: 'ventas@ferreteria.test',
        id: 'business-2',
        name: 'Ferretería Norte',
        rnc: '131-98765-4',
        tel: '809-555-0202',
      }),
    ];

    expect(
      filterBusinesses(businesses, '  clinica  ', INITIAL_BUSINESS_FILTERS).map(
        (item) => item.id,
      ),
    ).toEqual(['business-1']);
    expect(
      filterBusinesses(businesses, 'FERRETERIA', INITIAL_BUSINESS_FILTERS).map(
        (item) => item.id,
      ),
    ).toEqual(['business-2']);
  });

  it('keeps non-search filters while using the normalized search term', () => {
    const businesses = [
      {
        ...makeBusiness({
          id: 'with-rnc',
          name: 'Clínica con RNC',
          rnc: '101-12345-6',
        }),
        business: {
          ...makeBusiness({
            id: 'with-rnc',
            name: 'Clínica con RNC',
            rnc: '101-12345-6',
          }).business,
          province: 'Santo Domingo',
        },
      },
      {
        ...makeBusiness({
          id: 'without-rnc',
          name: 'Clinica sin RNC',
        }),
        business: {
          ...makeBusiness({
            id: 'without-rnc',
            name: 'Clinica sin RNC',
          }).business,
          province: 'Santiago',
        },
      },
    ];

    const result = filterBusinesses(businesses, 'clinica', {
      ...INITIAL_BUSINESS_FILTERS,
      hasRNC: true,
      province: 'Santo Domingo',
    });

    expect(result.map((item) => item.id)).toEqual(['with-rnc']);
  });
});
