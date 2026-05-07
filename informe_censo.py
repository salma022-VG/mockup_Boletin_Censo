"""
Informe de Catastro Distrital de Bogotá D.C.
Agrega y analiza los datos de los archivos datos_YYYY.json (2012-2026)
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# ─── Configuración ────────────────────────────────────────────────────────────
DIRECTORIO = Path(__file__).parent
AÑOS = list(range(2012, 2027))

SEPARADOR_SIMPLE = "─" * 72
SEPARADOR_DOBLE  = "═" * 72

# ─── Carga de datos ───────────────────────────────────────────────────────────

def cargar_año(año: int) -> list[dict]:
    ruta = DIRECTORIO / f"datos_{año}.json"
    if not ruta.exists():
        return []
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)

def sufijo(año: int) -> str:
    return str(año % 100).zfill(2)

def campo(nombre: str, año: int) -> str:
    return f"{nombre}_{sufijo(año)}"

# ─── Agregación ───────────────────────────────────────────────────────────────

def agregar_datos() -> dict:
    """
    Devuelve un diccionario con tres niveles de agregación:
      - por_año          : {año: {total_predios, total_avaluo, total_terreno, total_construida}}
      - por_año_localidad: {año: {localidad: {predios, avaluo, terreno, construida}}}
      - por_año_grupo    : {año: {grupo: {predios, avaluo}}}
    """
    por_año            = {}
    por_año_localidad  = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    por_año_grupo      = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))

    for año in AÑOS:
        registros = cargar_año(año)
        if not registros:
            continue

        totales = {"predios": 0, "avaluo": 0.0, "terreno": 0.0, "construida": 0.0}

        for r in registros:
            p  = r.get(campo("PREDIOS",        año), 0) or 0
            av = r.get(campo("VALOR_AVALUO",    año), 0) or 0
            te = r.get(campo("AREA_TERRENO",    año), 0) or 0
            co = r.get(campo("AREA_CONSTRUIDA", año), 0) or 0

            loc   = r.get("NOMBRE_LOCALIDAD", "DESCONOCIDA")
            grupo = r.get("GRUPO_ECONOMICO",  "DESCONOCIDO")

            totales["predios"]    += p
            totales["avaluo"]     += av
            totales["terreno"]    += te
            totales["construida"] += co

            por_año_localidad[año][loc]["predios"]    += p
            por_año_localidad[año][loc]["avaluo"]     += av
            por_año_localidad[año][loc]["terreno"]    += te
            por_año_localidad[año][loc]["construida"] += co

            por_año_grupo[año][grupo]["predios"] += p
            por_año_grupo[año][grupo]["avaluo"]  += av

        por_año[año] = totales

    return {
        "por_año":           por_año,
        "por_año_localidad": por_año_localidad,
        "por_año_grupo":     por_año_grupo,
    }

# ─── Formateo de números ──────────────────────────────────────────────────────

def fmt_cop(valor_pesos: float) -> str:
    """Convierte pesos a billones o miles de millones, con símbolo COP."""
    b = valor_pesos / 1e12
    if b >= 1:
        return f"${b:,.2f} B COP"
    mm = valor_pesos / 1e9
    return f"${mm:,.1f} MM COP"

def fmt_num(n: float, decimales: int = 0) -> str:
    fmt = f"{{:,.{decimales}f}}"
    return fmt.format(n)

def fmt_area(m2: float) -> str:
    ha = m2 / 10_000
    return f"{ha:,.1f} ha"

def pct(parte: float, total: float) -> str:
    if total == 0:
        return "  0.0 %"
    return f"{100 * parte / total:5.1f} %"

# ─── Bloques del informe ──────────────────────────────────────────────────────

def encabezado():
    print(SEPARADOR_DOBLE)
    print("  INFORME DE CATASTRO DISTRITAL – BOGOTÁ D.C.")
    print("  Período 2012 – 2026  |  Fuente: Catastro Distrital de Bogotá")
    print(SEPARADOR_DOBLE)
    print()

def seccion_evolucion(por_año: dict):
    años_presentes = sorted(por_año.keys())
    print(SEPARADOR_DOBLE)
    print("  1. EVOLUCIÓN ANUAL DE PREDIOS Y AVALÚO CATASTRAL")
    print(SEPARADOR_DOBLE)
    print()
    ancho_col = 16

    # Encabezado de tabla
    print(f"  {'AÑO':<6} {'PREDIOS':>{ancho_col}} {'AVALÚO CATASTRAL':>{ancho_col+4}}"
          f"  {'ÁREA TERRENO':>{ancho_col}} {'ÁREA CONSTRUIDA':>{ancho_col}}")
    print(f"  {SEPARADOR_SIMPLE}")

    base_predios = por_año[años_presentes[0]]["predios"]
    base_avaluo  = por_año[años_presentes[0]]["avaluo"]

    for año in años_presentes:
        d = por_año[año]
        crecimiento_p  = f"({pct(d['predios']  - base_predios, base_predios)})" if año > años_presentes[0] else ""
        crecimiento_av = f"({pct(d['avaluo']   - base_avaluo,  base_avaluo )})" if año > años_presentes[0] else ""
        print(
            f"  {año:<6}"
            f"  {fmt_num(d['predios']):>{ancho_col}}"
            f"  {fmt_cop(d['avaluo']):>{ancho_col+4}}"
            f"  {fmt_area(d['terreno']):>{ancho_col}}"
            f"  {fmt_area(d['construida']):>{ancho_col}}"
        )

    print()
    # Resumen variación total
    primero = por_año[años_presentes[0]]
    ultimo  = por_año[años_presentes[-1]]
    print(f"  Variación acumulada {años_presentes[0]}→{años_presentes[-1]}:")
    print(f"    Predios           : {fmt_num(primero['predios'])} → {fmt_num(ultimo['predios'])}"
          f"  ({pct(ultimo['predios'] - primero['predios'], primero['predios'])} de crecimiento)")
    print(f"    Avalúo catastral  : {fmt_cop(primero['avaluo'])} → {fmt_cop(ultimo['avaluo'])}"
          f"  ({pct(ultimo['avaluo'] - primero['avaluo'], primero['avaluo'])} de crecimiento)")
    print(f"    Área construida   : {fmt_area(primero['construida'])} → {fmt_area(ultimo['construida'])}"
          f"  ({pct(ultimo['construida'] - primero['construida'], primero['construida'])} de crecimiento)")
    print()

def seccion_localidades(por_año_localidad: dict, año_ref: int = 2026):
    datos = por_año_localidad.get(año_ref, {})
    if not datos:
        print(f"  Sin datos para {año_ref}\n")
        return

    total_avaluo  = sum(v["avaluo"]  for v in datos.values())
    total_predios = sum(v["predios"] for v in datos.values())

    ranking = sorted(datos.items(), key=lambda x: x[1]["avaluo"], reverse=True)

    print(SEPARADOR_DOBLE)
    print(f"  2. RANKING DE LOCALIDADES POR AVALÚO CATASTRAL  (año {año_ref})")
    print(SEPARADOR_DOBLE)
    print()
    print(f"  {'#':<4} {'LOCALIDAD':<30} {'AVALÚO':>18}  {'% DEL TOTAL':>10}  {'PREDIOS':>10}")
    print(f"  {SEPARADOR_SIMPLE}")

    for i, (loc, v) in enumerate(ranking, 1):
        print(
            f"  {i:<4} {loc:<30} {fmt_cop(v['avaluo']):>18}"
            f"  {pct(v['avaluo'], total_avaluo):>10}"
            f"  {fmt_num(v['predios']):>10}"
        )

    print()
    print(f"  Total Bogotá D.C.: {fmt_cop(total_avaluo)}  |  {fmt_num(total_predios)} predios")
    print()

def seccion_grupos(por_año_grupo: dict):
    años = sorted(por_año_grupo.keys())
    if not años:
        return

    año_ini = años[0]
    año_fin = años[-1]

    grupos_fin = por_año_grupo[año_fin]
    total_av   = sum(v["avaluo"]  for v in grupos_fin.values())
    total_pr   = sum(v["predios"] for v in grupos_fin.values())

    ranking = sorted(grupos_fin.items(), key=lambda x: x[1]["avaluo"], reverse=True)

    print(SEPARADOR_DOBLE)
    print(f"  3. DISTRIBUCIÓN POR GRUPO ECONÓMICO  ({año_ini} vs {año_fin})")
    print(SEPARADOR_DOBLE)
    print()
    print(f"  {'GRUPO':<40} {'AVALÚO ' + str(año_fin):>18}  {'% AV':>6}  {'PREDIOS ' + str(año_fin):>12}")
    print(f"  {SEPARADOR_SIMPLE}")

    for grupo, v in ranking:
        grupo_corto = grupo[:38]
        print(
            f"  {grupo_corto:<40} {fmt_cop(v['avaluo']):>18}"
            f"  {pct(v['avaluo'], total_av):>6}"
            f"  {fmt_num(v['predios']):>12}"
        )

    print()
    print(f"  Total: {fmt_cop(total_av)}  |  {fmt_num(total_pr)} predios")
    print()

    # Variación por grupo
    print(f"  Crecimiento de avalúo por grupo ({año_ini} → {año_fin}):")
    print(f"  {'GRUPO':<40} {'AVALÚO ' + str(año_ini):>16}  {'AVALÚO ' + str(año_fin):>16}  {'CREC.':>8}")
    print(f"  {SEPARADOR_SIMPLE}")

    grupos_ini = por_año_grupo[año_ini]
    todos_grupos = sorted(set(list(grupos_ini.keys()) + list(grupos_fin.keys())))

    for grupo in todos_grupos:
        av_ini = grupos_ini.get(grupo, {}).get("avaluo", 0)
        av_fin = grupos_fin.get(grupo, {}).get("avaluo", 0)
        crec   = pct(av_fin - av_ini, av_ini) if av_ini else "  N/D  "
        print(
            f"  {grupo[:38]:<40} {fmt_cop(av_ini):>16}"
            f"  {fmt_cop(av_fin):>16}  {crec:>8}"
        )
    print()

def seccion_top_localidad_por_año(por_año_localidad: dict):
    años = sorted(por_año_localidad.keys())

    print(SEPARADOR_DOBLE)
    print("  4. LOCALIDAD CON MAYOR AVALÚO POR AÑO")
    print(SEPARADOR_DOBLE)
    print()
    print(f"  {'AÑO':<6} {'LOCALIDAD':<30} {'AVALÚO':>18}  {'PREDIOS':>10}")
    print(f"  {SEPARADOR_SIMPLE}")

    for año in años:
        datos = por_año_localidad[año]
        if not datos:
            continue
        top_loc, top_v = max(datos.items(), key=lambda x: x[1]["avaluo"])
        print(
            f"  {año:<6} {top_loc:<30} {fmt_cop(top_v['avaluo']):>18}"
            f"  {fmt_num(top_v['predios']):>10}"
        )
    print()

def seccion_densidad(por_año_localidad: dict, año_ref: int = 2026):
    datos = por_año_localidad.get(año_ref, {})
    if not datos:
        return

    # Avalúo promedio por predio (densidad de valor)
    ranking = []
    for loc, v in datos.items():
        if v["predios"] > 0:
            ratio = v["avaluo"] / v["predios"]
            ranking.append((loc, ratio, v["predios"]))

    ranking.sort(key=lambda x: x[1], reverse=True)

    print(SEPARADOR_DOBLE)
    print(f"  5. AVALÚO PROMEDIO POR PREDIO – LOCALIDADES  (año {año_ref})")
    print(SEPARADOR_DOBLE)
    print()
    print(f"  {'#':<4} {'LOCALIDAD':<30} {'AVG AVALÚO / PREDIO':>22}  {'PREDIOS':>10}")
    print(f"  {SEPARADOR_SIMPLE}")

    for i, (loc, ratio, predios) in enumerate(ranking, 1):
        print(
            f"  {i:<4} {loc:<30} {fmt_cop(ratio):>22}"
            f"  {fmt_num(predios):>10}"
        )
    print()

def seccion_clase_predio(año_ref: int = 2026):
    """Distribución por CLASE_PREDIO (N=Normal, R=Rural, etc.) en el año de referencia."""
    registros = cargar_año(año_ref)
    if not registros:
        return

    conteo = defaultdict(lambda: {"predios": 0, "avaluo": 0.0})
    for r in registros:
        clase = r.get("CLASE_PREDIO", "?")
        conteo[clase]["predios"] += r.get(campo("PREDIOS",     año_ref), 0) or 0
        conteo[clase]["avaluo"]  += r.get(campo("VALOR_AVALUO", año_ref), 0) or 0

    total_av = sum(v["avaluo"]  for v in conteo.values())
    total_pr = sum(v["predios"] for v in conteo.values())

    clases_desc = {"N": "Urbano (Normal)", "R": "Rural", "M": "Mixto", "L": "Lote"}

    print(SEPARADOR_DOBLE)
    print(f"  6. DISTRIBUCIÓN POR CLASE DE PREDIO  (año {año_ref})")
    print(SEPARADOR_DOBLE)
    print()
    print(f"  {'CLASE':<24} {'AVALÚO':>18}  {'% AV':>6}  {'PREDIOS':>12}  {'% PR':>6}")
    print(f"  {SEPARADOR_SIMPLE}")

    for clase, v in sorted(conteo.items(), key=lambda x: x[1]["avaluo"], reverse=True):
        desc = clases_desc.get(clase, clase)
        print(
            f"  {desc:<24} {fmt_cop(v['avaluo']):>18}"
            f"  {pct(v['avaluo'], total_av):>6}"
            f"  {fmt_num(v['predios']):>12}"
            f"  {pct(v['predios'], total_pr):>6}"
        )
    print()

def pie_de_pagina():
    print(SEPARADOR_DOBLE)
    print("  Notas metodológicas:")
    print("  · Valores de avalúo expresados en pesos colombianos corrientes de cada año.")
    print("  · MM COP = miles de millones de pesos  |  B COP = billones de pesos.")
    print("  · Las áreas se expresan en hectáreas (ha).")
    print("  · LOTES registra cero predios desde 2021 (reclasificación catastral).")
    print("  · Fuente: Catastro Distrital de Bogotá – archivos datos_YYYY.json.")
    print(SEPARADOR_DOBLE)
    print()

# ─── Punto de entrada ─────────────────────────────────────────────────────────

def main():
    print()
    encabezado()

    print("  Cargando y procesando datos...")
    datos = agregar_datos()
    años_disponibles = sorted(datos["por_año"].keys())

    if not años_disponibles:
        print("  ERROR: No se encontraron archivos de datos.")
        return

    print(f"  Años encontrados: {años_disponibles[0]} – {años_disponibles[-1]}"
          f"  ({len(años_disponibles)} archivos)\n")

    seccion_evolucion(datos["por_año"])
    seccion_localidades(datos["por_año_localidad"], año_ref=años_disponibles[-1])
    seccion_grupos(datos["por_año_grupo"])
    seccion_top_localidad_por_año(datos["por_año_localidad"])
    seccion_densidad(datos["por_año_localidad"], año_ref=años_disponibles[-1])
    seccion_clase_predio(año_ref=años_disponibles[-1])
    pie_de_pagina()


if __name__ == "__main__":
    main()
