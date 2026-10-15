"""Genera los SVG de las mejoras para importar en Figma (estilo wireframe en grises)."""
import os
import sys
from xml.sax.saxutils import escape

OUT = sys.argv[1]
FONT = "Inter, Helvetica, Arial, sans-serif"
DARK, MID, LIGHT, LINE, FIELD, IMG = "#333333", "#777777", "#AAAAAA", "#E0E0E0", "#F5F5F5", "#DCDCDC"


def rect(x, y, w, h, fill="none", stroke=None, rx=0, dash=None, sw=1, opacity=None, id=None):
    a = f'x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'
    if stroke:
        a += f' stroke="{stroke}" stroke-width="{sw}"'
    if dash:
        a += f' stroke-dasharray="{dash}"'
    if opacity is not None:
        a += f' fill-opacity="{opacity}"'
    if id:
        a += f' id="{id}"'
    return f"<rect {a}/>"


def text(x, y, s, size=14, weight=400, fill=DARK, anchor="start", id=None):
    i = f' id="{id}"' if id else ""
    return (f'<text{i} x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{escape(s)}</text>')


def line(x1, y1, x2, y2, stroke=LINE, sw=1):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"/>'


def group(id, *parts):
    return f'<g id="{id}">' + "".join(parts) + "</g>"


def tw(s, size):
    """Ancho aproximado de un texto en Inter."""
    return len(s) * size * 0.56


def back_arrow(x=12, y=48):
    return (f'<path d="M{x+16} {y} H{x} M{x} {y} L{x+7} {y-7} M{x} {y} L{x+7} {y+7}" '
            f'stroke="{DARK}" stroke-width="2" fill="none" stroke-linecap="round"/>')


def sparkle(cx, cy, r=7, fill=DARK):
    k = r * 0.22
    return (f'<path d="M{cx} {cy-r} L{cx+k} {cy-k} L{cx+r} {cy} L{cx+k} {cy+k} L{cx} {cy+r} '
            f'L{cx-k} {cy+k} L{cx-r} {cy} L{cx-k} {cy-k} Z" fill="{fill}"/>')


def header(title, back=True, extra=""):
    parts = [rect(0, 0, 375, 72, fill="#FFFFFF")]
    if back:
        parts.append(back_arrow())
    parts.append(text(187.5, 54, title, 17, 700, anchor="middle"))
    parts.append(line(0, 72, 375, 72))
    parts.append(extra)
    return group("Header", *parts)


def nav(items, active):
    parts = [rect(0, 748, 375, 64, fill="#F7F7F7"), line(0, 748, 375, 748)]
    for i, label in enumerate(items):
        cx = 37.5 + 75 * i
        on = label == active
        parts.append(f'<circle cx="{cx}" cy="{772}" r="13" fill="{DARK if on else "#D0D0D0"}"/>')
        parts.append(text(cx, 801, label, 11, 600 if on else 400, DARK if on else "#666666", "middle"))
    return group("Barra inferior", *parts)


def ia_tag(right, y):
    return group("Tag IA", rect(right - 34, y + 11, 34, 18, fill="#E6E6E6", rx=9),
                 sparkle(right - 24, y + 20, 4, "#555555"),
                 text(right - 11, y + 24, "IA", 10, 700, "#555555", "middle"))


def field(x, y, w, label, value=None, placeholder=None, ia=False, dashed=False, h=40, name=None):
    parts = []
    if label:
        parts.append(text(x, y - 8, label, 13, 400, "#555555"))
    parts.append(rect(x, y, w, h, fill=FIELD, stroke="#999999" if dashed else "#CCCCCC", rx=4,
                      dash="4 3" if dashed else None))
    if value:
        parts.append(text(x + 12, y + h / 2 + 5, value, 14, 400, DARK))
    elif placeholder:
        parts.append(text(x + 12, y + h / 2 + 5, placeholder, 14, 400, LIGHT))
    if ia:
        parts.append(ia_tag(x + w - 8, y + h / 2 - 20))
    return group(name or f"Campo {label or placeholder}", *parts)


def button(x, y, w, h, label, primary=True, icon=None, name=None):
    parts = [rect(x, y, w, h, fill=DARK if primary else "#FFFFFF", stroke=None if primary else DARK, rx=4)]
    cx = x + w / 2
    if icon:
        cx += 10
        parts.append(icon(cx - tw(label, 15) / 2 - 14, y + h / 2))
    parts.append(text(cx, y + h / 2 + 5, label, 15, 600, "#FFFFFF" if primary else DARK, "middle"))
    return group(name or f"Botón {label}", *parts)


