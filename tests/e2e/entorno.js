// Datos comunes de las pruebas E2E.
import { test } from '@playwright/test';

// Las páginas cuelgan de /front/ (Vercel sirve la raíz del repo).
export const pagina = (ruta) => `/front/${ruta}`;

// Las pruebas que crean datos nunca corren contra producción.
export const esProduccion = /autocar-zeta\.vercel\.app/.test(process.env.BASE_URL || '');
export function soloFueraDeProduccion() {
    test.skip(esProduccion, 'Esta prueba escribe datos: corre contra dev o local, nunca contra producción.');
}

// Email único por corrida, para que el registro no choque con uno anterior.
export const emailNuevo = () => `e2e+${Date.now()}${Math.floor(Math.random() * 1000)}@autocar.test`;
export const PASSWORD = 'Prueba1234';
