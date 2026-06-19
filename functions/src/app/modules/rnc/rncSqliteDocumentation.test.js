import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const runbook = readFileSync(
  new URL('../../../../../docs/rnc-sqlite-lookup.md', import.meta.url),
  'utf8',
);
const developerSpec = readFileSync(
  new URL(
    '../../../../../docs/rnc-sqlite-developer-spec.md',
    import.meta.url,
  ),
  'utf8',
);

const rncDocs = [
  ['runbook', runbook],
  ['developer spec', developerSpec],
];

const expectEveryRncDocToContain = (expected) => {
  for (const [name, document] of rncDocs) {
    expect(document, `${name} should include ${expected}`).toContain(expected);
  }
};

const expectEveryRncDocToMatch = (expected) => {
  for (const [name, document] of rncDocs) {
    expect(document, `${name} should match ${expected}`).toMatch(expected);
  }
};

describe('rnc SQLite production runbook', () => {
  it('documents versioned snapshots, current pointer, and rollback paths', () => {
    expect(runbook).toContain('rnc/snapshots/{sha256}.sqlite.gz');
    expect(runbook).toContain('rnc/manifests/{sha256}.json');
    expect(runbook).toContain('rnc/current.json');
    expect(runbook).toContain('gcloud storage cp');
    expect(runbook).toContain('$env:RNC_SQLITE_STORAGE_PATH');
    expect(runbook).toContain('$env:RNC_SNAPSHOT_PREFIX');
    expect(runbook).toContain('$env:RNC_CURRENT_MANIFEST_PATH');
  });

  it('documents manual runs and scoped staging/prod deploy commands', () => {
    expect(runbook).toContain('run diario');
    expect(runbook).toContain('gcloud scheduler jobs run');
    expect(runbook).toContain(
      'npm run deploy -- staging:functions lookupRnc,refreshRncSnapshotWeekly',
    );
    expect(runbook).toContain(
      'npm run deploy -- prod:functions lookupRnc,refreshRncSnapshotWeekly',
    );
    expect(runbook).toContain(
      'firebase deploy --project staging --only "functions:lookupRnc,functions:refreshRncSnapshotWeekly"',
    );
    expect(runbook).toContain(
      'firebase deploy --project prod --only "functions:lookupRnc,functions:refreshRncSnapshotWeekly"',
    );
  });

  it('documents App Check, default backend, and explicit legacy rollback', () => {
    expect(runbook).toContain('App Check');
    expect(runbook).toContain('VITE_FIREBASE_APPCHECK_SITE_KEY');
    expect(runbook).toContain('Backend por defecto');
    expect(runbook).toContain('rnc_lookup_source');
    expect(runbook).toContain('VITE_RNC_LOOKUP_SOURCE = \'backend\'');
    expect(runbook).toContain('legacy-supabase');
  });

  it('documents CAS preconditions for current and legacy fallback writes', () => {
    expect(runbook).toContain('Get-GcsObjectGenerationOrZero');
    expect(runbook).toContain('--if-generation-match=$currentGeneration');
    expect(runbook).toContain('--if-generation-match=$legacyGeneration');
    expect(runbook).toContain('ifGenerationMatch=0` solo cuando');
    expect(runbook).toContain('`--if-generation-match=0` solo aplica');
  });

  it('documents memory, ZIP, duplicates, and deterministic publication behavior', () => {
    expect(runbook).toContain('memory: 4GiB');
    expect(runbook).toContain('memory: 2GiB');
    expect(runbook).toContain('timeoutSeconds: 180');
    expect(runbook).toContain('RNC_DGII_MAX_ZIP_BYTES=134217728');
    expect(runbook).toContain('RNC_DGII_MAX_TEXT_BYTES=536870912');
    expect(runbook).toContain('mtime: 0');
    expect(runbook).toContain('duplicateRncCount');
    expect(runbook).toContain('INSERT OR REPLACE');
    expect(runbook).toContain('No se acepta reemplazar un objeto versionado');
  });

  it('documents duplicate RNC guardrails, aliases, and defaults', () => {
    expectEveryRncDocToContain('RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO');
    expectEveryRncDocToContain(
      'RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE',
    );
    expectEveryRncDocToContain('RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT');
    expectEveryRncDocToContain(
      'RNC_SNAPSHOT_MAX_DUPLICATE_RNC_INCREASE_RATIO',
    );
    expectEveryRncDocToContain('RNC_SNAPSHOT_MAX_DUPLICATE_RNC_ROWS');
    expect(runbook).toContain('default `0.01`');
    expect(runbook).toContain('default `0.005`');
    expect(runbook).toContain('no tiene default');
    expect(developerSpec).toContain('default: 0.01');
    expect(developerSpec).toContain('default: 0.005');
    expect(developerSpec).toContain('default: sin limite absoluto');
  });

  it('documents that parserVersion invalidates reuse and skip paths', () => {
    expectEveryRncDocToMatch(/`?parserVersion`? invalida reuse\/skip/);
    expectEveryRncDocToContain('source-zip-unchanged');
    expectEveryRncDocToContain('source-text-unchanged');
    expectEveryRncDocToContain('snapshot-unchanged');
    expectEveryRncDocToContain('RNC_PARSER_VERSION');
  });

  it('documents concrete SLO and alert thresholds', () => {
    expectEveryRncDocToContain('99.5%');
    expectEveryRncDocToContain('p95');
    expectEveryRncDocToContain('duplicateRncRatioIncrease');
    expectEveryRncDocToContain('resource-exhausted');
    expectEveryRncDocToMatch(/26\s*(horas|h)/);
    expectEveryRncDocToContain('0.15');
    expectEveryRncDocToContain('0.30');
  });

  it('documents pending load and race tests before production', () => {
    expectEveryRncDocToContain('Pruebas pendientes antes de produccion');
    expectEveryRncDocToContain('200 requests concurrentes');
    expectEveryRncDocToContain('50 requests simultaneos');
    expectEveryRncDocToMatch(/carreras de publicacion/i);
    expectEveryRncDocToContain('current.json');
    expectEveryRncDocToContain('/tmp/ventamas-rnc');
  });
});