def chip(x, y, label, active=False, size=12, h=30, fill=None, dashed=False):
    w = tw(label, size) + 24
    f = fill or (DARK if active else "#FFFFFF")
    parts = [rect(x, y, w, h, fill=f, stroke=None if active else "#BBBBBB", rx=h / 2, dash="3 2" if dashed else None),
             text(x + w / 2, y + h / 2 + 4, label, size, 600 if active else 400, "#FFFFFF" if active else DARK, "middle")]
    return group(f"Chip {label}", *parts), w


def chip_right(right, y, label, style="outline", size=11):
    w = tw(label, size) + 18
    x = right - w
    fill = {"outline": "#FFFFFF", "dark": DARK, "soft": "#E6E6E6"}[style]
    stroke = "#BBBBBB" if style == "outline" else None
    color = "#FFFFFF" if style == "dark" else DARK
    return group(f"Estado {label}", rect(x, y, w, 22, fill=fill, stroke=stroke, rx=11),
                 text(x + w / 2, y + 15, label, size, 600, color, "middle"))


def svg(name, w, h, body, bg="#FFFFFF"):
    content = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
               f'<title>{escape(name)}</title>{rect(0, 0, w, h, fill=bg, id="Fondo")}{body}</svg>\n')
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(content)


NAV_USUARIO = ["Home", "Meta-S", "Publicar", "Mensajes", "Cuenta"]
NAV_TALLER = ["Panel", "Verificar", "Historial", "Mensajes", "Cuenta"]


# 1. Nueva búsqueda con texto libre + IA -------------------------------------------------
def bars(x, cy):
    return "".join(rect(x + i * 5, cy + 5 - hh, 3, hh, fill=DARK) for i, hh in enumerate((6, 10, 8)))


body = [header("Nueva búsqueda")]
body.append(group("Texto libre",
                  text(20, 102, "Describí el auto que buscás", 13, 600, DARK),
                  rect(20, 112, 335, 88, fill=FIELD, stroke="#CCCCCC", rx=4),
                  text(32, 138, "Busco un Corolla automático, del 2015", 14),
                  text(32, 158, "en adelante, que no pase los 9", 14),
                  text(32, 178, "millones.", 14)))
body.append(button(20, 210, 335, 40, "Completar con IA", primary=False,
                   icon=lambda x, cy: sparkle(x, cy, 7), name="Botón Completar con IA"))
body.append(text(20, 270, "La IA completa los campos. Revisalos antes de guardar.", 11, 400, MID))
body.append(line(20, 286, 355, 286))
body.append(field(20, 316, 335, "Marca", "Toyota", ia=True))
body.append(field(20, 380, 335, "Modelo", "Corolla", ia=True))
body.append(text(20, 436, "Año (desde - hasta)", 13, 400, "#555555"))
body.append(field(20, 444, 160, None, "2015", ia=True, name="Campo Año desde"))
body.append(field(195, 444, 160, None, placeholder="Hasta", dashed=True, name="Campo Año hasta"))
body.append(text(195, 500, "Completá este dato", 11, 600, "#555555"))
body.append(field(20, 528, 335, "Precio máximo", "$9.000.000", ia=True))
body.append(button(20, 588, 335, 44, "Guardar y buscar"))
body.append(button(20, 644, 335, 44, "Ver estadísticas de mercado", primary=False,
                   icon=lambda x, cy: bars(x - 6, cy), name="Botón Ver estadísticas"))
body.append(nav(NAV_USUARIO, "Meta-S"))
svg("meta-busqueda-nueva v2 (texto + IA)", 375, 812, "".join(body))


# 2. Favoritos con listas ---------------------------------------------------------------
dots = "".join(f'<circle cx="{cx}" cy="49" r="2" fill="{DARK}"/>' for cx in (337, 344, 351))
body = [header("Favoritos", extra=group("Menú lista", dots))]
body.append(text(20, 100, "Mis listas", 13, 600))
body.append(text(355, 100, "+ Nueva lista", 13, 600, anchor="end"))
x = 20
chips = []
for label, on in (("Todos (4)", True), ("Para canje (2)", False), ("Familia (1)", False)):
    g, w = chip(x, 112, label, on)
    chips.append(g)
    x += w + 8
body.append(group("Listas", *chips))


