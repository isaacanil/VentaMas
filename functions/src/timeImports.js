import { performance } from 'perf_hooks';

async function timeImport(name, path) {
  const start = performance.now();
  await import(path);
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

async function run() {
  const totalStart = performance.now();
  await timeImport('bootstrap', './app/core/config/bootstrapEnv.js');
  await timeImport(
    'Inventory',
    './app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js',
  );
  // ... and so on
  const totalEnd = performance.now();
  console.log(`Total: ${(totalEnd - totalStart).toFixed(2)}ms`);
}
run();
