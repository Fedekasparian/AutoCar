# N2 · Entrevista a talleres de Mercedes y Luján

> **Opcional.** AutoCar es un proyecto de la facultad: los números (D1) y el alcance son supuestos y la demo usa datos de prueba. Este guion muestra **cómo los validaríamos en un caso real**. Si el profe pregunta de dónde salen los $ 130.000 o el 77/23, la respuesta es: son supuestos, y así los validaríamos.

Objetivo: validar con 2 o 3 talleres reales los números y las reglas del modelo v4. Lo que contesten iría a la tabla del final y, resumido, al README del modelo de negocio.

**Cómo hacerla**

- Cada uno de nosotros va a un taller. Es mejor en persona, a una hora tranquila (a media mañana, no un lunes temprano). Son 15 minutos.
- No es para vender. La idea es preguntar: "Estamos haciendo un proyecto de la facultad y queremos saber si esto le serviría a un mecánico como vos".
- Anotá las palabras del mecánico, sobre todo cuando dice que no y por qué.
- No prometas nada: ni que va a haber clientes, ni un precio, ni que lo vamos a sumar.

## 1. Presentación (1 minuto)

> "Somos estudiantes de Sistemas de la UNLu. Estamos armando una app para gente que va a comprar un auto usado: elige un mecánico de la zona, el mecánico revisa el auto con una lista de 10 puntos y firma el informe con su nombre. Si se le pasó algo que se veía, la app le devuelve la plata al comprador y le paga una compensación, y el mecánico baja en un ranking. Queremos saber si a un taller como el tuyo le cerraría."

## 2. Lo que hacen hoy

1. ¿Te traen autos para revisar antes de comprarlos? ¿Cuántos por mes, más o menos?
2. ¿Cuánto cobrás hoy por una revisión así? ¿Qué incluye?
3. ¿Cuánto tiempo te lleva? ¿Usás alguna lista o lo hacés de memoria?
4. ¿Lo hacés en el taller o vas a donde está el auto?
5. ¿Alguna vez un cliente volvió enojado porque no viste algo? ¿Qué pasó?

## 3. El checklist

Mostrale la lista de 10 ítems: carrocería, estructura, motor, transmisión, frenos, suspensión, neumáticos, electricidad, kilometraje e identificación (motor y chasis contra la cédula).

6. ¿Falta algo que siempre revisás? ¿Sobra algo?
7. ¿Se puede ver todo esto **sin desarmar** el auto y sin elevador? ¿Qué necesitás?
8. Leele "lo que no cubre" (el alcance, sección 7.1 del PLAN). ¿Te parece justo? ¿Agregarías algo?

## 4. Los números

9. Si cobrás $ 130.000 por la inspección, ¿te parece bien quedarte con $ 100.000 y que la app se quede con $ 30.000? ¿Con cuánto te quedarías para que te convenga?
10. ¿Cuál sería un precio razonable para el comprador en Mercedes o Luján?
11. ¿Cuántas inspecciones por semana podrías tomar?

## 5. La garantía (es lo más delicado)

12. Si un comprador reclama y AutoCar decide que se veía, el mecánico baja en el ranking. ¿Lo aceptarías?
13. ¿Aceptarías poner tu nombre y tu firma en el informe?
14. Hoy la compensación la paga un fondo de AutoCar, no el mecánico. ¿Te sumarías si tuvieras que poner una parte?
15. ¿Quién te parece que tendría que decidir si un reclamo procede? ¿Otro mecánico, AutoCar, alguien de afuera?

## 6. Cierre

16. ¿Qué te haría decir que no?
17. ¿Lo usarías? Del 1 al 5, ¿cuánto te interesa?
18. ¿Podemos nombrar a tu taller en la presentación de la facultad, o preferís que quede anónimo?

> "Gracias. Si lo armamos de verdad, ¿te podemos volver a contactar?"

---

## Respuestas

Completá una columna por taller. "Anónimo" si así lo pidió.

| Pregunta | Taller 1 | Taller 2 | Taller 3 |
|---|---|---|---|
| Quién fue / fecha | | | |
| Taller y localidad | | | |
| Revisiones antes de comprar por mes (2.1) | | | |
| Precio actual y qué incluye (2.2) | | | |
| Tiempo y si usa lista (2.3) | | | |
| Falta o sobra en el checklist (3.6) | | | |
| ¿Sin desarmar alcanza? (3.7) | | | |
| ¿El alcance es justo? (3.8) | | | |
| ¿77 / 23 le cierra? ¿Qué pide? (4.9) | | | |
| Precio razonable para el comprador (4.10) | | | |
| Inspecciones por semana (4.11) | | | |
| ¿Acepta el ranking? (5.12) | | | |
| ¿Firma con su nombre? (5.13) | | | |
| ¿Pondría parte de la compensación? (5.14) | | | |
| ¿Quién decide los reclamos? (5.15) | | | |
| Qué lo frenaría (6.16) | | | |
| Interés del 1 al 5 (6.17) | | | |
| ¿Se lo puede nombrar? (6.18) | | | |

## Qué hacemos con las respuestas

- **Precio y reparto (D1):** si la mayoría pide más del 77 %, cambiamos `Precio::desglose` en el back y `desglose` en el front, junto con sus pruebas.
- **Alcance (N3):** lo que agreguen o saquen va a `ALCANCE` en `front/js/servicios/inspecciones.js` y a la sección 7.1 del PLAN.
- **Checklist:** si falta un ítem, se agrega en `Checklist::ITEMS` del back y en `CHECKLIST` del front. Tienen que tener los mismos códigos.
- **Para la defensa:** una diapositiva con lo que nos dijeron, sus propias palabras (sobre todo lo que les preocupa) y qué cambiamos por eso.