def card(x, y, price, name, tag=None):
    parts = [rect(x, y, 163, 170, fill="#EFEFEF", stroke="#D0D0D0"), rect(x, y, 163, 110, fill=IMG)]
    if tag:
        w = tw(tag, 10) + 16
        parts += [rect(x + 8, y + 8, w, 20, fill="#FFFFFF", stroke="#BBBBBB", rx=10),
                  text(x + 8 + w / 2, y + 22, tag, 10, 600, DARK, "middle")]
    parts += [text(x + 12, y + 134, price, 14, 700), text(x + 12, y + 153, name, 12, 400, MID)]
    return group(f"Card {name}", *parts)


body.append(card(20, 160, "$8.500.000", "Toyota Corolla 2018", "Para canje"))
body.append(card(192, 160, "$9.200.000", "Ford Ranger 2020", "Para canje"))
body.append(card(20, 342, "$5.600.000", "VW Gol 2016", "Familia"))
body.append(card(192, 342, "$4.800.000", "Chevrolet Onix 2019"))
body.append(text(20, 548, "Tocá un vehículo para ver su publicación.", 12, 400, "#888888"))
body.append(text(20, 566, "Con ⋯ renombrás o eliminás la lista elegida.", 12, 400, "#888888"))
body.append(nav(NAV_USUARIO, "Cuenta"))
svg("favoritos v2 (listas)", 375, 812, "".join(body))


# 3. Guardar en lista (bottom sheet desde el detalle) ------------------------------------
body = [header("Detalle"), rect(0, 73, 375, 220, fill=IMG),
        text(20, 322, "Toyota Corolla 2018", 18, 700), text(20, 348, "$8.500.000", 16, 600),
        text(20, 372, "85.000 km · Mercedes, BA", 13, 400, MID),
        rect(0, 0, 375, 812, fill="#000000", opacity=0.45, id="Overlay")]
sheet = [rect(0, 430, 375, 400, fill="#FFFFFF", rx=16), rect(167, 442, 40, 4, fill="#CCCCCC", rx=2),
         text(20, 480, "Guardar en favoritos", 17, 700),
         text(20, 502, "Elegí una lista (opcional)", 13, 400, MID)]
for i, (label, on) in enumerate((("Sin lista (sólo en Todos)", False), ("Para canje", True), ("Familia", False))):
    cy = 540 + 48 * i
    opt = [f'<circle cx="32" cy="{cy}" r="9" fill="#FFFFFF" stroke="{DARK}" stroke-width="1.5"/>']
    if on:
        opt.append(f'<circle cx="32" cy="{cy}" r="5" fill="{DARK}"/>')
    opt += [text(52, cy + 5, label, 14, 600 if on else 400), line(20, cy + 24, 355, cy + 24)]
    sheet.append(group(f"Opción {label}", *opt))
sheet.append(text(20, 690, "+ Crear lista nueva", 14, 600))
sheet.append(button(20, 728, 335, 44, "Guardar"))
body.append(group("Bottom sheet", *sheet))
svg("guardar-en-lista (selector desde detalle)", 375, 812, "".join(body))


# 4. Widget "Asociate como mecánico" (va en el hero de la landing) -----------------------
wrench = (f'<circle cx="101" cy="15" r="5" fill="none" stroke="{DARK}" stroke-width="2"/>'
          f'<rect x="102" y="7.5" width="6" height="5" fill="#FFFFFF" transform="rotate(45 105 10)"/>'
          f'<path d="M97.5 18.5 L90 26" stroke="{DARK}" stroke-width="2.5" stroke-linecap="round"/>')
body = [rect(0.5, 0.5, 116, 78, fill="#FFFFFF", stroke=DARK, rx=6), group("Ícono llave", wrench),
        text(8, 17, "Asociate como", 11, 700), text(8, 30, "mecánico", 11, 700),
        text(8, 44, "Sumá tu taller y recibí", 8.5, 400, "#555555"),
        text(8, 54, "clientes de AutoCar.", 8.5, 400, "#555555"),
        group("Botón Quiero sumarme", rect(8, 60, 101, 14, fill=DARK, rx=3),
              text(58.5, 70, "Quiero sumarme", 8, 600, "#FFFFFF", "middle"))]
svg("widget Asociate como mecanico", 117, 79, "".join(body), bg="none")


# 5. Panel del taller (vista mecánico) ---------------------------------------------------
body = [group("Header", rect(0, 0, 375, 76, fill="#FFFFFF"), text(187.5, 44, "Mi taller", 17, 700, anchor="middle"),
              text(187.5, 63, "Taller San Martín · Mercedes", 12, 400, MID, "middle"), line(0, 76, 375, 76))]
