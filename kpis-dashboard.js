(function () {
  "use strict";

  const SHEET_ID = "1le0b37MzYrWxfWt3r__QdiWDasLC1u_e6v9Exluttrc";
  const GID_ENTREVISTAS = "1342787691";

  const GVIZ_SOURCES = {
    entrevistasPivot: {
      gid: GID_ENTREVISTAS,
      tq: "select C, count(A) group by C pivot I",
    },
    muestrasRecibidasPorEstacion: {
      sheet: "Recepción de Muestra de Test FIT",
      tq: "select G, count(E) where E is not null group by G",
    },
    muestrasALabPorEstacion: {
      sheet: "Entrega de Muestras de FIT a Lab",
      tq: "select B, sum(D) where D is not null group by B",
    },
    resultadosFitPorEstacion: {
      sheet: "Recepción de Resultados de FIT",
      tq: "select C, count(A) where C is not null and F is not null group by C pivot F",
    },
  };

  const STATION_LABELS = {
    saavedra: "Parque Saavedra",
    rivadavia: "Parque Rivadavia",
    chacabuco: "Parque Chacabuco",
    aristobulo: "Aristóbulo del Valle",
  };
  const BASE_STATION_KEYS = Object.keys(STATION_LABELS);

  const STOCK_INICIAL_POR_ESTACION = 75;
  const STOCK_UMBRAL = 20;

  const ECHARTS_CDN =
    "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js";

  const SELECTORS = {
    root: "[data-kpi-dashboard]",
    bars: "[data-kpi-chart-bars]",
    sankey: "[data-kpi-chart-flow]",
    posneg: "[data-kpi-chart-posneg]",
  };

  function initKpiDashboard() {
    const root = document.querySelector(SELECTORS.root);
    if (!root) {
      return;
    }

    renderLoading(root);

    loadAllDataSources()
      .then((payload) => {
        const model = buildModel(payload);
        renderDashboard(root, model);
        return renderCharts(root, model);
      })
      .catch((error) => {
        console.error(
          "[KPI Dashboard] No se pudo construir el dashboard con datos agregados.",
          error,
        );
        renderEmptyState(root);
      });
  }

  async function loadAllDataSources() {
    const entries = Object.entries(GVIZ_SOURCES);
    const settled = await Promise.allSettled(
      entries.map(([, source]) => fetchCsv(gvizUrl(source))),
    );

    const matrices = {};
    const status = {};

    settled.forEach((result, index) => {
      const sourceKey = entries[index][0];
      if (result.status === "fulfilled") {
        matrices[sourceKey] = parseCsv(result.value);
        status[sourceKey] = "ok";
        return;
      }

      matrices[sourceKey] = null;
      status[sourceKey] = "error";
      console.warn(
        "[KPI Dashboard] Fuente no disponible:",
        sourceKey,
        result.reason,
      );
    });

    return { matrices, status };
  }

  function gvizUrl({ sheet, gid, tq }) {
    const params = ["tqx=out:csv"];
    if (sheet) {
      params.push("sheet=" + encodeURIComponent(sheet));
    }
    if (gid) {
      params.push("gid=" + encodeURIComponent(String(gid)));
    }
    if (tq) {
      params.push("tq=" + encodeURIComponent(tq));
    }
    params.push("cb=" + Date.now());
    return (
      "https://docs.google.com/spreadsheets/d/" +
      SHEET_ID +
      "/gviz/tq?" +
      params.join("&")
    );
  }

  function renderLoading(root) {
    root.innerHTML =
      '<div class="kpiDash__loading"><h3>Construyendo tablero local</h3><p>Sincronizando participantes y flujo FIT con fuentes agregadas.</p></div>';
  }

  function renderEmptyState(root) {
    root.innerHTML = [
      '<div class="kpiDash__empty" role="status">',
      "<h3>Tablero temporalmente sin datos</h3>",
      "<p>No fue posible leer las fuentes agregadas por estación. Verificá permisos y consultas GViz.</p>",
      "</div>",
    ].join("");
  }

  async function fetchCsv(url) {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Respuesta HTTP " + response.status);
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      throw new Error("CSV vacío");
    }

    return text;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          cell += '"';
          i += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n") {
        row.push(cell);
        if (row.some((value) => String(value).trim() !== "")) {
          rows.push(row);
        }
        row = [];
        cell = "";
      } else if (char !== "\r") {
        cell += char;
      }
    }

    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }
    }

    return rows;
  }

  function buildModel(payload) {
    const matrices = payload.matrices || {};
    const status = payload.status || {};

    const stationsMap = new Map();

    BASE_STATION_KEYS.forEach((key) => {
      ensureStation(stationsMap, key, STATION_LABELS[key]);
    });

    applyEntrevistasPivot(stationsMap, matrices.entrevistasPivot, status.entrevistasPivot);
    applyMuestrasRecibidas(
      stationsMap,
      matrices.muestrasRecibidasPorEstacion,
      status.muestrasRecibidasPorEstacion,
    );
    applyMuestrasALab(
      stationsMap,
      matrices.muestrasALabPorEstacion,
      status.muestrasALabPorEstacion,
    );
    applyResultadosFitPorEstacion(
      stationsMap,
      matrices.resultadosFitPorEstacion,
      status.resultadosFitPorEstacion,
    );

    const stations = Array.from(stationsMap.values())
      .map((station) => {
        const entregados = station.criterioFitKits;
        const remanente = Math.max(0, station.stockInicial - entregados);

        return {
          station: station.station,
          key: station.key,
          participantesTotal: station.participantesTotal,
          criterioFitKits: station.criterioFitKits,
          fueraDeScreening: station.fueraDeScreening,
          seguimientoVigente: station.seguimientoVigente,
          mayorRiesgo: station.mayorRiesgo,
          edadLt45: station.edadLt45,
          muestrasRecibidas: station.muestrasRecibidas,
          muestrasALab: station.muestrasALab,
          resultadosFitRecibidos: station.resultadosFitRecibidos,
          fitInformados: station.fitInformados,
          resultadosFitNegativos: station.resultadosFitNegativos,
          resultadosFitPositivos: station.resultadosFitPositivos,
          stockInicial: station.stockInicial,
          entregados,
          remanente,
        };
      })
      .filter((station) => {
        const hasOperationalData =
          station.participantesTotal > 0 ||
          station.stockInicial > 0 ||
          (typeof station.muestrasRecibidas === "number" && station.muestrasRecibidas > 0) ||
          (typeof station.muestrasALab === "number" && station.muestrasALab > 0) ||
          (typeof station.resultadosFitRecibidos === "number" &&
            station.resultadosFitRecibidos > 0);
        return hasOperationalData;
      })
      .sort((a, b) => {
        if (b.participantesTotal !== a.participantesTotal) {
          return b.participantesTotal - a.participantesTotal;
        }
        return a.station.localeCompare(b.station, "es");
      });

    const totals = {
      participantesTotal: sumField(stations, "participantesTotal"),
      criterioFitKits: sumField(stations, "criterioFitKits"),
      fueraDeScreening: sumField(stations, "fueraDeScreening"),
      seguimientoVigente: sumField(stations, "seguimientoVigente"),
      mayorRiesgo: sumField(stations, "mayorRiesgo"),
      edadLt45: sumField(stations, "edadLt45"),
      muestrasRecibidas:
        status.muestrasRecibidasPorEstacion === "ok"
          ? sumNullableField(stations, "muestrasRecibidas")
          : null,
      muestrasALab:
        status.muestrasALabPorEstacion === "ok"
          ? sumNullableField(stations, "muestrasALab")
          : null,
      resultadosFitRecibidos:
        status.resultadosFitPorEstacion === "ok"
          ? sumNullableField(stations, "resultadosFitRecibidos")
          : null,
      fitInformados:
        status.resultadosFitPorEstacion === "ok"
          ? sumNullableField(stations, "fitInformados")
          : null,
      resultadosFitNegativos:
        status.resultadosFitPorEstacion === "ok"
          ? sumNullableField(stations, "resultadosFitNegativos")
          : null,
      resultadosFitPositivos:
        status.resultadosFitPorEstacion === "ok"
          ? sumNullableField(stations, "resultadosFitPositivos")
          : null,
      stockInicial: STOCK_INICIAL_POR_ESTACION * BASE_STATION_KEYS.length,
      entregados: sumField(stations, "entregados"),
      remanente: sumField(stations, "remanente"),
    };

    const fitFlowTotals = {
      kitsEntregadosTotal: totals.criterioFitKits,
      muestrasRecibidasTotal: totals.muestrasRecibidas,
      muestrasALabTotal: totals.muestrasALab,
      resultadosRecibidosTotal: totals.resultadosFitRecibidos,
      resultadosInformadosTotal: totals.fitInformados,
      positivos: totals.resultadosFitPositivos,
      negativos: totals.resultadosFitNegativos,
    };

    return {
      stations,
      totals,
      fitFlowTotals,
      sourceStatus: status,
    };
  }

  function ensureStation(stationsMap, stationKey, rawLabel) {
    const safeKey = normalizeStationKey(stationKey || rawLabel);
    if (!safeKey) {
      return null;
    }

    if (!stationsMap.has(safeKey)) {
      stationsMap.set(safeKey, {
        key: safeKey,
        station: stationLabelForKey(safeKey, rawLabel),
        participantesTotal: 0,
        criterioFitKits: 0,
        fueraDeScreening: 0,
        seguimientoVigente: 0,
        mayorRiesgo: 0,
        edadLt45: 0,
        muestrasRecibidas: 0,
        muestrasALab: 0,
        resultadosFitRecibidos: 0,
        fitInformados: 0,
        resultadosFitNegativos: 0,
        resultadosFitPositivos: 0,
        stockInicial: STATION_LABELS[safeKey]
          ? STOCK_INICIAL_POR_ESTACION
          : 0,
      });
    }

    const station = stationsMap.get(safeKey);
    if (rawLabel && (!station.station || station.station === "Sin estación")) {
      station.station = stationLabelForKey(safeKey, rawLabel);
    }
    if (STATION_LABELS[safeKey]) {
      station.stockInicial = STOCK_INICIAL_POR_ESTACION;
    }

    return station;
  }

  function applyEntrevistasPivot(stationsMap, matrix, status) {
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length < 2) {
      console.warn(
        "[KPI Dashboard] entrevistasPivot no disponible o vacío. Se mostrarán 0 en segmentación.",
      );
      return;
    }

    const headers = matrix[0].map((header) => normalizeText(header));
    const fitIndex = findHeaderIndex(headers, ["candidato", "fit"]);
    const step2Index = findHeaderIndex(headers, ["excluido", "paso", "2"]);
    const step3Index = findHeaderIndex(headers, ["excluido", "paso", "3"]);
    const ageIndex = findHeaderIndex(headers, ["excluido", "edad"]);

    if (fitIndex < 0) {
      console.warn(
        "[KPI Dashboard] entrevistasPivot sin columna 'Candidato a Test FIT'.",
      );
    }
    if (step2Index < 0) {
      console.warn(
        "[KPI Dashboard] entrevistasPivot sin columna 'Excluido Paso 2'.",
      );
    }
    if (step3Index < 0) {
      console.warn(
        "[KPI Dashboard] entrevistasPivot sin columna 'Excluido Paso 3'.",
      );
    }
    if (ageIndex < 0) {
      console.warn(
        "[KPI Dashboard] entrevistasPivot sin columna 'Excluido por edad'.",
      );
    }

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      const fit = fitIndex >= 0 ? toInt(getCell(row, fitIndex)) : 0;
      const seguimiento = step2Index >= 0 ? toInt(getCell(row, step2Index)) : 0;
      const mayorRiesgo = step3Index >= 0 ? toInt(getCell(row, step3Index)) : 0;
      const edadLt45 = ageIndex >= 0 ? toInt(getCell(row, ageIndex)) : 0;
      const fuera = seguimiento + mayorRiesgo + edadLt45;
      const participantes = fit + fuera;

      station.criterioFitKits += fit;
      station.seguimientoVigente += seguimiento;
      station.mayorRiesgo += mayorRiesgo;
      station.edadLt45 += edadLt45;
      station.fueraDeScreening += fuera;
      station.participantesTotal += participantes;
    });
  }

  function applyMuestrasRecibidas(stationsMap, matrix, status) {
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length < 2) {
      stationsMap.forEach((station) => {
        station.muestrasRecibidas = null;
      });
      console.warn(
        "[KPI Dashboard] muestrasRecibidasPorEstacion no disponible. Se mostrará —.",
      );
      return;
    }

    stationsMap.forEach((station) => {
      station.muestrasRecibidas = 0;
    });

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      station.muestrasRecibidas += toInt(getCell(row, 1));
    });
  }

  function applyMuestrasALab(stationsMap, matrix, status) {
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length < 2) {
      stationsMap.forEach((station) => {
        station.muestrasALab = null;
      });
      console.warn(
        "[KPI Dashboard] muestrasALabPorEstacion no disponible. Se mostrará —.",
      );
      return;
    }

    stationsMap.forEach((station) => {
      station.muestrasALab = 0;
    });

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      station.muestrasALab += toInt(getCell(row, 1));
    });
  }

  function applyResultadosFitPorEstacion(stationsMap, matrix, status) {
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length === 0) {
      stationsMap.forEach((station) => {
        station.resultadosFitRecibidos = null;
        station.fitInformados = null;
        station.resultadosFitNegativos = null;
        station.resultadosFitPositivos = null;
      });
      console.warn(
        "[KPI Dashboard] resultadosFitPorEstacion no disponible. Se mostrará —.",
      );
      return;
    }

    stationsMap.forEach((station) => {
      station.resultadosFitRecibidos = 0;
      station.fitInformados = 0;
      station.resultadosFitNegativos = 0;
      station.resultadosFitPositivos = 0;
    });

    if (matrix.length < 2) {
      return;
    }

    const headers = matrix[0].map((header) => normalizeText(header));
    const negativosIndex = findHeaderIndex(headers, ["negativo"]);
    const positivosIndex = findHeaderIndex(headers, ["positivo"]);

    if (negativosIndex < 0) {
      console.warn(
        "[KPI Dashboard] resultadosFitPorEstacion sin columna de resultados negativos.",
      );
    }
    if (positivosIndex < 0) {
      console.warn(
        "[KPI Dashboard] resultadosFitPorEstacion sin columna de resultados positivos.",
      );
    }

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      const negativos = negativosIndex >= 0 ? toInt(getCell(row, negativosIndex)) : 0;
      const positivos = positivosIndex >= 0 ? toInt(getCell(row, positivosIndex)) : 0;
      const totalResultados = negativos + positivos;

      station.resultadosFitNegativos += negativos;
      station.resultadosFitPositivos += positivos;
      station.resultadosFitRecibidos += totalResultados;
      station.fitInformados += totalResultados;
    });
  }

  function renderDashboard(root, model) {
    const totals = model.totals;
    const flow = model.fitFlowTotals;

    const participantsBase = Math.max(totals.participantesTotal, 1);
    const outsideBase = Math.max(totals.fueraDeScreening, 1);
    const executiveTop = renderExecutiveTopSection(totals, flow);

    const totalAvanceRow = [
      '<tr class="kpiDash__rowTotal">',
      '<td class="kpiDash__station">Total</td>',
      stageCell(
        totals.participantesTotal,
        totals.participantesTotal > 0 ? 100 : 0,
      ),
      stageCell(
        totals.criterioFitKits,
        percentage(totals.criterioFitKits, participantsBase),
      ),
      stageCell(
        totals.fueraDeScreening,
        percentage(totals.fueraDeScreening, participantsBase),
      ),
      stageCell(
        totals.seguimientoVigente,
        percentage(totals.seguimientoVigente, outsideBase),
      ),
      stageCell(totals.mayorRiesgo, percentage(totals.mayorRiesgo, outsideBase)),
      stageCell(totals.edadLt45, percentage(totals.edadLt45, outsideBase)),
      "</tr>",
    ].join("");

    const avanceRows = model.stations
      .map((station) => {
        const participantsRowBase = Math.max(station.participantesTotal, 1);
        const outsideRowBase = Math.max(station.fueraDeScreening, 1);

        return [
          "<tr>",
          '<td class="kpiDash__station">' + escapeHtml(station.station) + "</td>",
          stageCell(
            station.participantesTotal,
            station.participantesTotal > 0 ? 100 : 0,
          ),
          stageCell(
            station.criterioFitKits,
            percentage(station.criterioFitKits, participantsRowBase),
          ),
          stageCell(
            station.fueraDeScreening,
            percentage(station.fueraDeScreening, participantsRowBase),
          ),
          stageCell(
            station.seguimientoVigente,
            percentage(station.seguimientoVigente, outsideRowBase),
          ),
          stageCell(
            station.mayorRiesgo,
            percentage(station.mayorRiesgo, outsideRowBase),
          ),
          stageCell(station.edadLt45, percentage(station.edadLt45, outsideRowBase)),
          "</tr>",
        ].join("");
      })
      .join("");

    const totalFlowRow = [
      '<tr class="kpiDash__rowTotal">',
      '<td class="kpiDash__station">Total</td>',
      plainCell(flow.kitsEntregadosTotal),
      receivedWithPendingCell(
        flow.muestrasRecibidasTotal,
        flow.kitsEntregadosTotal,
      ),
      plainCell(flow.muestrasALabTotal),
      plainCell(flow.resultadosRecibidosTotal),
      informedResultsCell(
        flow.resultadosInformadosTotal,
        flow.negativos,
        flow.positivos,
      ),
      "</tr>",
    ].join("");

    const flowStationRows = model.stations
      .map((station) => {
        return [
          "<tr>",
          '<td class="kpiDash__station">' + escapeHtml(station.station) + "</td>",
          plainCell(station.criterioFitKits),
          receivedWithPendingCell(
            station.muestrasRecibidas,
            station.criterioFitKits,
          ),
          plainCell(station.muestrasALab),
          plainCell(station.resultadosFitRecibidos),
          informedResultsCell(
            station.fitInformados,
            station.resultadosFitNegativos,
            station.resultadosFitPositivos,
          ),
          "</tr>",
        ].join("");
      })
      .join("");

    const totalStockBadge = stockBadge(totals.remanente, STOCK_UMBRAL);
    const stockTotalItem = [
      '<li class="kpiDash__stockItem kpiDash__stockItem--total">',
      '<div class="kpiDash__stockTop">',
      '<p class="kpiDash__stockStation">Total</p>',
      stockBadgeHtml(totalStockBadge),
      "</div>",
      '<p class="kpiDash__stockValue">' + formatMetric(totals.remanente) + " kits</p>",
      '<p class="kpiDash__stockMeta">Inicial: ' +
        formatMetric(totals.stockInicial) +
        " · Entregados: " +
        formatMetric(totals.entregados) +
        "</p>",
      "</li>",
    ].join("");

    const stockRows = model.stations
      .map((station) => {
        const badge = stockBadge(station.remanente, STOCK_UMBRAL);
        return [
          '<li class="kpiDash__stockItem">',
          '<div class="kpiDash__stockTop">',
          '<p class="kpiDash__stockStation">' + escapeHtml(station.station) + "</p>",
          stockBadgeHtml(badge),
          "</div>",
          '<p class="kpiDash__stockValue">' +
            formatMetric(station.remanente) +
            " kits</p>",
          '<p class="kpiDash__stockMeta">Inicial: ' +
            formatMetric(station.stockInicial) +
            " · Entregados: " +
            formatMetric(station.entregados) +
            "</p>",
          "</li>",
        ].join("");
      })
      .join("");

    root.innerHTML = [
      '<div class="kpiDash__shell">',
      '<section class="kpiDash__header" aria-label="Resumen operativo de KPIs">',
      "<h3>Panel consolidado por estación</h3>",
      "<p>Lectura local agregada de participantes con foco en FIT, mayor riesgo, orientación, prevención y concientización.</p>",
      "</section>",
      executiveTop,
      '<section class="kpiDash__charts" aria-label="Comparativos de participantes">',
      '<article class="kpiDash__panel">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Comparativo por estación</h4>",
      "<p>Participantes, criterio FIT y fuera de screening</p>",
      "</header>",
      '<div class="kpiDash__chart" data-kpi-chart-bars></div>',
      "</article>",
      '<article class="kpiDash__panel">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Sankey de participantes</h4>",
      "<p>Participantes y segmentación de screening</p>",
      "</header>",
      '<div class="kpiDash__chart" data-kpi-chart-flow></div>',
      "</article>",
      "</section>",
      '<section class="kpiDash__funnel" aria-label="Avance por estación">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Avance por estación</h4>",
      "<p>Distribución de participantes por etapa</p>",
      "</header>",
      '<div class="kpiDash__tableWrap">',
      '<table class="kpiDash__table">',
      "<thead><tr><th>Estación</th><th>Participantes</th><th>Criterio FIT</th><th>Fuera de screening</th><th>Seguimiento vigente</th><th>Mayor riesgo</th><th>Edad &lt; 45</th></tr></thead>",
      "<tbody>",
      totalAvanceRow,
      avanceRows,
      "</tbody>",
      "</table>",
      "</div>",
      "</section>",
      '<section class="kpiDash__funnel" aria-label="Flujo FIT por estación">',
      '<header class="kpiDash__panelHeader">',
      "<h4>FLUJO FIT POR ESTACIÓN</h4>",
      "<p>Seguimiento de kits, muestras y resultados FIT</p>",
      "</header>",
      '<div class="kpiDash__tableWrap">',
      '<table class="kpiDash__table kpiDash__table--flow">',
      '<thead><tr><th>Estación Saludable</th><th>FITs entregados <span class="kpiDash__thMeta">A participantes</span></th><th>Muestras recibidas <span class="kpiDash__thMeta">(%) sobre FITS entregados</span></th><th>Entregado a lab <span class="kpiDash__thMeta">Laboratorio</span></th><th>Resultados de FIT <span class="kpiDash__thMeta">Recibidos</span></th><th>FIT informados <span class="kpiDash__thMeta kpiDash__thLegend"><span class="kpiDash__thLegendText">Resultados</span><span class="kpiDash__thPill kpiDash__thPill--neg">-</span><span class="kpiDash__thLegendText">y</span><span class="kpiDash__thPill kpiDash__thPill--pos">+</span></span></th></tr></thead>',
      "<tbody>",
      totalFlowRow,
      flowStationRows,
      "</tbody>",
      "</table>",
      "</div>",
      "</section>",
      '<section class="kpiDash__stock" aria-label="Stock de kits por estación">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Stock de kits por estación</h4>",
      "<p>Seguimiento de remanente y umbral operativo</p>",
      "</header>",
      '<ul class="kpiDash__stockGrid">',
      stockTotalItem,
      stockRows,
      "</ul>",
      "</section>",
      "</div>",
    ].join("");
  }

  function buildSummaryCard(totals) {
    const participantsBase = Math.max(totals.participantesTotal, 1);
    const outsideBase = Math.max(totals.fueraDeScreening, 1);

    return [
      '<article class="kpiDash__summaryCard">',
      '<div class="kpiDash__summaryTop">',
      '<span class="kpiDash__summaryLabel">Participantes (Total)</span>',
      '<span class="kpiDash__summaryValue">' +
        formatMetric(totals.participantesTotal) +
        "</span>",
      "</div>",
      '<div class="kpiDash__summarySplit">',
      summaryChip(
        "Criterio FIT (kits)",
        formatMetric(totals.criterioFitKits),
        percentage(totals.criterioFitKits, participantsBase) +
          "% sobre participantes",
      ),
      summaryChip(
        "Fuera de screening",
        formatMetric(totals.fueraDeScreening),
        percentage(totals.fueraDeScreening, participantsBase) +
          "% sobre participantes",
      ),
      "</div>",
      '<div class="kpiDash__summaryReasons">',
      summaryChip(
        "Seguimiento vigente",
        formatMetric(totals.seguimientoVigente),
        percentage(totals.seguimientoVigente, outsideBase) +
          "% sobre fuera de screening",
      ),
      summaryChip(
        "Mayor riesgo (orientación)",
        formatMetric(totals.mayorRiesgo),
        percentage(totals.mayorRiesgo, outsideBase) +
          "% sobre fuera de screening",
      ),
      summaryChip(
        "Edad < 45",
        formatMetric(totals.edadLt45),
        percentage(totals.edadLt45, outsideBase) + "% sobre fuera de screening",
      ),
      "</div>",
      "</article>",
    ].join("");
  }

  function buildFlowSteps(flow) {
    return [
      flowStep("Kits entregados", flow.kitsEntregadosTotal, "", ""),
      flowStep(
        "Muestras recibidas",
        flow.muestrasRecibidasTotal,
        conversionLabel(flow.muestrasRecibidasTotal, flow.kitsEntregadosTotal),
        "",
      ),
      flowStep(
        "Envío a laboratorio",
        flow.muestrasALabTotal,
        conversionLabel(flow.muestrasALabTotal, flow.muestrasRecibidasTotal),
        "",
      ),
      flowStep(
        "Resultados recibidos",
        flow.resultadosRecibidosTotal,
        conversionLabel(flow.resultadosRecibidosTotal, flow.muestrasALabTotal),
        "",
      ),
      flowStep(
        "Resultados informados",
        flow.resultadosInformadosTotal,
        conversionLabel(flow.resultadosInformadosTotal, flow.resultadosRecibidosTotal),
        "Pos/Neg: " +
          formatMetric(flow.positivos) +
          " / " +
          formatMetric(flow.negativos),
      ),
    ].join("");
  }

  function renderExecutiveTopSection(totals, flow) {
    const summaryCard = buildSummaryCard(totals);
    const flowSteps = buildFlowSteps(flow);

    return [
      '<section class="kpiDash__exec" aria-label="Resumen ejecutivo">',
      '<section class="kpiDash__summary kpiDash__execPanel" aria-label="Resumen consolidado de participantes">',
      '<header class="kpiDash__panelHeader kpiDash__execHeader">',
      "<h4>Participantes</h4>",
      "<p>Total y segmentación consolidada</p>",
      "</header>",
      summaryCard,
      "</section>",
      '<section class="kpiDash__fitFlow kpiDash__flowTop kpiDash__execPanel" aria-label="Flujo FIT">',
      '<header class="kpiDash__panelHeader kpiDash__execHeader">',
      "<h4>Flujo FIT</h4>",
      "<p>Seguimiento integral del circuito FIT</p>",
      "</header>",
      '<div class="kpiDash__fitFlowBody">',
      '<ol class="kpiDash__fitFlowSteps">',
      flowSteps,
      "</ol>",
      '<article class="kpiDash__fitFlowDonutPanel">',
      "<h5>Resultados informados</h5>",
      '<div class="kpiDash__chart kpiDash__chart--compact" data-kpi-chart-posneg></div>',
      "</article>",
      "</div>",
      "</section>",
      "</section>",
    ].join("");
  }

  function summaryChip(label, value, meta) {
    return [
      '<article class="kpiDash__summaryChip">',
      '<span class="kpiDash__summaryChipLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__summaryChipValue">' + escapeHtml(value) + "</span>",
      '<span class="kpiDash__summaryChipMeta">' + escapeHtml(meta) + "</span>",
      "</article>",
    ].join("");
  }

  function flowStep(label, value, conversion, detail) {
    return [
      '<li class="kpiDash__fitStep">',
      '<span class="kpiDash__fitStepLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__fitStepValue">' + escapeHtml(formatMetric(value)) + "</span>",
      conversion
        ? '<span class="kpiDash__fitStepMeta">' + escapeHtml(conversion) + "</span>"
        : "",
      detail
        ? '<span class="kpiDash__fitStepDetail">' + escapeHtml(detail) + "</span>"
        : "",
      "</li>",
    ].join("");
  }

  function stageCell(value, pct) {
    const hasValue = value !== null && value !== undefined;
    const progress = hasValue ? Math.max(0, Math.min(100, Math.round(pct || 0))) : 0;

    return [
      "<td>",
      '<div class="kpiDash__stage">',
      '<span class="kpiDash__stageValue">' +
        (hasValue ? formatNumber(value) : "—") +
        "</span>",
      '<div class="kpiDash__progress" aria-hidden="true"><span style="width:' +
        progress +
        '%"></span></div>',
      "</div>",
      "</td>",
    ].join("");
  }

  function plainCell(value) {
    return "<td>" + (value === null || value === undefined ? "—" : formatNumber(value)) + "</td>";
  }

  function receivedWithPendingCell(received, delivered) {
    if (received === null || received === undefined) {
      return "<td>—</td>";
    }

    const coverage = coveragePercent(received, delivered);

    return [
      "<td>",
      '<div class="kpiDash__flowCell">',
      '<span class="kpiDash__flowPrimary">' + formatNumber(received) + "</span>",
      coverage === null
        ? ""
        : '<span class="kpiDash__flowPct' +
          (coverage === 100 ? " kpiDash__flowPct--full" : "") +
          '">' +
          formatNumber(coverage) +
          "%</span>",
      "</div>",
      "</td>",
    ].join("");
  }

  function informedResultsCell(totalInformados, negativos, positivos) {
    if (totalInformados === null || totalInformados === undefined) {
      return "<td>—</td>";
    }

    const hasBreakdown =
      negativos !== null &&
      negativos !== undefined &&
      positivos !== null &&
      positivos !== undefined;

    return [
      "<td>",
      '<div class="kpiDash__informCell">',
      '<span class="kpiDash__informTotal">' + formatNumber(totalInformados) + "</span>",
      hasBreakdown
        ? [
            '<span class="kpiDash__informSplit">',
            '<span class="kpiDash__thPill kpiDash__thPill--neg kpiDash__informPill">' +
              formatNumber(negativos) +
              "</span>",
            '<span class="kpiDash__informSep">/</span>',
            '<span class="kpiDash__thPill kpiDash__thPill--pos kpiDash__informPill">' +
              formatNumber(positivos) +
              "</span>",
            "</span>",
          ].join("")
        : "",
      "</div>",
      "</td>",
    ].join("");
  }

  function coveragePercent(received, delivered) {
    if (
      received === null ||
      received === undefined ||
      delivered === null ||
      delivered === undefined ||
      delivered <= 0
    ) {
      return null;
    }

    const cappedReceived = Math.max(0, Math.min(received, delivered));
    return Math.round((cappedReceived / delivered) * 100);
  }

  function stockBadge(stock, threshold) {
    if (stock <= threshold) {
      return { className: "kpiDash__badge--critical", label: "Crítico" };
    }
    if (stock <= Math.round(threshold * 1.35)) {
      return { className: "kpiDash__badge--warn", label: "Vigilancia" };
    }
    return { className: "kpiDash__badge--ok", label: "Estable" };
  }

  function stockBadgeHtml(badge) {
    if (!badge || badge.label === "Estable") {
      return "";
    }
    return (
      '<span class="kpiDash__badge ' +
      badge.className +
      '">' +
      badge.label +
      "</span>"
    );
  }

  function conversionLabel(current, previous) {
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined ||
      previous <= 0
    ) {
      return "";
    }
    return percentage(current, previous) + "% vs paso previo";
  }

  function percentage(value, total) {
    if (!total) {
      return 0;
    }
    return Math.max(0, Math.min(999, Math.round((value / total) * 100)));
  }

  async function renderCharts(root, model) {
    const barsEl = root.querySelector(SELECTORS.bars);
    const sankeyEl = root.querySelector(SELECTORS.sankey);
    const posnegEl = root.querySelector(SELECTORS.posneg);

    if (!barsEl || !sankeyEl) {
      return;
    }

    try {
      const echarts = await ensureEcharts();
      const barChart = echarts.init(barsEl, null, { renderer: "canvas" });
      const sankeyChart = echarts.init(sankeyEl, null, { renderer: "canvas" });
      const posnegChart = posnegEl
        ? echarts.init(posnegEl, null, { renderer: "canvas" })
        : null;

      const stationNames = model.stations.map((station) => station.station);
      const participants = model.stations.map((station) => station.participantesTotal);
      const fit = model.stations.map((station) => station.criterioFitKits);
      const outside = model.stations.map((station) => station.fueraDeScreening);

      barChart.setOption({
        animationDuration: 550,
        animationEasing: "cubicOut",
        color: ["#004B8F", "#3C7FC3", "#88BDF2"],
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: {
          top: 4,
          textStyle: { color: "#3e5479", fontSize: 11 },
          itemWidth: 12,
          itemHeight: 8,
        },
        grid: { left: 42, right: 16, top: 42, bottom: 38 },
        xAxis: {
          type: "category",
          data: stationNames,
          axisLabel: {
            color: "#5d7296",
            interval: 0,
            rotate: stationNames.length > 5 ? 18 : 0,
          },
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: "#d4e1f5" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: "#5d7296" },
          splitLine: { lineStyle: { color: "#e8effb" } },
        },
        series: [
          {
            name: "Participantes",
            type: "bar",
            barMaxWidth: 30,
            data: participants,
            emphasis: { focus: "series" },
          },
          {
            name: "Criterio FIT (kits)",
            type: "bar",
            barMaxWidth: 28,
            data: fit,
            emphasis: { focus: "series" },
          },
          {
            name: "Fuera de screening",
            type: "bar",
            barMaxWidth: 26,
            data: outside,
            emphasis: { focus: "series" },
          },
        ],
      });

      const links = [
        {
          source: "Participantes",
          target: "Criterio FIT",
          value: model.totals.criterioFitKits,
        },
        {
          source: "Participantes",
          target: "Fuera de screening",
          value: model.totals.fueraDeScreening,
        },
        {
          source: "Fuera de screening",
          target: "Seguimiento vigente",
          value: model.totals.seguimientoVigente,
        },
        {
          source: "Fuera de screening",
          target: "Mayor riesgo",
          value: model.totals.mayorRiesgo,
        },
        {
          source: "Fuera de screening",
          target: "Edad < 45",
          value: model.totals.edadLt45,
        },
      ].filter((link) => link.value > 0);

      const hasSankey = model.totals.participantesTotal > 0;
      sankeyChart.setOption({
        animationDuration: 620,
        tooltip: {
          trigger: "item",
          formatter: function (params) {
            if (params.dataType === "edge") {
              return (
                params.data.source +
                " → " +
                params.data.target +
                ": " +
                formatNumber(params.data.value)
              );
            }
            return params.name;
          },
        },
        graphic:
          hasSankey
            ? []
            : [
                {
                  type: "text",
                  left: "center",
                  top: "middle",
                  style: {
                    text: "Sin flujo consolidado",
                    textAlign: "center",
                    fill: "#6b7f9f",
                    fontSize: 13,
                  },
                },
              ],
        series: [
          {
            type: "sankey",
            left: 10,
            top: 12,
            right: 10,
            bottom: 10,
            layoutIterations: 48,
            nodeWidth: 16,
            nodeGap: 20,
            emphasis: { focus: "adjacency" },
            data: hasSankey
              ? [
                  { name: "Participantes", itemStyle: { color: "#004B8F" } },
                  { name: "Criterio FIT", itemStyle: { color: "#3C7FC3" } },
                  {
                    name: "Fuera de screening",
                    itemStyle: { color: "#1E6FBF" },
                  },
                  {
                    name: "Seguimiento vigente",
                    itemStyle: { color: "#88BDF2" },
                  },
                  { name: "Mayor riesgo", itemStyle: { color: "#5E9DDA" } },
                  { name: "Edad < 45", itemStyle: { color: "#B5D9FA" } },
                ]
              : [],
            links: hasSankey ? links : [],
            lineStyle: {
              color: "source",
              curveness: 0.5,
              opacity: 0.34,
            },
            label: {
              color: "#29476e",
              fontSize: 11,
              fontWeight: 600,
            },
          },
        ],
      });

      if (posnegChart) {
        const positives = model.fitFlowTotals.positivos;
        const negatives = model.fitFlowTotals.negativos;
        const hasPosNegData = positives !== null && negatives !== null;
        const posNegTotal = hasPosNegData ? positives + negatives : 0;

        posnegChart.setOption({
          animationDuration: 520,
          color: ["#004B8F", "#88BDF2"],
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              return (
                params.name +
                ": " +
                formatNumber(params.value) +
                " (" +
                params.percent +
                "%)"
              );
            },
          },
          legend: {
            bottom: 0,
            textStyle: { color: "#4c6287", fontSize: 11 },
          },
          graphic:
            hasPosNegData && posNegTotal > 0
              ? []
              : [
                  {
                    type: "text",
                    left: "center",
                    top: "middle",
                    style: {
                      text: hasPosNegData
                        ? "Sin resultados informados"
                        : "Resultados informados\nno disponibles",
                      textAlign: "center",
                      fill: "#6b7f9f",
                      fontSize: 12,
                    },
                  },
                ],
          series: [
            {
              name: "Resultados informados",
              type: "pie",
              radius: ["55%", "74%"],
              center: ["50%", "44%"],
              avoidLabelOverlap: true,
              label: {
                show: true,
                color: "#3e5479",
                formatter: "{d}%",
              },
              labelLine: { show: true, length: 10, length2: 6 },
              data:
                hasPosNegData && posNegTotal > 0
                  ? [
                      { value: positives, name: "FIT Positivo" },
                      { value: negatives, name: "FIT Negativo" },
                    ]
                  : [],
            },
          ],
        });
      }

      const resize = () => {
        barChart.resize();
        sankeyChart.resize();
        if (posnegChart) {
          posnegChart.resize();
        }
      };

      if (window.ResizeObserver) {
        const observer = new ResizeObserver(resize);
        observer.observe(root);
      } else {
        window.addEventListener("resize", resize, { passive: true });
      }
    } catch (error) {
      console.error(
        "[KPI Dashboard] ECharts no disponible para renderizar gráficos.",
        error,
      );
      barsEl.innerHTML =
        '<div class="kpiDash__chartFallback">No se pudo inicializar el gráfico comparativo.</div>';
      sankeyEl.innerHTML =
        '<div class="kpiDash__chartFallback">No se pudo inicializar el Sankey de participantes.</div>';
      if (posnegEl) {
        posnegEl.innerHTML =
          '<div class="kpiDash__chartFallback">No se pudo inicializar el donut de resultados.</div>';
      }
    }
  }

  function ensureEcharts() {
    if (window.echarts) {
      return Promise.resolve(window.echarts);
    }

    if (window.__kpiDashEchartsPromise) {
      return window.__kpiDashEchartsPromise;
    }

    window.__kpiDashEchartsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = ECHARTS_CDN;
      script.async = true;
      script.onload = () => {
        if (window.echarts) {
          resolve(window.echarts);
          return;
        }
        reject(new Error("ECharts cargó sin exponer window.echarts"));
      };
      script.onerror = () =>
        reject(new Error("Fallo al cargar " + ECHARTS_CDN));
      document.head.appendChild(script);
    });

    return window.__kpiDashEchartsPromise;
  }

  function stationLabelForKey(key, rawLabel) {
    if (STATION_LABELS[key]) {
      return STATION_LABELS[key];
    }
    if (rawLabel) {
      return formatStationName(rawLabel);
    }
    return "Sin estación";
  }

  function normalizeStationKey(value) {
    const normalized = normalizeText(value)
      .replace(/\bparque\b/g, " ")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) {
      return "";
    }

    if (
      normalized.includes("aristobulo del valle") ||
      normalized.includes("aristobulo")
    ) {
      return "aristobulo";
    }
    if (normalized.includes("saavedra")) {
      return "saavedra";
    }
    if (normalized.includes("rivadavia")) {
      return "rivadavia";
    }
    if (normalized.includes("chacabuco")) {
      return "chacabuco";
    }

    return normalized.replace(/\s+/g, "_");
  }

  function findHeaderIndex(headers, tokens) {
    return headers.findIndex((header) => {
      return tokens.every((token) => header.includes(token));
    });
  }

  function getCell(row, index) {
    if (!row || index < 0 || index >= row.length) {
      return "";
    }
    return String(row[index] || "").trim();
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatStationName(value) {
    const clean = String(value || "")
      .replace(/[_-]+/g, " ")
      .trim();

    if (!clean) {
      return "Sin estación";
    }

    return clean
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function toInt(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }

    const raw = String(value || "").trim();
    if (!raw) {
      return 0;
    }

    const cleaned = raw.replace(/[^0-9,.-]/g, "");
    if (!cleaned) {
      return 0;
    }

    let normalized = cleaned;
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");

    if (hasComma && hasDot) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = cleaned.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      const parts = cleaned.split(",");
      normalized =
        parts.length === 2 && parts[1].length <= 2
          ? cleaned.replace(",", ".")
          : cleaned.replace(/,/g, "");
    }

    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.max(0, Math.round(parsed));
  }

  function sumField(items, field) {
    return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  }

  function sumNullableField(items, field) {
    let total = 0;
    let hasValue = false;

    items.forEach((item) => {
      const value = item[field];
      if (value === null || value === undefined) {
        return;
      }
      total += Number(value) || 0;
      hasValue = true;
    });

    return hasValue ? total : null;
  }

  function formatMetric(value) {
    if (value === null || value === undefined) {
      return "—";
    }
    return formatNumber(value);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-AR").format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKpiDashboard);
  } else {
    initKpiDashboard();
  }
})();
