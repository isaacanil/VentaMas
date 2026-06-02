import { describe, expect, it } from 'vitest';

import { buildAiBusinessSeedingFormDraft } from './aiBusinessSeedingFormDraft.js';

describe('buildAiBusinessSeedingFormDraft', () => {
  it('builds a create_business draft from a clear labelled registration form', () => {
    const result = buildAiBusinessSeedingFormDraft(`
Registro de negocio nuevo:

Datos del negocio
Nombre: ESPALCA GLOBAL
Tipo: Venta y distribucion de productos
Telefono: 8294490529
Direccion: C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste
RNC: 133693021

Usuarios
Dueno: Ronald de Jesus Espinal Hernandez

- Nombre de usuario: Facturacion
- Contrasena: Ronald2916
- Rol: Owner

Caja:
- Nombre: Carlos Alcantara
- Contrasena: Carlos2916
- Rol: Cajero
`);

    expect(result).toEqual({
      action: 'create_business',
      data: {
        business: {
          name: 'ESPALCA GLOBAL',
          rnc: '133693021',
          address: 'C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste',
          tel: '8294490529',
          email: undefined,
          businessType: 'general',
        },
        users: [
          {
            realName: 'Ronald de Jesus Espinal Hernandez',
            name: 'facturacion',
            role: 'owner',
            password: 'Ronald2916',
          },
          {
            realName: 'Carlos Alcantara',
            name: 'carlos-alcantara',
            role: 'cashier',
            password: 'Carlos2916',
          },
        ],
      },
    });
  });

  it('asks for clarification when labelled user data is ambiguous', () => {
    const result = buildAiBusinessSeedingFormDraft(`
Registro de negocio nuevo:

Datos del negocio
Nombre: ESPALCA GLOBAL
Tipo: Venta y distribucion de productos
Telefono: 8294490529/8099148619
Direccion: C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste
RNC: 133693021

Usuarios
Dueno: Ronald de Jesus Espinal Hernandez

- Nombre completo: Ronald De Jesus Espinal Hernandez/Carlos Orbelis Alcantara Lopez
- Nombre de usuario: Facturacion
- Contrasena: 2916
- Rol: Administrador

Caja:
- Nombre: Ronald Espinal/Carlos Alcantara
- Contrasena: Ronald2916
- Rol: Cajero
`);

    expect(result).toMatchObject({
      action: 'chat',
      data: {
        message: expect.stringContaining('Confirmame'),
        business: {
          name: 'ESPALCA GLOBAL',
          rnc: '133693021',
          address: 'C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste',
          tel: '8294490529/8099148619',
          email: undefined,
          businessType: 'general',
        },
        users: [
          {
            realName: 'Ronald de Jesus Espinal Hernandez',
            name: 'facturacion',
            role: 'owner',
            password: '2916',
          },
          {
            realName: 'Ronald Espinal/Carlos Alcantara',
            name: 'ronald-espinal-carlos-alcantara',
            role: 'cashier',
            password: 'Ronald2916',
          },
        ],
        ambiguities: [
          'El bloque dice Dueno/Owner, pero el rol escrito ahi no es owner.',
          'El nombre del dueno contiene varias personas separadas por "/".',
          'El nombre de Caja contiene varias personas separadas por "/".',
        ],
      },
    });
  });

  it('returns null when the prompt is not a labelled business form', () => {
    expect(buildAiBusinessSeedingFormDraft('Hola, que puedes hacer?')).toBeNull();
  });

  it('maps pharmacy labels to the internal pharmacy business type', () => {
    const result = buildAiBusinessSeedingFormDraft(`
Datos del negocio
Nombre: Farmacia Central
Tipo: Farmacia

Usuarios
Dueno: Maria Perez
- Nombre de usuario: maria.perez
- Rol: owner

Caja:
- Nombre: Ana Perez
- Rol: Cajero
`);

    expect(result).toMatchObject({
      action: 'create_business',
      data: {
        business: {
          name: 'Farmacia Central',
          businessType: 'pharmacy',
        },
      },
    });
  });

  it('builds all users and preserves address from colon headings and bullet labels', () => {
    const result = buildAiBusinessSeedingFormDraft(`
Datos del negocio:
* Nombre: ESPALCA GLOBAL
* Telefono: 8294490529 / 8099148619
* Direccion: C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste
* RNC: 133693021

Usuarios:

Dueno / owner:
* Nombre completo: Ronald de Jesus Espinal Hernandez
* Usuario: ronald.espinal
* Contrasena:
* Rol: owner

Administrador:
* Nombre completo: Carlos Orbelis Alcantara Lopez
* Usuario: carlos.alcantara
* Contrasena:
* Rol: admin

Caja:
* Nombre completo: Ronald Espinal
* Usuario: caja.ronald
* Contrasena:
* Rol: cajero

Caja:
* Nombre completo: Carlos Alcantara
* Usuario: caja.carlos
* Contrasena:
* Rol: cajero
`);

    expect(result).toEqual({
      action: 'create_business',
      data: {
        business: {
          name: 'ESPALCA GLOBAL',
          rnc: '133693021',
          address: 'C/Paseo de la reforma #10, Pantoja, Sto. Dgo. Oeste',
          tel: '8294490529 / 8099148619',
          email: undefined,
          businessType: 'general',
        },
        users: [
          {
            realName: 'Ronald de Jesus Espinal Hernandez',
            name: 'ronald.espinal',
            role: 'owner',
            password: undefined,
          },
          {
            realName: 'Carlos Orbelis Alcantara Lopez',
            name: 'carlos.alcantara',
            role: 'admin',
            password: undefined,
          },
          {
            realName: 'Ronald Espinal',
            name: 'caja.ronald',
            role: 'cashier',
            password: undefined,
          },
          {
            realName: 'Carlos Alcantara',
            name: 'caja.carlos',
            role: 'cashier',
            password: undefined,
          },
        ],
      },
    });
  });
});