body.append(group("Ingresar código",
                  rect(20, 92, 335, 96, fill=FIELD, stroke=LINE, rx=6),
                  text(32, 116, "Ingresar código de verificación", 13, 600),
                  rect(32, 128, 215, 44, fill="#FFFFFF", stroke="#CCCCCC", rx=4),
                  text(44, 155, "Ej: K7Q2-9MXA", 14, 400, LIGHT),
                  rect(255, 128, 88, 44, fill=DARK, rx=4),
                  text(299, 155, "Validar", 15, 600, "#FFFFFF", "middle")))
body.append(text(20, 222, "Vehículos asignados", 15, 700))
tabs = []
for i, (label, on) in enumerate((("Pendientes (2)", True), ("En inspección (1)", False), ("Aprobaciones (12)", False))):
    cx = 20 + 335 / 6 * (2 * i + 1)
    tabs.append(text(cx, 252, label, 12.5, 700 if on else 400, DARK if on else "#888888", "middle"))
    if on:
        tabs.append(rect(20 + 335 / 3 * i, 262, 335 / 3, 2, fill=DARK))
tabs.append(line(20, 264, 355, 264))
body.append(group("Tabs", *tabs))


def vehicle_row(y, title, l1, l2, state, style="outline", thumb=56, h=76):
    parts = [rect(20, y + 10, thumb, thumb, fill=IMG, rx=4),
             text(32 + thumb, y + 30, title, 14, 600),
             text(32 + thumb, y + 48, l1, 12, 400, MID)]
    if l2:
        parts.append(text(32 + thumb, y + 64, l2, 12, 400, MID))
    parts += [chip_right(355, y + 14, state, style), line(20, y + h, 355, y + h)]
    return group(f"Fila {title}", *parts)


body.append(vehicle_row(268, "Toyota Corolla 2018", "AB***12 · 85.000 km", "Solicitada 12/10 · Plan Oro −25 %", "Pendiente"))
body.append(vehicle_row(344, "VW Gol 2016", "AD***34 · 120.300 km", "Solicitada 13/10 · Plan Plata −15 %", "Pendiente"))
body.append(text(20, 448, "Últimas aprobaciones", 15, 700))
body.append(text(355, 448, "Ver todas", 12, 600, "#555555", "end"))
body.append(vehicle_row(458, "Chevrolet Onix 2019", "86/100 · Muy bueno · 08/10", None, "Aprobado", "dark", 44, 64))
body.append(vehicle_row(522, "Fiat Cronos 2021", "Falla crítica en frenos · 05/10", None, "Fallas críticas", "soft", 44, 64))
stats = []
for i, (val, lab) in enumerate((("14", "Este mes"), ("4,7 / 5", "Calificación"), ("92 %", "Aprobadas"))):
    x = 20 + i * (106.33 + 8)
    stats += [rect(x, 604, 106.33, 64, fill=FIELD, stroke=LINE, rx=6),
              text(x + 53.17, 634, val, 18, 700, anchor="middle"),
              text(x + 53.17, 654, lab, 11, 400, MID, "middle")]
body.append(group("Resumen", *stats))
body.append(nav(NAV_TALLER, "Panel"))
svg("taller-panel (vista mecanico)", 375, 812, "".join(body))


# 6. Inspección con checklist ------------------------------------------------------------
body = [header("Verificación K7Q2")]
body.append(group("Vehículo", rect(20, 88, 48, 48, fill=IMG, rx=4),
                  text(80, 108, "Ford Ranger 2020", 14, 700),
                  text(80, 127, "AE***56 · Plan Bronce −10 %", 12, 400, MID)))
body.append(group("Progreso", text(20, 168, "Paso 3 de 8 · Frenos", 12, 600, "#555555"),
                  text(355, 168, "3/8", 12, 600, "#555555", "end"),
                  rect(20, 176, 335, 6, fill="#E6E6E6", rx=3), rect(20, 176, 125.6, 6, fill=DARK, rx=3)))
body.append(field(20, 218, 335, "Kilometraje leído", "64.120 km"))
body.append(text(20, 274, "Declarado: 64.000 km · diferencia 0,2 % (dentro del margen)", 11, 400, MID))
body.append(text(20, 312, "Frenos", 15, 700))


def item(y, name, selected, critical=False):
    parts = [text(20, y, name, 14, 600)]
    if critical:
        x = 20 + len(name) * 14 * 0.52 + 10
        parts += [rect(x, y - 13, 52, 18, fill="#E6E6E6", rx=9), text(x + 26, y, "Crítico", 10, 700, DARK, "middle")]
    sw = 335 / 3
    for i, opt in enumerate(("OK", "Observado", "Falla")):
        on = opt == selected
        parts += [rect(20 + i * sw, y + 10, sw, 34, fill=DARK if on else "#FFFFFF", stroke="#BBBBBB",
                       rx=4),
                  text(20 + i * sw + sw / 2, y + 32, opt, 13, 600 if on else 400, "#FFFFFF" if on else DARK, "middle")]
    return group(f"Ítem {name}", *parts)


