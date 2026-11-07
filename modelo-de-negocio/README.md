# Modelo de negocio

**Programación en Ambiente Web · UNLu Mercedes · 2026**
**Grupo:** Bernal Justino · Kasparian Federico · Marino Lautaro · Ponti Mateo

| Documento | Qué contiene |
|---|---|
| [Presentación](AutoCar-modelo-de-negocio.pptx) | Misión y visión, problema, solución, competencia, garantía, roles, ingresos, subasta, crecimiento y hoja de ruta |
| Este README | El mismo contenido en texto |

## En una frase

Cada publicación de AutoCar te muestra por qué conviene: la tranquilidad de una agencia, al precio de una venta entre particulares. La app está pensada para el mercado argentino de autos usados.

## Misión, visión y valores

- **Misión:** que comprar un auto usado sea tan seguro y transparente como comprar uno nuevo, sin pagar precio de agencia.
- **Visión:** ser la referencia de precio justo del usado en Argentina: donde se compra un auto y donde se consulta cuánto vale.
- **Valores:**
  - Transparencia: mostramos el dato aunque no nos convenga.
  - Confianza verificada: cada auto pasa por un mecánico.
  - Precio justo para el que compra y para el que vende.

## El problema

Avisos sobran (MercadoLibre, Marketplace, Kavak, DeMotores, Autocosmos). Las dudas aparecen después del "me interesa":

1. **¿Pago un precio justo?** Nadie te dice si el precio publicado está caro o barato.
2. **¿Está bien de verdad?** Km adulterado, choques tapados, fallas que no se ven en fotos.
3. **¿Papeles limpios?** Deudas de patente, prenda, embargo, pedido de secuestro.
4. **¿Y si pago y sale mal?** Una vez que pagaste a un particular, nadie te cubre.

## La solución: la publicación que se compara sola

El usuario entra y le aparece una publicación. En esa misma publicación ve el precio, una etiqueta (**Buen precio**, **En precio** o **Caro**) y la ventaja frente a los autos iguales de otros sitios. No tiene que salir a comparar: AutoCar ya lo hizo.

| Qué compara | Cómo |
|---|---|
| Precio total | Precio + papeles + transferencia, para comparar lo mismo con lo mismo |
| Estado | Revisado por un mecánico con puntaje, frente a autos sin revisar |
| Km y año | Frente al promedio de los autos iguales |
| Riesgo | Papeles limpios, pago retenido y garantía de 7 días |

- **Autos iguales:** mismo modelo, año ±2 y km ±30 %.
- **Regla de honestidad:** con menos de 5 autos comparables no se muestra el dato, y si el auto está caro también se dice.

## Por qué usar AutoCar

| | MercadoLibre / Marketplace | DeMotores / Autocosmos | Kavak | **AutoCar** |
|---|---|---|---|---|
| Precio | De particular | De particular | De agencia | **De particular** |
| Te dice si el precio es justo | No | No | No | **Sí** |
| Auto revisado por un mecánico | No | No | Sí | **Sí** |
| Papeles incluidos | No | No | Sí | **Sí** |
| Garantía después de pagar | No | No | 7 días o 300 km | **7 días, pago retenido** |

El mismo auto comprado en tres lugares (Volkswagen Gol Trend 2019, 68.000 km; **ejemplo ilustrativo**):

| | Particular | Kavak | **AutoCar** |
|---|---|---|---|
| Precio publicado | $ 15,8 M | $ 18,2 M | **$ 14,9 M** |
| Papeles y transferencia | + $ 0,6 M, los hacés vos | Incluidos | **Incluidos** |
| Revisión mecánica | La pagás y la buscás aparte | Incluida | **Incluida, con puntaje** |
| Precio justo | No sabés si está caro | No te lo dice | **Buen precio: 9 % abajo** |
| Si sale mal | Nadie te cubre | 7 días o 300 km | **7 días, pago retenido** |
| **Total** | $ 16,4 M | $ 18,2 M | **$ 14,9 M** |

Con AutoCar: $ 1,5 M menos que un particular, $ 3,3 M menos que una agencia, y con protección de agencia.

## Garantía de 7 días con pago retenido

Kavak puede devolverte la plata porque el auto es suyo. En AutoCar el auto es de un particular, así que la protección es retener el pago:

1. El comprador paga a través de AutoCar.
2. AutoCar retiene la plata 7 días; el comprador ya usa el auto.
3. Si todo está en orden, al día 8 el vendedor cobra.
4. Si aparece una falla oculta, responde el mecánico que verificó el auto y baja su puntaje.

La garantía le da sentido al ranking: el mecánico que revisa mal pierde pedidos.

## Qué gana cada rol

| Rol | Qué gana |
|---|---|
| Comprador | Ve en cada aviso si conviene y por qué. Compra revisado, con papeles y con 7 días de garantía |
| Vendedor | Precio sugerido para salir como "buen precio" y vender más rápido. Puede pujar por aparecer primero |
| Mecánico | Ranking por calidad: mejor puntaje, más verificaciones y más ingresos. Compiten por hacerlo bien |
| AutoCar | Gana en cada venta. Más ventas, más datos y mejores comparaciones |

Al principio el foco está en el comprador: si él confía, vienen los vendedores y los mecánicos.

## Cómo se sustenta

| Fuente | Qué es | Peso |
|---|---|---|
| Comisión por venta | Un % del precio al concretar la venta, con gestoría incluida | Principal |
| Verificación | El mecánico cobra la revisión y AutoCar se queda una parte | Principal |
| Destacado por subasta | Los vendedores pujan por aparecer primero | Secundaria |
| Plan comprador | Alertas y metabuscador con autos de otros sitios | Secundaria |
| Socios | Comisión de financieras, aseguradoras y talleres | A futuro |

La comparación no se cobra: es lo que genera la confianza y la venta, y de la venta sale la plata. La garantía tampoco: la respalda el mecánico que verificó.

### Destacado por subasta

1. **Pujan:** los vendedores ofrecen cuánto pagan por día para aparecer primero en una búsqueda.
2. **Filtramos:** solo pueden pujar los autos con etiqueta "Buen precio" o "En precio".
3. **Gana:** el que más ofrece se muestra arriba, siempre marcado como "Destacado".

Un auto caro nunca aparece primero. Se subasta el lugar, no el auto: subastar el auto subiría el precio y chocaría con la idea de precio justo.

## Cómo crece

Comparación honesta → más compradores → más vendedores y mecánicos → más datos de precios reales → comparación más precisa.

Es difícil de copiar porque los datos de precios (incluido a cuánto se vendió de verdad cada auto) y la red de mecánicos con ranking y garantía se acumulan con el tiempo.

| Fase | Qué incluye |
|---|---|
| 1. Lanzamiento | Comparación en cada publicación, verificación por mecánico, papeles incluidos, garantía de 7 días |
| 2. Crecimiento | Ranking de mecánicos, destacado por subasta, plan comprador (alertas y metabuscador) |
| 3. Referencia | Índice público de precios del usado, financiación y seguro con socios, más ciudades |
