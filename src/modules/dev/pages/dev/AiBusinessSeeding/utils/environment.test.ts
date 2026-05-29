import { describe, expect, it } from 'vitest';

import {
  AI_BUSINESS_SEEDING_ENVIRONMENTS,
  getAiBusinessSeedingEnvironmentUrl,
  resolveAiBusinessSeedingEnvironment,
} from './environment';

describe('AiBusinessSeeding environment utils', () => {
  it('resuelve staging por project id', () => {
    expect(
      resolveAiBusinessSeedingEnvironment('ventamax-staging').id,
    ).toBe('staging');
  });

  it('resuelve produccion por project id', () => {
    expect(resolveAiBusinessSeedingEnvironment('ventamaxpos').id).toBe(
      'production',
    );
  });

  it('cae a staging cuando no reconoce el project id', () => {
    expect(resolveAiBusinessSeedingEnvironment('').id).toBe('staging');
  });

  it('construye la URL del tool para el ambiente destino', () => {
    const production = AI_BUSINESS_SEEDING_ENVIRONMENTS.find(
      (environment) => environment.id === 'production',
    );

    expect(
      getAiBusinessSeedingEnvironmentUrl({
        environment: production!,
        search: '?from=test',
      }),
    ).toBe(
      'https://ventamaxpos.web.app/dev/tools/ai-business-seeding?from=test',
    );
  });
});