body.append(item(336, "Pastillas y discos", "OK", critical=True))
body.append(item(404, "Líquido de frenos", "Observado"))
body.append(group("Comentario", rect(20, 456, 335, 36, fill=FIELD, stroke="#CCCCCC", rx=4),
                  text(32, 479, "Nivel bajo, reponer antes de la entrega", 12, 400, DARK)))
body.append(item(516, "Freno de mano", None, critical=True))
body.append(group("Foto", rect(20, 574, 335, 52, fill="#FFFFFF", stroke="#999999", rx=4, dash="5 4"),
                  text(187.5, 605, "+ Agregar foto (opcional)", 13, 600, "#555555", "middle")))
body.append(text(20, 650, "Puntaje parcial: 82/100 · lo calcula el sistema", 12, 400, MID))
body.append(button(20, 664, 160, 44, "Anterior", primary=False))
body.append(button(195, 664, 160, 44, "Siguiente"))
body.append(text(20, 736, "Al completar el paso 8 se emite el informe y se", 11, 400, LIGHT))
body.append(text(20, 752, "publica en el aviso como «Verificado».", 11, 400, LIGHT))
svg("taller-verificacion (checklist)", 375, 812, "".join(body))


# 8. Mapa y lista de talleres (cliente) --------------------------------------------------
def pin(cx, cy, dark=True, label=None):
    c = DARK if dark else "#888888"
    p = (f'<path d="M{cx} {cy} C{cx-10} {cy-12} {cx-11} {cy-18} {cx-11} {cy-22} A11 11 0 1 1 {cx+11} {cy-22} '
         f'C{cx+11} {cy-18} {cx+10} {cy-12} {cx} {cy} Z" fill="{c}"/>'
         f'<circle cx="{cx}" cy="{cy-22}" r="4" fill="#FFFFFF"/>')
    if label:
        w = tw(label, 10) + 12
        p += rect(cx - w / 2, cy + 4, w, 18, fill="#FFFFFF", stroke="#BBBBBB", rx=9) + \
            text(cx, cy + 17, label, 10, 700, DARK, "middle")
    return group(f"Pin {label or ''}".strip(), p)


body = [header("Talleres adheridos")]
mapa = [rect(0, 73, 375, 287, fill="#E9E9E9")]
for i in range(1, 6):
    mapa.append(line(0, 73 + 48 * i, 375, 73 + 48 * i, "#DADADA", 6))
for i in range(1, 5):
    mapa.append(line(75 * i, 73, 75 * i, 360, "#DADADA", 6))
mapa += [pin(120, 180, label="−25 %"), pin(260, 150, label="−25 %"), pin(300, 300, label="−25 %"),
         f'<circle cx="190" cy="250" r="8" fill="#FFFFFF" stroke="{DARK}" stroke-width="3"/>',
         text(190, 278, "Vos", 11, 700, DARK, "middle")]
body.append(group("Mapa", *mapa))
fc = []
x = 20
for label in ("Hasta 10 km", "Calificación 4+", "Abierto ahora"):
    g, w = chip(x, 86, label, False, 11, 26)
    fc.append(g)
    x += w + 6
body.append(group("Filtros", *fc))
body.append(group("Beneficio", rect(20, 376, 335, 40, fill="#E6E6E6", rx=6),
                  text(32, 401, "Tu plan Oro: −25 % en cualquier taller adherido", 13, 600)))


def taller_row(y, name, l1, l2):
    return group(f"Taller {name}", text(20, y + 22, name, 15, 700), text(20, y + 41, l1, 12, 400, MID),
                 text(20, y + 58, l2, 12, 400, MID), chip_right(355, y + 10, "−25 %", "dark"),
                 text(355, y + 58, "Ver taller ›", 12, 600, DARK, "end"), line(20, y + 72, 355, y + 72))


