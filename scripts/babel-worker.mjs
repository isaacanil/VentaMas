// Worker thread para transformar archivos con Babel + React Compiler
// Se ejecuta en un thread separado para aprovechar múltiples cores.
import { transformAsync } from '@babel/core';

/**
 * @param {{ code: string, id: string }} param
 * @returns {Promise<{ code: string, map: any } | null>}
 */
export default async function transform({ code, id }) {
  const result = await transformAsync(code, {
    filename: id,
    plugins: [
      ['babel-plugin-react-compiler', { target: '19' }],
      [
        'babel-plugin-styled-components',
        { displayName: false, fileName: false },
      ],
    ],
    parserOpts: {
      plugins: ['typescript', 'jsx'],
    },
    sourceType: 'module',
    configFile: false,
    babelrc: false,
  });
  if (!result?.code) return null;
  return { code: result.code, map: result.map };
}
