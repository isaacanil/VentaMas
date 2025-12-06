// util/env.js
const mapEnv = {
  dev: 'development',
  prod: 'production',
  all: null,
};
/**
 * Ejecuta `cb` si el modo actual coincide con alguno de `envs`.
 * @param {string|string[]} envs - 'dev', 'prod', 'all' o valores reales de MODE.
 * @param {Function} cb - callback a ejecutar.
 * @returns {*} Resultado de `cb()` o `undefined`.
 */
export function onEnv(envs = 'dev', cb) {
  if (typeof cb !== 'function') return;
  const mode = import.meta.env.MODE;
  const targets = Array.isArray(envs) ? envs : [envs];
  const match =
    targets.includes('all') ||
    targets.some((e) => mapEnv[e] === mode || e === mode);
  return match ? cb() : undefined;
}