body.append(taller_row(426, "Taller San Martín", "1,2 km · 4,7 / 5 · 128 verificaciones", "Lun a vie 8 a 18 h"))
body.append(taller_row(500, "Lubricentro Ruta 5", "3,4 km · 4,3 / 5 · 41 verificaciones", "Lun a sáb 8 a 13 h"))
body.append(taller_row(574, "Mecánica Don Pepe", "5,0 km · 4,8 / 5 · 77 verificaciones", "Lun a vie 9 a 19 h"))
body.append(text(187.5, 676, "Ver lista completa", 13, 600, DARK, "middle"))
body.append(nav(NAV_USUARIO, None))
svg("talleres (mapa y lista)", 375, 812, "".join(body))


# 9. Código de verificación (publicador) -------------------------------------------------
body = [header("Verificar vehículo")]
body.append(group("Vehículo", rect(20, 88, 48, 48, fill=IMG, rx=4), text(80, 108, "Toyota Corolla 2018", 14, 700),
                  text(80, 127, "AB***12 · 85.000 km", 12, 400, MID)))
body.append(text(187.5, 176, "Mostrá este código en el taller", 15, 600, DARK, "middle"))
body.append(group("Código", rect(48, 190, 279, 76, fill=FIELD, stroke=DARK, rx=8, sw=1.5),
                  text(187.5, 240, "K7Q2-9MXA", 34, 700, DARK, "middle")))
body.append(text(187.5, 290, "Vence el 14/11/2026 · un solo uso", 12, 400, MID, "middle"))
body.append(group("Taller elegido", rect(20, 310, 335, 98, fill="#FFFFFF", stroke=LINE, rx=6),
                  text(32, 336, "Taller San Martín", 15, 700),
                  text(32, 356, "Av. 29 n.º 1234, Mercedes · Lun a vie 8 a 18 h", 12, 400, MID),
                  text(32, 376, "Tel. (02324) 42-1234", 12, 400, MID),
                  chip_right(343, 322, "−25 % plan Oro", "dark"),
                  text(343, 396, "Llamar ›", 12, 600, DARK, "end")))
body.append(text(20, 438, "Cómo sigue", 15, 700))
for i, ln in enumerate(("Llamá al taller para coordinar el horario.",
                        "Llevá el vehículo y mostrá el código.",
                        "El mecánico revisa el auto con el checklist.",
                        "El informe aparece en tu aviso al terminar.")):
    y = 470 + 34 * i
    body.append(group(f"Paso {i+1}", f'<circle cx="32" cy="{y-5}" r="11" fill="{DARK}"/>',
                      text(32, y - 1, str(i + 1), 12, 700, "#FFFFFF", "middle"), text(52, y, ln, 13)))
body.append(button(20, 616, 335, 44, "Cancelar solicitud", primary=False))
body.append(nav(NAV_USUARIO, "Publicar"))
svg("verificar-vehiculo (codigo)", 375, 812, "".join(body))


# 10. Informe público de verificación -----------------------------------------------------
body = [header("Informe de verificación")]
body.append(text(20, 102, "Chevrolet Onix 2019 · AC***78", 15, 700))
body.append(group("Resultado", rect(20, 116, 335, 104, fill=FIELD, stroke=LINE, rx=8),
                  text(36, 178, "86", 44, 700), text(94, 178, "/100", 16, 600, MID),
                  chip_right(343, 130, "Muy bueno", "dark", 12),
                  text(36, 204, "Taller San Martín · 08/10/2026 · vigente hasta 06/01/2027", 11, 400, MID)))
body.append(group("Kilometraje", text(20, 248, "Kilometraje", 13, 600),
                  text(355, 248, "Leído 62.300 · declarado 62.000 (0,5 %)", 12, 400, MID, "end")))
body.append(line(20, 262, 355, 262))
cats = (("Motor", "3 OK · 1 observado"), ("Transmisión", "3 OK"), ("Frenos", "3 OK · 1 observado"),
        ("Suspensión y dirección", "2 OK · 1 observado"), ("Neumáticos", "1 OK · 2 observados"),
        ("Carrocería y estructura", "2 OK · 1 observado"), ("Interior", "2 OK · 1 observado"),
        ("Electricidad", "3 OK"))
rows = []
for i, (cat, res) in enumerate(cats):
    y = 262 + 44 * i
    rows += [text(20, y + 28, cat, 14, 600), text(330, y + 28, res, 12, 400, MID, "end"),
             text(355, y + 28, "›", 16, 400, MID, "end"), line(20, y + 44, 355, y + 44)]
body.append(group("Categorías", *rows))
fotos = []
for i, lab in enumerate(("Odómetro", "Motor", "N.º de chasis")):
    x = 20 + i * 115
    fotos += [rect(x, 630, 105, 70, fill=IMG, rx=4), text(x + 52.5, 716, lab, 11, 400, MID, "middle")]
body.append(group("Fotos", *fotos))
body.append(text(187.5, 742, "Reportar informe", 12, 600, "#555555", "middle"))
svg("verificacion-informe (publico)", 375, 760, "".join(body))


# 11. Detalle de vehículo con badge "Verificado" ------------------------------------------
heart = (f'<path d="M343 56 C330 46 331 38 337 38 C340 38 342 40 343 42 C344 40 346 38 349 38 C355 38 356 46 343 56 Z" '
         f'fill="none" stroke="{DARK}" stroke-width="1.8"/>')
body = [header("Detalle", extra=group("Favorito", heart)), rect(0, 73, 375, 200, fill=IMG, id="Galería")]
body += [text(20, 302, "Chevrolet Onix 2019", 18, 700), text(20, 328, "$4.800.000", 16, 600),
         text(20, 350, "62.300 km · Mercedes, BA", 13, 400, MID)]
tick = (f'<circle cx="44" cy="398" r="12" fill="{DARK}"/><path d="M38.5 398 L42.5 402 L49.5 394" stroke="#FFFFFF" '
        f'stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
body.append(group("Badge Verificado", rect(20, 368, 335, 60, fill=FIELD, stroke=DARK, rx=8), tick,
                  text(66, 394, "Verificado · 86/100", 14, 700),
                  text(66, 413, "Muy bueno · Taller San Martín · 08/10", 12, 400, MID),
                  text(343, 404, "Ver informe ›", 12, 600, DARK, "end")))
body.append(text(20, 458, "Ficha técnica", 15, 700))
for i, (k, v) in enumerate((("Año", "2019"), ("Kilometraje", "62.300 km (leído en la verificación)"),
                            ("Combustible", "Nafta"), ("Estado", "Muy bueno (verificado)"))):
    y = 484 + 24 * i
    body.append(group(f"Ficha {k}", text(20, y, k, 13, 400, MID), text(130, y, v, 13, 400, DARK)))
body.append(group("Tasación", rect(20, 586, 335, 50, fill="#FFFFFF", stroke=LINE, rx=6),
                  text(32, 608, "Tasación de referencia: $4,5 M a $5,0 M", 13, 600),
                  text(32, 626, "Calculada con el estado verificado", 11, 400, MID)))
body.append(button(20, 648, 162, 44, "Consultar"))
body.append(button(193, 648, 162, 44, "Proponer canje", primary=False))
body.append(nav(NAV_USUARIO, "Home"))
svg("vehiculo-detalle v2 (badge verificado)", 375, 812, "".join(body))


# 12. Formulario de adhesión de talleres --------------------------------------------------
H = 980
body = [header("Adherir mi taller")]
body.append(text(20, 100, "Sumate a la red de talleres de AutoCar.", 13, 400, "#555555"))
body.append(text(20, 118, "Revisamos cada solicitud antes de activarla.", 13, 400, "#555555"))
y = 160
for label, ph, w in (("Nombre del taller", "Ej: Taller San Martín", 335), ("CUIT", "30-12345678-9", 335),
                     ("Dirección", "Calle, número y localidad", 335)):
    body.append(field(20, y, w, label, placeholder=ph))
    y += 66
body.append(group("Mapa dirección", rect(20, y - 18, 335, 90, fill="#E9E9E9", rx=4),
                  pin(187.5, y + 40), text(187.5, y + 66, "Ajustá el punto en el mapa", 11, 400, MID, "middle")))
y += 104
body.append(field(20, y, 160, "Teléfono", placeholder="(02324) 42-1234"))
body.append(field(195, y, 160, "Horarios", placeholder="Lun a vie 8 a 18"))
y += 66
for label, ph in (("Nombre del responsable", "Nombre y apellido"), ("Email", "taller@ejemplo.com"),
                  ("Contraseña", "Mínimo 8 caracteres")):
    body.append(field(20, y, 335, label, placeholder=ph))
    y += 66
body.append(group("Condiciones", rect(20, y - 6, 20, 20, fill="#FFFFFF", stroke=DARK, rx=3, sw=1.5),
                  text(50, y + 9, "Acepto las condiciones de adhesión: descuentos", 12),
                  text(50, y + 27, "por plan y uso del checklist de AutoCar.", 12)))
y += 52
body.append(button(20, y, 335, 44, "Enviar solicitud"))
body.append(text(187.5, y + 70, "La cuenta queda pendiente hasta que la apruebe un administrador.", 11, 400, MID, "middle"))
svg("talleres-adherirse (formulario)", 375, H, "".join(body))


# 13. Administración de talleres ----------------------------------------------------------
body = [header("Talleres")]
tabs = []
for i, (label, on) in enumerate((("Pendientes (2)", True), ("Activos (8)", False), ("Suspendidos (1)", False))):
    cx = 20 + 335 / 6 * (2 * i + 1)
    tabs.append(text(cx, 106, label, 13, 700 if on else 400, DARK if on else "#888888", "middle"))
    if on:
        tabs.append(rect(20 + 335 / 3 * i, 116, 335 / 3, 2, fill=DARK))
tabs.append(line(20, 118, 355, 118))
body.append(group("Tabs", *tabs))


def solicitud(y, name, cuit, extra):
    return group(f"Solicitud {name}", rect(20, y, 335, 150, fill="#FFFFFF", stroke=LINE, rx=6),
                 text(32, y + 28, name, 15, 700), text(32, y + 48, cuit, 12, 400, MID),
                 text(32, y + 66, extra, 12, 400, MID),
                 text(343, y + 28, "Ver detalle ›", 12, 600, DARK, "end"),
                 field(32, y + 80, 311, None, placeholder="Motivo (si se rechaza)", h=28, name="Motivo"),
                 rect(32, y + 116, 150, 26, fill=DARK, rx=4), text(107, y + 134, "Aprobar", 13, 600, "#FFFFFF", "middle"),
                 rect(193, y + 116, 150, 26, fill="#FFFFFF", stroke=DARK, rx=4),
                 text(268, y + 134, "Rechazar", 13, 600, DARK, "middle"))


body.append(solicitud(134, "Lubricentro Ruta 5", "CUIT 30-71234567-8 · Mercedes", "Solicitado 14/10 · Responsable: Ana Gómez"))
body.append(solicitud(300, "Mecánica Don Pepe", "CUIT 20-28765432-1 · Luján", "Solicitado 15/10 · Responsable: José Pérez"))
body.append(text(20, 488, "Los talleres activos se pueden suspender desde su detalle,", 12, 400, MID))
body.append(text(20, 506, "con motivo; las verificaciones emitidas se conservan.", 12, 400, MID))
svg("admin-talleres (aprobacion)", 375, 560, "".join(body))


# 14. Cartel con las mejoras de la devolución del profe -----------------------------------
def check(x, y, done):
    box = rect(x, y - 13, 16, 16, fill="#FFFFFF" if not done else DARK, stroke=DARK, rx=3, sw=1.5)
    if not done:
        return box
    return box + (f'<path d="M{x+3.5} {y-5} L{x+6.8} {y-1.8} L{x+12.5} {y-9}" stroke="#FFFFFF" '
                  f'stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')


items_done = [["Talleres mecánicos adheridos: mapa de talleres", "con el descuento según el plan del suscriptor."],
              ["Pedido de verificación con código para el taller."],
              ["Vista del mecánico: vehículos asignados,", "inspección con checklist y aprobaciones."],
              ["Informe público y badge «Verificado» en el aviso;", "la tasación usa el estado verificado."],
              ["Adhesión de talleres y aprobación del admin."],
              ["Widget «Asociate como mecánico» en la landing."],
              ["Nueva búsqueda: texto libre + IA que", "completa el formulario."],
              ["Favoritos organizados en listas."]]
items_todo = [["Concesionarias como usuarias de la app", "(perfil de agencia, plan para empresas)."],
              ["Confirmar con docentes: quién fija el descuento,", "inspección precompra y vigencia del informe."]]
body = [text(24, 44, "Mejoras — devolución del profe", 22, 700, "#222222"),
        text(24, 68, "Octubre 2026 · estado de cada cambio en el diseño", 13, 400, "#5C5320")]
y = 104
for title, items, done in (("HECHO", items_done, True), ("PENDIENTE", items_todo, False)):
    body.append(text(24, y, title, 12, 700, "#5C5320"))
    y += 26
    for lines in items:
        parts = [check(24, y, done)]
        for i, ln in enumerate(lines):
            parts.append(text(50, y + 20 * i, ln, 14, 400, "#222222"))
        body.append(group(("✓ " if done else "☐ ") + lines[0], *parts))
        y += 20 * len(lines) + 12
    y += 14
body.append(text(24, y + 6, "Detalle en el repo: Entrega_2/talleres-adheridos.md y wireframes.md § 5", 12, 400, "#5C5320"))
H = y + 32
body.insert(0, rect(0, 0, 460, H, fill="#FFF1A8", rx=10, id="Nota"))
svg("cartel devolucion del profe", 460, H, "".join(body), bg="none")
print("ok")
