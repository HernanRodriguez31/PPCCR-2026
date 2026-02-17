(function () {
  "use strict";

  const SHEET_ID = "1le0b37MzYrWxfWt3r__QdiWDasLC1u_e6v9Exluttrc";
  const GID_ENTREVISTAS = "1342787691";

  const GVIZ_SOURCES = {
    entrevistasPivot: {
      label: "Entrevistas",
      gid: GID_ENTREVISTAS,
      tq: "select C, count(A) group by C pivot I",
    },
    muestrasRecibidasPorEstacion: {
      label: "Recepción de Muestra de Test FIT",
      sheet: "Recepción de Muestra de Test FIT",
      tq: "select G, count(E) where E is not null group by G",
    },
    muestrasALabPorEstacion: {
      label: "Entrega de Muestras de FIT a Lab",
      sheet: "Entrega de Muestras de FIT a Lab",
      tq: "select B, sum(D) where D is not null group by B",
    },
    resultadosFitPorEstacion: {
      label: "Recepción de Resultados de FIT",
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
  const HTML2PDF_CDN =
    "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";

  const SELECTORS = {
    root: "[data-kpi-dashboard]",
    reportRoot: "[data-kpi-report-root]",
    reportExportedAt: "[data-kpi-exported-at]",
    bars: "[data-kpi-chart-bars]",
    sankey: "[data-kpi-chart-flow]",
    posneg: "[data-kpi-chart-posneg]",
  };

  const SANKEY_PARTICIPANTES_DATA = {
    total: 35,
    fit: 20,
    fuera: 15,
    motivos: [
      { key: "riesgo", label: "Mayor riesgo (orientación)", n: 7 },
      { key: "seguimiento", label: "Seguimiento vigente", n: 4 },
      { key: "edad", label: "Edad < 45", n: 4 },
    ],
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
    const loadedAt = new Date().toISOString();
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

    const sources = entries.map(([sourceKey, source]) => {
      const matrix = matrices[sourceKey];
      const rowsRead =
        status[sourceKey] === "ok" && Array.isArray(matrix)
          ? Math.max(0, matrix.length - 1)
          : null;

      return {
        key: sourceKey,
        label: source.label || sourceKey,
        status: status[sourceKey],
        rowsRead,
      };
    });

    return {
      matrices,
      status,
      audit: {
        source: "Reporte operativo consolidado",
        sheetId: SHEET_ID,
        loadedAt,
        sources,
        hasErrors: sources.some((source) => source.status !== "ok"),
      },
    };
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
      '<div class="kpiDash__loading"><h3>Construyendo tablero local</h3><p>Sincronizando participantes y flujo FIT con fuentes agregadas.</p></div>' +
      '<div id="ppccrSankeyParticipantes" class="ppccr-sankey" style="display:none" aria-hidden="true"></div>';
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
    const audit = payload.audit || {
      source: "Reporte operativo consolidado",
      sheetId: SHEET_ID,
      loadedAt: new Date().toISOString(),
      sources: [],
      hasErrors: true,
    };

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
        const entregados = isFiniteMetric(station.criterioFitKits)
          ? Number(station.criterioFitKits)
          : null;
        const remanente =
          isFiniteMetric(station.stockInicial) && isFiniteMetric(entregados)
            ? Math.max(0, Number(station.stockInicial) - Number(entregados))
            : null;

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

    const effectiveStatus = Object.assign({}, status);
    if (
      effectiveStatus.entrevistasPivot === "ok" &&
      sumNullableField(stations, "participantesTotal") === null
    ) {
      effectiveStatus.entrevistasPivot = "error";
    }
    if (
      effectiveStatus.resultadosFitPorEstacion === "ok" &&
      sumNullableField(stations, "fitInformados") === null &&
      sumNullableField(stations, "resultadosFitRecibidos") === null
    ) {
      effectiveStatus.resultadosFitPorEstacion = "error";
    }

    const entrevistasOk = effectiveStatus.entrevistasPivot === "ok";
    const muestrasRecibidasOk =
      effectiveStatus.muestrasRecibidasPorEstacion === "ok";
    const muestrasALabOk = effectiveStatus.muestrasALabPorEstacion === "ok";
    const resultadosOk = effectiveStatus.resultadosFitPorEstacion === "ok";
    const auditSources = Array.isArray(audit.sources)
      ? audit.sources.map((source) => {
          return Object.assign({}, source, {
            status: effectiveStatus[source.key] || source.status,
          });
        })
      : [];
    const normalizedAudit = Object.assign({}, audit, {
      sources: auditSources,
      hasErrors:
        auditSources.length > 0
          ? auditSources.some((source) => source.status !== "ok")
          : true,
    });
    const stockInicialTotal = STOCK_INICIAL_POR_ESTACION * BASE_STATION_KEYS.length;
    const entregadosTotal = entrevistasOk
      ? sumNullableField(stations, "entregados")
      : null;
    const remanenteTotal =
      entrevistasOk && isFiniteMetric(entregadosTotal)
        ? Math.max(0, stockInicialTotal - Number(entregadosTotal))
        : null;

    const totals = {
      participantesTotal: entrevistasOk
        ? sumNullableField(stations, "participantesTotal")
        : null,
      criterioFitKits: entrevistasOk
        ? sumNullableField(stations, "criterioFitKits")
        : null,
      fueraDeScreening: entrevistasOk
        ? sumNullableField(stations, "fueraDeScreening")
        : null,
      seguimientoVigente: entrevistasOk
        ? sumNullableField(stations, "seguimientoVigente")
        : null,
      mayorRiesgo: entrevistasOk
        ? sumNullableField(stations, "mayorRiesgo")
        : null,
      edadLt45: entrevistasOk
        ? sumNullableField(stations, "edadLt45")
        : null,
      muestrasRecibidas: muestrasRecibidasOk
        ? sumNullableField(stations, "muestrasRecibidas")
        : null,
      muestrasALab: muestrasALabOk
        ? sumNullableField(stations, "muestrasALab")
        : null,
      resultadosFitRecibidos: resultadosOk
        ? sumNullableField(stations, "resultadosFitRecibidos")
        : null,
      fitInformados: resultadosOk
        ? sumNullableField(stations, "fitInformados")
        : null,
      resultadosFitNegativos: resultadosOk
        ? sumNullableField(stations, "resultadosFitNegativos")
        : null,
      resultadosFitPositivos: resultadosOk
        ? sumNullableField(stations, "resultadosFitPositivos")
        : null,
      stockInicial: stockInicialTotal,
      entregados: entregadosTotal,
      remanente: remanenteTotal,
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
      sourceStatus: effectiveStatus,
      audit: normalizedAudit,
      integrity: validateDataIntegrity(stations, totals),
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
        participantesTotal: null,
        criterioFitKits: null,
        fueraDeScreening: null,
        seguimientoVigente: null,
        mayorRiesgo: null,
        edadLt45: null,
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

  function setEntrevistasMetrics(station, value) {
    station.participantesTotal = value;
    station.criterioFitKits = value;
    station.fueraDeScreening = value;
    station.seguimientoVigente = value;
    station.mayorRiesgo = value;
    station.edadLt45 = value;
  }

  function applyEntrevistasPivot(stationsMap, matrix, status) {
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length === 0) {
      stationsMap.forEach((station) => {
        setEntrevistasMetrics(station, null);
      });
      console.warn(
        "[KPI Dashboard] entrevistasPivot no disponible o vacío. Se mostrará estado de Error al cargar.",
      );
      return;
    }

    const headers = matrix[0].map((header) => normalizeText(header));
    const fitIndex = findHeaderIndex(headers, ["candidato", "fit"]);
    const step2Index = findHeaderIndex(headers, ["excluido", "paso", "2"]);
    const step3Index = findHeaderIndex(headers, ["excluido", "paso", "3"]);
    const ageIndex = findHeaderIndex(headers, ["excluido", "edad"]);
    const hasRequiredColumns =
      fitIndex >= 0 && step2Index >= 0 && step3Index >= 0 && ageIndex >= 0;

    if (!hasRequiredColumns) {
      stationsMap.forEach((station) => {
        setEntrevistasMetrics(station, null);
      });
      console.warn(
        "[KPI Dashboard] entrevistasPivot con columnas incompletas. Se mostrará estado de Error al cargar.",
      );
      return;
    }

    stationsMap.forEach((station) => {
      setEntrevistasMetrics(station, 0);
    });

    if (matrix.length < 2) {
      return;
    }

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      if (!isFiniteMetric(station.participantesTotal)) {
        setEntrevistasMetrics(station, 0);
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
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length === 0) {
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

    if (matrix.length < 2) {
      return;
    }

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
    if (status !== "ok" || !Array.isArray(matrix) || matrix.length === 0) {
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

    if (matrix.length < 2) {
      return;
    }

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

    if (negativosIndex < 0 || positivosIndex < 0) {
      stationsMap.forEach((station) => {
        station.resultadosFitRecibidos = null;
        station.fitInformados = null;
        station.resultadosFitNegativos = null;
        station.resultadosFitPositivos = null;
      });
      console.warn(
        "[KPI Dashboard] resultadosFitPorEstacion con columnas incompletas. Se mostrará estado de Error al cargar.",
      );
      return;
    }

    matrix.slice(1).forEach((row) => {
      const rawStation = getCell(row, 0);
      const station = ensureStation(stationsMap, rawStation, rawStation);
      if (!station) {
        return;
      }

      const negativos = toInt(getCell(row, negativosIndex));
      const positivos = toInt(getCell(row, positivosIndex));
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
    const integrity = model.integrity || validateDataIntegrity(model.stations, totals);
    const reportHeader = buildReportHeader(model.audit, integrity);

    const executiveTop = renderExecutiveTopSection(totals, flow);

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
      '<div class="kpiDash__reportRoot" data-kpi-report-root>',
      '<div class="kpiDash__shell">',
      reportHeader,
      executiveTop,
      '<section class="kpiDash__charts" aria-label="Comparativos de participantes">',
      '<article class="kpiDash__panel kpiDash__panel--bars">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Comparativo por estación</h4>",
      "</header>",
      '<div class="kpiDash__chart" data-kpi-chart-bars></div>',
      "</article>",
      '<article class="kpiDash__panel kpiDash__panel--aux">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Sankey de participantes</h4>",
      "<p>Participantes y segmentación de screening</p>",
      "</header>",
      '<div id="ppccrSankeyParticipantes" class="ppccr-sankey"></div>',
      "</article>",
      "</section>",
      '<section class="kpiDash__funnel" aria-label="Flujo FIT por estación">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Flujo FIT por estación</h4>",
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
      "</div>",
    ].join("");
    bindReportHeaderActions(root);
    bindTrkGaugeTooltips(root);
    renderParticipantSankey();
  }

  function renderParticipantSankey(attempt = 0) {
    const host = document.getElementById("ppccrSankeyParticipantes");
    if (!host) {
      return;
    }

    const api = window.PPCCR_SANK;
    if (!api || typeof api.render !== "function") {
      if (attempt < 10) {
        window.setTimeout(() => renderParticipantSankey(attempt + 1), 120);
      } else {
        console.warn(
          "[KPI Dashboard] Componente Sankey de participantes no disponible.",
        );
      }
      return;
    }

    api.render(host, SANKEY_PARTICIPANTES_DATA);
  }

  function buildSummaryCard(totals) {
    const fitPct = ratioPercent(totals.criterioFitKits, totals.participantesTotal);
    const outsidePct = ratioPercent(
      totals.fueraDeScreening,
      totals.participantesTotal,
    );
    const fitBarPct = fitPct === null ? 0 : Math.max(0, Math.min(100, fitPct));
    const outsideBarPct =
      outsidePct === null ? 0 : Math.max(0, Math.min(100, outsidePct));
    const fitTooltip =
      fitPct === null
        ? "Participantes con Criterio FIT —"
        : "Participantes con Criterio FIT " + formatNumber(fitPct) + "%";
    const outsideTooltip =
      outsidePct === null
        ? "Participantes fuera de screening —"
        : "Participantes fuera de screening " + formatNumber(outsidePct) + "%";
    const followPct = ratioPercent(
      totals.seguimientoVigente,
      totals.fueraDeScreening,
    );
    const riskPct = ratioPercent(totals.mayorRiesgo, totals.fueraDeScreening);
    const agePct = ratioPercent(totals.edadLt45, totals.fueraDeScreening);

    return [
      '<article class="kpiDash__summaryCard">',
      '<div class="kpiDash__summaryDistribution">',
      '<div class="kpiDash__summaryBar" role="img" aria-label="Distribución de participantes entre criterio FIT y fuera de screening">',
      '<span class="kpiDash__summaryBarSegment kpiDash__summaryBarSegment--fit" style="width:' +
        fitBarPct +
        '%" data-kpi-tooltip="' +
        escapeHtml(fitTooltip) +
        '" aria-label="' +
        escapeHtml(fitTooltip) +
        '" tabindex="0"></span>',
      '<span class="kpiDash__summaryBarSegment kpiDash__summaryBarSegment--outside" style="width:' +
        outsideBarPct +
        '%" data-kpi-tooltip="' +
        escapeHtml(outsideTooltip) +
        '" aria-label="' +
        escapeHtml(outsideTooltip) +
        '" tabindex="0"></span>',
      "</div>",
      '<div class="kpiDash__summarySplit">',
      summaryMainMetric(
        "Criterio FIT",
        totals.criterioFitKits,
        fitPct,
        "participantes",
      ),
      summaryMainMetric(
        "Fuera de screening",
        totals.fueraDeScreening,
        outsidePct,
        "participantes",
      ),
      "</div>",
      "</div>",
      '<div class="kpiDash__summaryReasons">',
      '<p class="kpiDash__summaryReasonsScope">* % sobre fuera de screening</p>',
      summaryReasonBadge(
        "Edad < 45",
        totals.edadLt45,
        agePct,
      ),
      summaryReasonBadge(
        "Seguimiento vigente",
        totals.seguimientoVigente,
        followPct,
      ),
      summaryReasonBadge(
        "Mayor riesgo (orientación)",
        totals.mayorRiesgo,
        riskPct,
      ),
      "</div>",
      "</article>",
    ].join("");
  }

  function buildFlowSteps(flow) {
    const steps = [
      {
        label: "Kits entregados",
        value: flow.kitsEntregadosTotal,
        previous: null,
      },
      {
        label: "Muestras recibidas",
        value: flow.muestrasRecibidasTotal,
        previous: flow.kitsEntregadosTotal,
      },
      {
        label: "Envío a lab",
        value: flow.muestrasALabTotal,
        previous: flow.muestrasRecibidasTotal,
      },
      {
        label: "Resultados recibidos",
        value: flow.resultadosRecibidosTotal,
        previous: flow.muestrasALabTotal,
      },
      {
        label: "Resultados informados",
        value: flow.resultadosInformadosTotal,
        previous: flow.resultadosRecibidosTotal,
      },
    ];

    return steps
      .map((step, index) => flowStep(step, index, steps.length))
      .join("");
  }

  function buildFlowOutcome(flow) {
    const hasBreakdown =
      flow.negativos !== null &&
      flow.negativos !== undefined &&
      flow.positivos !== null &&
      flow.positivos !== undefined;

    if (!hasBreakdown) {
      return [
        '<section class="kpiDash__fitOutcome" aria-label="Resultados informados">',
        '<header class="kpiDash__fitOutcomeHeader">',
        "<h5>Resultados informados</h5>",
        '<span class="kpiDash__fitOutcomeTotal">—</span>',
        "</header>",
        '<p class="kpiDash__fitOutcomeEmpty">Sin datos disponibles para negativos y positivos.</p>',
        "</section>",
      ].join("");
    }

    const negativos = Math.max(0, Number(flow.negativos) || 0);
    const positivos = Math.max(0, Number(flow.positivos) || 0);
    const total = negativos + positivos;
    const negativosPct = total > 0 ? percentage(negativos, total) : 0;
    const positivosPct = total > 0 ? percentage(positivos, total) : 0;
    const negativosBarPct = Math.max(0, Math.min(100, negativosPct));
    const positivosBarPct = Math.max(0, Math.min(100, positivosPct));
    const hasSplit = negativosBarPct > 0 && positivosBarPct > 0;
    const negativosTooltip = "Resultados Negativos " + formatNumber(negativosPct) + "%";
    const positivosTooltip = "Resultados Positivos " + formatNumber(positivosPct) + "%";

    return [
      '<section class="kpiDash__fitOutcome" aria-label="Resultados informados">',
      '<header class="kpiDash__fitOutcomeHeader">',
      "<h5>Resultados informados</h5>",
      '<span class="kpiDash__fitOutcomeTotal">' +
        formatMetric(flow.resultadosInformadosTotal) +
        "</span>",
      "</header>",
      '<div class="kpiDash__fitOutcomeBarWrap">',
      '<div class="kpiDash__fitOutcomeBar" role="img" data-has-split="' +
        (hasSplit ? "true" : "false") +
        '" aria-label="' +
        escapeHtml(
          "Distribución de resultados informados. " +
            negativosTooltip +
            ". " +
            positivosTooltip +
            ".",
        ) +
        '">',
      '<span class="kpiDash__fitOutcomeSegment kpiDash__fitOutcomeSegment--neg" tabindex="0" data-tooltip="' +
        escapeHtml(negativosTooltip) +
        '" aria-label="' +
        escapeHtml(negativosTooltip) +
        '" style="width:' +
        negativosBarPct +
        '%">' +
        '<span class="kpiDash__fitOutcomeSegmentTip" role="tooltip">' +
        escapeHtml(negativosTooltip) +
        "</span>" +
        "</span>",
      '<span class="kpiDash__fitOutcomeSegment kpiDash__fitOutcomeSegment--pos" tabindex="0" data-tooltip="' +
        escapeHtml(positivosTooltip) +
        '" aria-label="' +
        escapeHtml(positivosTooltip) +
        '" style="width:' +
        positivosBarPct +
        '%">' +
        '<span class="kpiDash__fitOutcomeSegmentTip" role="tooltip">' +
        escapeHtml(positivosTooltip) +
        "</span>" +
        "</span>",
      "</div>",
      "</div>",
      '<div class="kpiDash__fitOutcomeLegend">',
      flowOutcomeMetric("Negativos", negativos, negativosPct, "neg"),
      flowOutcomeMetric("Positivos", positivos, positivosPct, "pos"),
      "</div>",
      "</section>",
    ].join("");
  }

  function buildTrkSection(flow) {
    const kits = flow ? flow.kitsEntregadosTotal : null;
    const muestras = flow ? flow.muestrasRecibidasTotal : null;
    const trkPct = ratioPercent(muestras, kits);
    const hasData =
      kits !== null &&
      kits !== undefined &&
      Number(kits) > 0 &&
      muestras !== null &&
      muestras !== undefined;
    const displayPct = trkPct === null ? "—" : formatNumber(trkPct) + "%";
    const gaugePct = trkPct === null ? 0 : Math.max(0, Math.min(100, trkPct));
    const pendingPct = trkPct === null ? 0 : Math.max(0, 100 - gaugePct);
    const gapToTarget = trkPct === null ? null : Math.max(0, 100 - Number(trkPct));
    const gaugeRadius = 44;
    const gaugeCircumference = 2 * Math.PI * gaugeRadius;
    const deliveredLength =
      trkPct === null ? 0 : (gaugeCircumference * gaugePct) / 100;
    const pendingLength =
      trkPct === null ? 0 : Math.max(0, gaugeCircumference - deliveredLength);
    const totalKits = hasData ? Math.max(0, Number(kits) || 0) : null;

    function formatTrkTooltip(label, pctValue) {
      if (pctValue === null || totalKits === null || totalKits <= 0) {
        return label + ": —";
      }
      const amount = Math.round((Number(pctValue) / 100) * totalKits);
      return (
        label +
        ": " +
        formatNumber(pctValue) +
        "% (" +
        formatMetric(amount) +
        "/" +
        formatMetric(totalKits) +
        ")"
      );
    }

    const deliveredTooltip = formatTrkTooltip("Adherencia al test", gaugePct);
    const pendingTooltip = formatTrkTooltip("Adherencia al test", pendingPct);

    let tone = "empty";
    if (hasData && trkPct !== null) {
      if (trkPct >= 85) {
        tone = "strong";
      } else if (trkPct >= 70) {
        tone = "good";
      } else {
        tone = "watch";
      }
    }

    const statusDetail =
      gapToTarget === null
        ? "Completar kits y muestras para medir TRK."
        : gapToTarget === 0
          ? "Objetivo alcanzado."
          : "Gap a objetivo: " + formatNumber(gapToTarget) + " pp";
    const compactGap =
      gapToTarget === null
        ? "Sin referencia"
        : gapToTarget === 0
          ? "Objetivo alcanzado"
          : "Gap " + formatNumber(gapToTarget) + " pp";

    return [
      '<section class="kpiDash__trk kpiDash__trk--' +
        tone +
        '" aria-label="Tasa de Retorno de Kits">',
      '<header class="kpiDash__trkHead">',
      '<div class="kpiDash__trkMeta">',
      '<p class="kpiDash__trkTitle">Tasa de Retorno de Kits (TRK)</p>',
      '<p class="kpiDash__trkSub">Muestras recibidas / Kits entregados</p>',
      "</div>",
      "</header>",
      '<div class="kpiDash__trkBody">',
      '<div class="kpiDash__trkKpi">',
      '<div class="kpiDash__trkPrimary">',
      '<span class="kpiDash__trkValue">' + displayPct + "</span>",
      '<span class="kpiDash__trkTarget">Obj. 100%</span>',
      "</div>",
      '<span class="kpiDash__trkGap" title="' +
        escapeHtml(statusDetail) +
        '">' +
        escapeHtml(compactGap) +
        "</span>",
      '<span class="kpiDash__trkFactLine"><strong>' +
        formatMetric(kits) +
        "</strong> kits / <strong>" +
        formatMetric(muestras) +
        "</strong> muestras</span>",
      "</div>",
      '<div class="kpiDash__trkGaugeWrap">',
      '<div class="kpiDash__trkGauge" style="--trk-pct:' +
        gaugePct +
        ';" role="img" aria-label="' +
        escapeHtml("TRK " + displayPct + " sobre objetivo 100%") +
        '">',
      trkPct === null
        ? ""
        : '<svg class="kpiDash__trkGaugeOverlay" viewBox="0 0 100 100" aria-hidden="true">' +
          '<g transform="rotate(-90 50 50)">' +
          '<circle class="kpiDash__trkGaugeHit kpiDash__trkGaugeHit--delivered" tabindex="0" data-tip="' +
          escapeHtml(deliveredTooltip) +
          '" aria-label="' +
          escapeHtml(deliveredTooltip) +
          '" cx="50" cy="50" r="' +
          gaugeRadius +
          '" stroke-dasharray="' +
          deliveredLength.toFixed(2) +
          " " +
          gaugeCircumference.toFixed(2) +
          '" stroke-dashoffset="0"></circle>' +
          '<circle class="kpiDash__trkGaugeHit kpiDash__trkGaugeHit--pending" tabindex="0" data-tip="' +
          escapeHtml(pendingTooltip) +
          '" aria-label="' +
          escapeHtml(pendingTooltip) +
          '" cx="50" cy="50" r="' +
          gaugeRadius +
          '" stroke-dasharray="' +
          pendingLength.toFixed(2) +
          " " +
          gaugeCircumference.toFixed(2) +
          '" stroke-dashoffset="' +
          (-deliveredLength).toFixed(2) +
          '"></circle>' +
          "</g>" +
          "</svg>",
      '<span class="kpiDash__trkGaugeMarker" aria-hidden="true"></span>',
      '<span class="kpiDash__trkGaugeTip" aria-hidden="true"></span>',
      '<div class="kpiDash__trkGaugeInner">',
      '<span class="kpiDash__trkGaugeValue">' + displayPct + "</span>",
      '<span class="kpiDash__trkGaugeGoal">Obj. 100%</span>',
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      "</section>",
    ].join("");
  }

  function flowOutcomeMetric(label, value, pct, tone) {
    return [
      '<div class="kpiDash__fitOutcomeItem">',
      '<span class="kpiDash__fitOutcomeDot kpiDash__fitOutcomeDot--' +
        tone +
        '" aria-hidden="true"></span>',
      '<span class="kpiDash__fitOutcomeLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__fitOutcomeMetric">' +
        '<span class="kpiDash__fitOutcomeValue">' +
        formatNumber(value) +
        "</span>" +
        '<span class="kpiDash__fitOutcomePct">(' +
        formatNumber(pct) +
        "%)</span>" +
        "</span>",
      "</div>",
    ].join("");
  }

  function renderExecutiveTopSection(totals, flow) {
    const summaryCard = buildSummaryCard(totals);
    const flowSteps = buildFlowSteps(flow);
    const flowOutcome = buildFlowOutcome(flow);
    const trkSection = buildTrkSection(flow);

    return [
      '<section class="kpiDash__exec" aria-label="Resumen ejecutivo">',
      '<section class="kpiDash__summary kpiDash__execPanel" aria-label="Resumen consolidado de participantes">',
      '<header class="kpiDash__panelHeader kpiDash__execHeader">',
      "<h4>Participantes</h4>",
      '<span class="kpiDash__summaryHeadTotal">' +
        formatMetric(totals.participantesTotal) +
        "</span>",
      "</header>",
      summaryCard,
      "</section>",
      '<section class="kpiDash__fitFlow kpiDash__flowTop kpiDash__execPanel" aria-label="Flujo FIT">',
      '<header class="kpiDash__panelHeader kpiDash__execHeader">',
      "<h4>Flujo FIT</h4>",
      "<p>Seguimiento integral del circuito FIT</p>",
      "</header>",
      '<div class="kpiDash__fitFlowBody">',
      '<div class="kpiDash__fitFlowHint">% vs paso previo</div>',
      '<ol class="kpiDash__fitFlowSteps">',
      flowSteps,
      "</ol>",
      '<div class="kpiDash__fitFlowSplit">',
      '<div class="kpiDash__fitFlowPanel kpiDash__fitFlowPanel--outcome">',
      flowOutcome,
      "</div>",
      '<div class="kpiDash__fitFlowPanel kpiDash__fitFlowPanel--trk">',
      trkSection,
      "</div>",
      "</div>",
      "</div>",
      "</section>",
      "</section>",
    ].join("");
  }

  function buildReportHeader(audit, integrity) {
    const safeAudit = audit || {};
    const status = resolveReportStatus(audit, integrity);

    return [
      '<section class="kpiDash__reportHeader" aria-label="Encabezado del reporte">',
      '<div class="kpiDash__reportHeadMain">',
      "<h3>Reporte consolidado de KPIs</h3>",
      "<p>Vista ejecutiva por estación</p>",
      "</div>",
      '<div class="kpiDash__reportHeadMeta">',
      '<p class="kpiDash__reportUpdated">Actualizado: ' +
        escapeHtml(formatDateTime(safeAudit.loadedAt)) +
        "</p>",
      '<p class="kpiDash__reportExportedAt" data-kpi-exported-at aria-live="polite"></p>',
      '<div class="kpiDash__reportActions" role="group" aria-label="Acciones del reporte">',
      '<button type="button" class="kpiDash__reportBtn" data-kpi-action="download-pdf" aria-label="Descargar reporte KPI en PDF">Descargar PDF</button>',
      '<button type="button" class="kpiDash__reportBtn kpiDash__reportBtn--primary" data-kpi-action="refresh" aria-label="Actualizar reporte">Refresh</button>',
      "</div>",
      '<div class="kpiDash__reportStatus ' +
        status.className +
        '" title="' +
        escapeHtml(status.title) +
        '" role="status" aria-live="polite">',
      '<span class="kpiDash__reportStatusDot" aria-hidden="true"></span>',
      status.icon
        ? '<span class="kpiDash__reportStatusIcon" aria-hidden="true">' +
          escapeHtml(status.icon) +
          "</span>"
        : "",
      '<span class="kpiDash__reportStatusText">' + escapeHtml(status.label) + "</span>",
      "</div>",
      "</div>",
      "</section>",
    ].join("");
  }

  function resolveReportStatus(audit, integrity) {
    const safeAudit = audit || {};
    const sources = Array.isArray(safeAudit.sources) ? safeAudit.sources : [];
    const issues =
      integrity && Array.isArray(integrity.issues) ? integrity.issues : [];
    const hasLoadErrors =
      sources.some((source) => source.status !== "ok") || safeAudit.hasErrors;
    const ok = !hasLoadErrors && issues.length === 0;
    const titleParts = [];

    if (hasLoadErrors) {
      titleParts.push("Hay fuentes con carga incompleta.");
    }
    if (issues.length > 0) {
      titleParts.push(issues.slice(0, 3).join(" · "));
    }

    return {
      ok,
      label: ok ? "Datos OK" : "Datos incompletos",
      className: ok
        ? "kpiDash__reportStatus--ok"
        : "kpiDash__reportStatus--warn",
      icon: ok ? "" : "i",
      title:
        titleParts.length > 0
          ? titleParts.join(" ")
          : "Reporte operativo consolidado",
    };
  }

  function bindReportHeaderActions(root) {
    const downloadPdfBtn = root.querySelector('[data-kpi-action="download-pdf"]');
    const refreshBtn = root.querySelector('[data-kpi-action="refresh"]');

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener("click", function () {
        exportarReportePDF({
          downloadBtn: downloadPdfBtn,
          refreshBtn,
        });
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        window.location.reload();
      });
    }
  }

  async function exportarReportePDF(controls) {
    const downloadBtn = controls && controls.downloadBtn ? controls.downloadBtn : null;
    const refreshBtn = controls && controls.refreshBtn ? controls.refreshBtn : null;
    const defaultDownloadLabel = downloadBtn ? downloadBtn.textContent : "";

    setExportActionState([downloadBtn, refreshBtn], true);
    if (downloadBtn) {
      downloadBtn.textContent = "Generando PDF...";
    }

    try {
      const pdfModule = await loadPpccrPdfModule();
      if (!pdfModule || typeof pdfModule.exportPPCCRToPdf !== "function") {
        throw new Error("No se pudo cargar exportPPCCRToPdf desde el módulo de exportación.");
      }

      await pdfModule.exportPPCCRToPdf({
        headerSelector: "#top",
        dashboardSelector: "#kpi-dashboard-ppccr",
        filenamePrefix: "PPCCR_Reporte",
        debug: false,
      });
    } catch (err) {
      console.error("[KPI Dashboard] Falló exportPPCCRToPdf.", err);
      const reason =
        err && err.message ? err.message : JSON.stringify(err || "Error desconocido");
      window.alert("No se pudo exportar el PDF.\\nDetalle: " + reason);
    } finally {
      if (downloadBtn) {
        downloadBtn.textContent = defaultDownloadLabel;
      }
      setExportActionState([downloadBtn, refreshBtn], false);
    }
  }

  async function loadPpccrPdfModule() {
    if (window.__ppccrPdfModulePromise) {
      return window.__ppccrPdfModulePromise;
    }

    const candidates = [
      "/assets/js/export/ppccr-export-pdf.js",
      "./assets/js/export/ppccr-export-pdf.js",
      "assets/js/export/ppccr-export-pdf.js",
    ];

    window.__ppccrPdfModulePromise = (async () => {
      let lastError = null;

      for (let i = 0; i < candidates.length; i += 1) {
        const specifier = candidates[i];
        try {
          return await import(specifier);
        } catch (error) {
          lastError = error;
          console.warn("[KPI Dashboard] No se pudo importar módulo PDF desde:", specifier, error);
        }
      }

      throw (
        lastError ||
        new Error("No se pudo resolver el módulo de exportación PDF en ninguna ruta.")
      );
    })().catch((error) => {
      window.__ppccrPdfModulePromise = null;
      throw error;
    });

    return window.__ppccrPdfModulePromise;
  }

  async function downloadPDF(reportRoot, controls) {
    return exportarReportePDF(controls);
  }

  function setExportActionState(buttons, disabled) {
    (Array.isArray(buttons) ? buttons : []).forEach((btn) => {
      if (btn) {
        btn.disabled = Boolean(disabled);
      }
    });
  }

  function createPdfSnapshotHost(payload) {
    const data = payload || {};
    const headerSource = data.headerSource;
    const dashboardSource = data.dashboardSource;
    const exportStamp = data.exportStamp || "";
    const host = document.createElement("div");
    host.id = "kpiDash__pdfCaptureRoot";
    host.className = "kpiDash__pdfCaptureRoot";
    host.setAttribute("aria-hidden", "true");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.width = "800px";
    host.style.background = "#ffffff";
    host.style.zIndex = "-1";
    host.style.pointerEvents = "none";

    const style = document.createElement("style");
    style.textContent = buildPdfCaptureStyles();
    host.appendChild(style);

    const headerCopy = headerSource.cloneNode(true);
    headerCopy.classList.add("kpiDash__pdfCaptureHeader");
    headerCopy.removeAttribute("id");
    headerCopy
      .querySelectorAll(".site-nav, #mobileDockWrap, .mobile-fixed-dock, .nav-toggle")
      .forEach((node) => node.remove());
    headerCopy.querySelectorAll(".site-topbar").forEach((node) => {
      node.style.position = "static";
      node.style.top = "auto";
    });
    host.appendChild(headerCopy);

    const dashboardCopy = dashboardSource.cloneNode(true);
    dashboardCopy.classList.add("kpiDash__pdfCaptureDashboard");
    dashboardCopy.removeAttribute("id");
    snapshotDashboardCanvasesAsImages(dashboardSource, dashboardCopy);
    const reportCopy = dashboardCopy.querySelector(SELECTORS.reportRoot);
    if (reportCopy) {
      reportCopy.classList.add("kpiDash--exporting");
    }
    const exportEl = dashboardCopy.querySelector(SELECTORS.reportExportedAt);
    if (exportEl) {
      exportEl.textContent = exportStamp;
    }
    host.appendChild(dashboardCopy);

    return host;
  }

  function snapshotDashboardCanvasesAsImages(sourceRoot, targetRoot) {
    if (!sourceRoot || !targetRoot) {
      return;
    }

    const sourceCanvases = Array.from(sourceRoot.querySelectorAll("canvas"));
    const targetCanvases = Array.from(targetRoot.querySelectorAll("canvas"));
    const totalCanvas = Math.min(sourceCanvases.length, targetCanvases.length);

    for (let i = 0; i < totalCanvas; i += 1) {
      const originalCanvas = sourceCanvases[i];
      const clonedCanvas = targetCanvases[i];

      if (!originalCanvas || !clonedCanvas) {
        continue;
      }

      try {
        if ((originalCanvas.width || 0) === 0 || (originalCanvas.height || 0) === 0) {
          continue;
        }

        const imgData = originalCanvas.toDataURL("image/png", 1.0);
        if (!imgData) {
          continue;
        }

        const img = document.createElement("img");
        img.src = imgData;
        img.alt = "";
        img.decoding = "sync";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";

        if (clonedCanvas.className) {
          img.className = clonedCanvas.className;
        }

        if (clonedCanvas.parentNode) {
          clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
        }
      } catch (error) {
        console.warn("[KPI Dashboard] No se pudo convertir un canvas a imagen para PDF:", error);
      }
    }

    // Soporte SVG: copia estilo computado para mantener apariencia en el clon.
    const sourceSvgs = Array.from(sourceRoot.querySelectorAll("svg"));
    const targetSvgs = Array.from(targetRoot.querySelectorAll("svg"));
    const totalSvg = Math.min(sourceSvgs.length, targetSvgs.length);

    for (let i = 0; i < totalSvg; i += 1) {
      copySvgComputedStyleTree(sourceSvgs[i], targetSvgs[i]);
    }
  }

  function copySvgComputedStyleTree(sourceSvg, targetSvg) {
    if (!sourceSvg || !targetSvg) {
      return;
    }

    const sourceNodes = [sourceSvg].concat(Array.from(sourceSvg.querySelectorAll("*")));
    const targetNodes = [targetSvg].concat(Array.from(targetSvg.querySelectorAll("*")));
    const total = Math.min(sourceNodes.length, targetNodes.length);

    for (let i = 0; i < total; i += 1) {
      const sourceNode = sourceNodes[i];
      const targetNode = targetNodes[i];
      if (!sourceNode || !targetNode) {
        continue;
      }
      try {
        const computed = window.getComputedStyle(sourceNode);
        if (computed && computed.cssText) {
          targetNode.style.cssText += ";" + computed.cssText;
        } else if (computed) {
          for (let j = 0; j < computed.length; j += 1) {
            const prop = computed[j];
            targetNode.style.setProperty(
              prop,
              computed.getPropertyValue(prop),
              computed.getPropertyPriority(prop),
            );
          }
        }
      } catch (error) {
        // Sin interrupción: algunos nodos SVG pueden no exponer estilos completos.
      }
    }
  }

  function buildPdfCaptureStyles() {
    return [
      ".kpiDash__pdfCaptureRoot, .kpiDash__pdfCaptureRoot * {",
      "  -webkit-print-color-adjust: exact !important;",
      "  print-color-adjust: exact !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .site-header,",
      ".kpiDash__pdfCaptureRoot .site-topbar,",
      ".kpiDash__pdfCaptureRoot .topbar,",
      ".kpiDash__pdfCaptureRoot .site-topbar__inner {",
      "  position: static !important;",
      "  left: auto !important;",
      "  top: auto !important;",
      "  width: 100% !important;",
      "  max-width: none !important;",
      "  box-shadow: none !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .site-nav {",
      "  display: none !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .logo-strip {",
      "  display: flex !important;",
      "  flex-wrap: wrap !important;",
      "  justify-content: center !important;",
      "  gap: 10px !important;",
      "  margin-bottom: 14px !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .logo-pill {",
      "  flex: 0 1 auto !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash {",
      "  margin-top: 16px !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash__reportActions,",
      ".kpiDash__pdfCaptureRoot .kpiDash__reportUpdated,",
      ".kpiDash__pdfCaptureRoot .kpiDash__reportStatus {",
      "  display: none !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash__reportExportedAt {",
      "  display: block !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash__reportHeader,",
      ".kpiDash__pdfCaptureRoot .kpiDash__execPanel,",
      ".kpiDash__pdfCaptureRoot .kpiDash__panel,",
      ".kpiDash__pdfCaptureRoot .kpiDash__funnel,",
      ".kpiDash__pdfCaptureRoot .kpiDash__stock,",
      ".kpiDash__pdfCaptureRoot .kpiDash__tableWrap,",
      ".kpiDash__pdfCaptureRoot .kpiDash__chart,",
      ".kpiDash__pdfCaptureRoot .ppccr-sankey {",
      "  break-inside: avoid !important;",
      "  page-break-inside: avoid !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash__tableWrap {",
      "  overflow: visible !important;",
      "}",
      ".kpiDash__pdfCaptureRoot .kpiDash__table {",
      "  min-width: 0 !important;",
      "}",
    ].join("\n");
  }

  function copyCanvasContent(sourceRoot, targetRoot) {
    if (!sourceRoot || !targetRoot) {
      return;
    }

    const sourceCanvases = Array.from(sourceRoot.querySelectorAll("canvas"));
    const targetCanvases = Array.from(targetRoot.querySelectorAll("canvas"));
    const total = Math.min(sourceCanvases.length, targetCanvases.length);

    for (let i = 0; i < total; i += 1) {
      const source = sourceCanvases[i];
      const target = targetCanvases[i];
      const ctx = target && target.getContext ? target.getContext("2d") : null;
      if (!source || !target || !ctx) {
        continue;
      }

      try {
        target.width = source.width;
        target.height = source.height;
        target.style.width = source.style.width || source.clientWidth + "px";
        target.style.height = source.style.height || source.clientHeight + "px";
        ctx.drawImage(source, 0, 0);
      } catch (error) {
        console.warn("[KPI Dashboard] No se pudo copiar un canvas al snapshot PDF.", error);
      }
    }
  }

  async function waitForSnapshotAssets(host) {
    if (!host) {
      return;
    }

    const images = Array.from(host.querySelectorAll("img"));
    const pendingImages = images.filter((img) => !(img.complete && img.naturalWidth > 0));
    if (pendingImages.length > 0) {
      await Promise.race([
        Promise.all(
          pendingImages.map((img) => {
            return new Promise((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
              window.setTimeout(done, 2600);
            });
          }),
        ),
        new Promise((resolve) => window.setTimeout(resolve, 3200)),
      ]);
    }

    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ]);
    }
  }

  async function ensureHtml2PdfLibrary() {
    if (typeof window.html2pdf === "function") {
      return window.html2pdf;
    }

    if (window.__kpiDashHtml2PdfPromise) {
      return window.__kpiDashHtml2PdfPromise;
    }

    window.__kpiDashHtml2PdfPromise = loadExternalScript(
      HTML2PDF_CDN,
      () => typeof window.html2pdf === "function",
    ).then(() => {
      if (typeof window.html2pdf !== "function") {
        throw new Error("html2pdf.js no se cargó correctamente.");
      }
      return window.html2pdf;
    });

    return window.__kpiDashHtml2PdfPromise;
  }

  function loadExternalScript(url, validator) {
    if (typeof validator === "function" && validator()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) =>
        script.src === url || script.src.indexOf(url) === 0,
      );

      if (existing) {
        let settled = false;
        const finishResolve = () => {
          if (settled) {
            return;
          }
          settled = true;
          resolve();
        };
        const finishReject = (error) => {
          if (settled) {
            return;
          }
          settled = true;
          reject(error);
        };
        const verifyReady = () => {
          if (typeof validator === "function" && !validator()) {
            return false;
          }
          finishResolve();
          return true;
        };
        const start = Date.now();
        const waitUntilReady = () => {
          if (verifyReady()) {
            return;
          }
          if (Date.now() - start >= 5000) {
            finishReject(new Error("No se detectó la librería esperada: " + url));
            return;
          }
          window.setTimeout(waitUntilReady, 80);
        };

        existing.addEventListener("load", verifyReady, { once: true });
        existing.addEventListener(
          "error",
          () => finishReject(new Error("No se pudo cargar: " + url)),
          { once: true },
        );

        if (!verifyReady()) {
          waitUntilReady();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = onLoad;
      script.onerror = onError;
      document.head.appendChild(script);

      function onLoad() {
        if (typeof validator === "function" && !validator()) {
          reject(new Error("Script cargado sin objeto esperado: " + url));
          return;
        }
        resolve();
      }

      function onError() {
        reject(new Error("No se pudo cargar: " + url));
      }
    });
  }

  function buildPdfFilename(date) {
    const safeDate = date instanceof Date ? date : new Date();
    const day = String(safeDate.getDate()).padStart(2, "0");
    const month = String(safeDate.getMonth() + 1).padStart(2, "0");
    const year = String(safeDate.getFullYear());
    return "Reporte de Programa de Precencion de CCR. " + day + "-" + month + "-" + year + ".pdf";
  }

  async function waitForUiStable() {
    const raf = typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (callback) => window.setTimeout(callback, 16);
    await new Promise((resolve) => raf(resolve));
    await new Promise((resolve) => raf(resolve));
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }

  function bindTrkGaugeTooltips(root) {
    const gauges = root.querySelectorAll(".kpiDash__trkGauge");
    gauges.forEach((gauge) => {
      const tip = gauge.querySelector(".kpiDash__trkGaugeTip");
      if (!tip) {
        return;
      }

      const hits = gauge.querySelectorAll(".kpiDash__trkGaugeHit");
      if (!hits.length) {
        return;
      }

      const showTip = (text) => {
        if (!text) {
          return;
        }
        tip.textContent = text;
        tip.classList.add("is-visible");
      };

      const hideTip = () => {
        tip.classList.remove("is-visible");
      };

      hits.forEach((hit) => {
        const text = hit.getAttribute("data-tip");
        if (!text) {
          return;
        }
        hit.addEventListener("mouseenter", () => showTip(text));
        hit.addEventListener("focus", () => showTip(text));
        hit.addEventListener("mouseleave", hideTip);
        hit.addEventListener("blur", hideTip);
      });

      gauge.addEventListener("mouseleave", hideTip);
    });
  }

  function validateDataIntegrity(stations, totals) {
    const issues = [];
    const safeStations = Array.isArray(stations) ? stations : [];
    const safeTotals = totals || {};

    const participantesEsperado = sumIfNumeric([
      safeTotals.criterioFitKits,
      safeTotals.fueraDeScreening,
    ]);
    collectMismatch(
      issues,
      "Participantes total",
      safeTotals.participantesTotal,
      participantesEsperado,
    );

    const fueraEsperado = sumIfNumeric([
      safeTotals.seguimientoVigente,
      safeTotals.mayorRiesgo,
      safeTotals.edadLt45,
    ]);
    collectMismatch(
      issues,
      "Fuera de screening total",
      safeTotals.fueraDeScreening,
      fueraEsperado,
    );

    const informadosEsperado = sumIfNumeric([
      safeTotals.resultadosFitPositivos,
      safeTotals.resultadosFitNegativos,
    ]);
    collectMismatch(
      issues,
      "Resultados informados total",
      safeTotals.fitInformados,
      informadosEsperado,
    );

    const stockEsperado = subtractIfNumeric(
      safeTotals.stockInicial,
      safeTotals.entregados,
    );
    collectMismatch(issues, "Stock total", safeTotals.remanente, stockEsperado);

    safeStations.forEach((station) => {
      const participantsByStation = sumIfNumeric([
        station.criterioFitKits,
        station.fueraDeScreening,
      ]);
      collectMismatch(
        issues,
        "Participantes " + station.station,
        station.participantesTotal,
        participantsByStation,
      );

      const outsideByStation = sumIfNumeric([
        station.seguimientoVigente,
        station.mayorRiesgo,
        station.edadLt45,
      ]);
      collectMismatch(
        issues,
        "Fuera de screening " + station.station,
        station.fueraDeScreening,
        outsideByStation,
      );

      const informedByStation = sumIfNumeric([
        station.resultadosFitNegativos,
        station.resultadosFitPositivos,
      ]);
      collectMismatch(
        issues,
        "Resultados informados " + station.station,
        station.fitInformados,
        informedByStation,
      );

      const stockByStation = subtractIfNumeric(station.stockInicial, station.entregados);
      collectMismatch(
        issues,
        "Stock " + station.station,
        station.remanente,
        stockByStation,
      );
    });

    return {
      hasIssues: issues.length > 0,
      issues,
    };
  }

  function summaryMainMetric(label, value, pct, scopeLabel) {
    const pctLabel = pct === null || pct === undefined
      ? "—"
      : formatNumber(pct) + "%";

    return [
      '<div class="kpiDash__summaryMainMetric">',
      '<span class="kpiDash__summaryMainDot ' +
        (normalizeText(label).includes("fuera")
          ? "kpiDash__summaryMainDot--outside"
          : "kpiDash__summaryMainDot--fit") +
        '" aria-hidden="true"></span>',
      '<span class="kpiDash__summaryMainLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__summaryMainValue">' + formatMetric(value) + "</span>",
      '<span class="kpiDash__summaryMainMeta">' +
        pctLabel +
        " · " +
        escapeHtml(scopeLabel) +
        "</span>",
      "</div>",
    ].join("");
  }

  function summaryReasonBadge(label, value, pct) {
    const pctLabel = pct === null || pct === undefined
      ? "—"
      : formatNumber(pct) + "%";
    const pctDisplay = pctLabel === "—" ? "(—)" : "(" + pctLabel + "*)";

    return [
      '<div class="kpiDash__summaryBadge">',
      '<span class="kpiDash__summaryBadgeLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__summaryBadgeValue">' +
        formatMetric(value) +
        '<span class="kpiDash__summaryBadgePct">' +
        escapeHtml(pctDisplay) +
        "</span></span>",
      "</div>",
    ].join("");
  }

  function flowStep(step, index, totalSteps) {
    const pct = flowStepPercent(step.value, step.previous);
    const badgeText = pct === null ? "Base" : formatNumber(pct) + "%";
    const badgeClass =
      pct === null
        ? "kpiDash__fitStepBadge--base"
        : pct >= 100
          ? "kpiDash__fitStepBadge--full"
          : "kpiDash__fitStepBadge--mid";

    return [
      '<li class="kpiDash__fitStep">',
      '<span class="kpiDash__fitStepLabel">' + escapeHtml(step.label) + "</span>",
      '<div class="kpiDash__fitStepRow">',
      '<span class="kpiDash__fitStepValue">' +
        escapeHtml(formatMetric(step.value)) +
        "</span>",
      '<span class="kpiDash__fitStepBadge ' + badgeClass + '">' + badgeText + "</span>",
      "</div>",
      index < totalSteps - 1 ? '<span class="kpiDash__fitStepArrow" aria-hidden="true">→</span>' : "",
      "</li>",
    ].join("");
  }

  function flowStepPercent(current, previous) {
    if (
      current === null ||
      current === undefined ||
      previous === null ||
      previous === undefined ||
      previous <= 0
    ) {
      return null;
    }
    return percentage(current, previous);
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
        : [
            '<span class="kpiDash__flowProgress" role="img" aria-label="Muestras recibidas ' +
              formatNumber(coverage) +
              '%">',
            '<span class="kpiDash__flowProgressFill" style="width:' +
              Math.max(0, Math.min(coverage, 100)) +
              '%"></span>',
            '<span class="kpiDash__flowProgressLabel">' +
              formatNumber(coverage) +
              "%</span>",
            "</span>",
          ].join(""),
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

    const negativosSafe = hasBreakdown ? Math.max(0, Number(negativos) || 0) : 0;
    const positivosSafe = hasBreakdown ? Math.max(0, Number(positivos) || 0) : 0;

    return [
      "<td>",
      '<div class="kpiDash__informCell">',
      '<span class="kpiDash__informTotal">' + formatNumber(totalInformados) + "</span>",
      hasBreakdown
        ? [
            '<span class="kpiDash__informDetail">',
            '<span class="kpiDash__informSplit">',
            '<span class="kpiDash__informChip kpiDash__informChip--neg" title="Resultados negativos">',
            '<span class="kpiDash__informChipSign">-</span>',
            '<span class="kpiDash__informChipValue">' + formatNumber(negativosSafe) + "</span>",
            "</span>",
            '<span class="kpiDash__informSplitSep" aria-hidden="true"></span>',
            '<span class="kpiDash__informChip kpiDash__informChip--pos" title="Resultados positivos">',
            '<span class="kpiDash__informChipSign">+</span>',
            '<span class="kpiDash__informChipValue">' + formatNumber(positivosSafe) + "</span>",
            "</span>",
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
    if (!isFiniteMetric(stock)) {
      return null;
    }
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

  function ratioPercent(value, total) {
    if (!isFiniteMetric(value) || !isFiniteMetric(total) || Number(total) <= 0) {
      return null;
    }
    return percentage(Number(value), Number(total));
  }

  function sumIfNumeric(values) {
    if (!Array.isArray(values) || values.some((value) => !isFiniteMetric(value))) {
      return null;
    }
    return values.reduce((acc, value) => acc + Number(value), 0);
  }

  function subtractIfNumeric(left, right) {
    if (!isFiniteMetric(left) || !isFiniteMetric(right)) {
      return null;
    }
    return Number(left) - Number(right);
  }

  function collectMismatch(issues, label, actual, expected) {
    if (!isFiniteMetric(actual) || !isFiniteMetric(expected)) {
      return;
    }
    if (Math.round(Number(actual)) === Math.round(Number(expected))) {
      return;
    }
    issues.push(
      label +
        ": " +
        formatNumber(actual) +
        " vs " +
        formatNumber(expected),
    );
  }

  async function renderCharts(root, model) {
    const barsEl = root.querySelector(SELECTORS.bars);
    const sankeyEl = root.querySelector(SELECTORS.sankey);
    const posnegEl = root.querySelector(SELECTORS.posneg);
    const chartPalette = {
      blueDark: "#0C4E8D",
      blueMid: "#3C7FC3",
      blueLight: "#88BDF2",
      neutralGray: "#95A4B8",
      axisText: "#5E7393",
      axisLine: "rgba(95, 115, 147, 0.28)",
      gridLine: "rgba(95, 115, 147, 0.11)",
      tooltipText: "#2E4567",
    };

    if (!barsEl) {
      return;
    }

    try {
      const echarts = await ensureEcharts();
      const barChart = echarts.init(barsEl, null, { renderer: "canvas" });
      const sankeyChart = sankeyEl
        ? echarts.init(sankeyEl, null, { renderer: "svg" })
        : null;
      const posnegChart = posnegEl
        ? echarts.init(posnegEl, null, { renderer: "canvas" })
        : null;
      let syncSankeySvgViewBox = function () {};

      const orderedStations = model.stations.slice().sort((a, b) => {
        if (b.participantesTotal !== a.participantesTotal) {
          return b.participantesTotal - a.participantesTotal;
        }
        return a.station.localeCompare(b.station, "es");
      });

      const fullStationNames = orderedStations.map((station) => station.station);
      const shortStationNames = fullStationNames.map((name) => {
        const stationKey = normalizeStationKey(name);
        if (stationKey === "saavedra") {
          return "Saavedra";
        }
        if (stationKey === "rivadavia") {
          return "Rivadavia";
        }
        if (stationKey === "chacabuco") {
          return "Chacabuco";
        }
        if (stationKey === "aristobulo") {
          return "Aristóbulo";
        }
        return name;
      });

      const participants = orderedStations.map((station) => station.participantesTotal);
      const fit = orderedStations.map((station) => station.criterioFitKits);
      const outside = orderedStations.map((station) => station.fueraDeScreening);
      const barValueLabel = {
        show: true,
        position: "top",
        distance: 6,
        color: chartPalette.axisText,
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        formatter: function (params) {
          if (
            params.value === null ||
            params.value === undefined ||
            Number(params.value) <= 0
          ) {
            return "";
          }
          return formatNumber(params.value);
        },
      };

      barChart.setOption({
        animationDuration: 550,
        animationEasing: "cubicOut",
        color: [chartPalette.blueDark, chartPalette.blueMid, chartPalette.blueLight],
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          borderColor: "rgba(95, 115, 147, 0.18)",
          borderWidth: 1,
          extraCssText:
            "box-shadow: 0 10px 24px rgba(19,41,75,0.12); border-radius: 10px; padding: 8px 10px;",
          axisPointer: {
            type: "shadow",
            shadowStyle: { color: "rgba(0, 75, 143, 0.04)" },
          },
          textStyle: {
            color: chartPalette.tooltipText,
            fontSize: 11,
            fontWeight: 500,
          },
          formatter: function (params) {
            if (!Array.isArray(params) || params.length === 0) {
              return "";
            }

            const rowIndex = params[0].dataIndex;
            const stationName = fullStationNames[rowIndex] || params[0].axisValue;
            const rows = params.map((item) => {
              const value =
                item.value === null || item.value === undefined
                  ? "—"
                  : formatNumber(item.value);
              return item.marker + item.seriesName + ": " + value;
            });
            return [stationName].concat(rows).join("<br/>");
          },
        },
        legend: {
          top: 0,
          left: "center",
          textStyle: { color: chartPalette.axisText, fontSize: 10.5, fontWeight: 500 },
          itemWidth: 10,
          itemHeight: 8,
          itemGap: 8,
          padding: [0, 0, 0, 0],
        },
        grid: { left: 44, right: 16, top: 54, bottom: 34 },
        xAxis: {
          type: "category",
          data: shortStationNames,
          axisLabel: {
            color: chartPalette.axisText,
            fontSize: 10.5,
            fontWeight: 500,
            interval: 0,
            rotate: 0,
            margin: 10,
          },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: chartPalette.axisLine } },
        },
        yAxis: {
          type: "value",
          splitNumber: 4,
          axisLabel: { color: chartPalette.axisText, fontSize: 10.5 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: {
            lineStyle: {
              color: chartPalette.gridLine,
              type: "dashed",
            },
          },
        },
        series: [
          {
            name: "Participantes",
            type: "bar",
            barMaxWidth: 30,
            data: participants,
            itemStyle: { borderRadius: [5, 5, 0, 0] },
            label: barValueLabel,
            emphasis: { focus: "series" },
          },
          {
            name: "Criterio FIT (kits)",
            type: "bar",
            barMaxWidth: 28,
            data: fit,
            itemStyle: { borderRadius: [5, 5, 0, 0] },
            label: barValueLabel,
            emphasis: { focus: "series" },
          },
          {
            name: "Fuera de screening",
            type: "bar",
            barMaxWidth: 26,
            data: outside,
            itemStyle: { borderRadius: [5, 5, 0, 0] },
            label: barValueLabel,
            emphasis: { focus: "series" },
          },
        ],
      });

      if (sankeyChart && sankeyEl) {
        const links = [
          {
            source: "Participantes",
            target: "Criterio FIT (kits)",
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
            target: "Mayor riesgo (orientación)",
            value: model.totals.mayorRiesgo,
          },
          {
            source: "Fuera de screening",
            target: "Edad < 45",
            value: model.totals.edadLt45,
          },
        ].filter((link) => link.value > 0);

        const hasSankey = model.totals.participantesTotal > 0;
        const sankeyTotal = model.totals.participantesTotal;
        const sankeyNodeValues = {};
        const sankeyWidth = Math.max(640, sankeyEl.clientWidth || 0);
        const sankeyLeftPadding = Math.max(
          92,
          Math.min(156, Math.round(sankeyWidth * 0.14)),
        );
        const sankeyRightPadding = Math.max(
          136,
          Math.min(236, Math.round(sankeyWidth * 0.22)),
        );
        const sankeyLabelWidthLeft = Math.max(
          132,
          Math.min(216, Math.round(sankeyLeftPadding * 1.15)),
        );
        const sankeyLabelWidthRight = Math.max(
          168,
          Math.min(284, Math.round(sankeyRightPadding * 1.04)),
        );
        const sankeyLabelFormatter = function (params) {
          const nodeValue = Number(sankeyNodeValues[params.name]) || 0;
          return params.name + "\nN: " + formatNumber(nodeValue);
        };
        syncSankeySvgViewBox = function () {
          const svg = sankeyEl.querySelector("svg");
          if (!svg) {
            return;
          }
          const width = Math.max(
            1,
            Math.round(sankeyEl.clientWidth || svg.clientWidth || 0),
          );
          const height = Math.max(
            1,
            Math.round(sankeyEl.clientHeight || svg.clientHeight || 0),
          );
          svg.setAttribute("viewBox", "0 0 " + width + " " + height);
          svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        };
        links.forEach((link) => {
          sankeyNodeValues[link.source] =
            (sankeyNodeValues[link.source] || 0) + link.value;
          sankeyNodeValues[link.target] = Math.max(
            sankeyNodeValues[link.target] || 0,
            link.value,
          );
        });
        sankeyChart.setOption({
          animationDuration: 620,
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              const isEdge = params.dataType === "edge";
              const participants = isEdge
                ? Number(params.data.value) || 0
                : Number(sankeyNodeValues[params.name]) || 0;
              const totalPct = sankeyTotal > 0 ? percentage(participants, sankeyTotal) : 0;

              if (isEdge) {
                return (
                  params.data.source +
                  " → " +
                  params.data.target +
                  ": " +
                  formatNumber(participants) +
                  " (" +
                  totalPct +
                  "%)"
                );
              }

              return (
                params.name +
                ": " +
                formatNumber(participants) +
                " (" +
                totalPct +
                "%)"
              );
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
                      fill: chartPalette.axisText,
                      fontSize: 13,
                    },
                  },
                ],
          series: [
            {
              type: "sankey",
              left: sankeyLeftPadding,
              top: 14,
              right: sankeyRightPadding,
              bottom: 14,
              layoutIterations: 48,
              nodeWidth: 26,
              nodeGap: 34,
              emphasis: { focus: "adjacency" },
              data: hasSankey
                ? [
                    {
                      name: "Participantes",
                      itemStyle: { color: chartPalette.blueDark },
                      label: {
                        position: "left",
                        align: "right",
                        width: sankeyLabelWidthLeft,
                        overflow: "break",
                        formatter: sankeyLabelFormatter,
                      },
                    },
                    {
                      name: "Criterio FIT (kits)",
                      itemStyle: { color: chartPalette.blueMid },
                    },
                    {
                      name: "Fuera de screening",
                      itemStyle: { color: chartPalette.blueLight },
                    },
                    {
                      name: "Seguimiento vigente",
                      itemStyle: { color: chartPalette.neutralGray },
                    },
                    {
                      name: "Mayor riesgo (orientación)",
                      itemStyle: { color: chartPalette.blueMid },
                    },
                    {
                      name: "Edad < 45",
                      itemStyle: { color: chartPalette.neutralGray },
                    },
                  ]
                : [],
              links: hasSankey ? links : [],
              lineStyle: {
                color: "source",
                curveness: 0.5,
                opacity: 0.34,
              },
              label: {
                color: chartPalette.tooltipText,
                fontSize: 11,
                fontWeight: 600,
                position: "right",
                distance: 10,
                width: sankeyLabelWidthRight,
                lineHeight: 14,
                overflow: "break",
                formatter: sankeyLabelFormatter,
              },
              labelLayout: { hideOverlap: false, moveOverlap: "shiftY" },
            },
          ],
        });
        syncSankeySvgViewBox();
      }

      if (posnegChart) {
        const positives = model.fitFlowTotals.positivos;
        const negatives = model.fitFlowTotals.negativos;
        const hasPosNegData = positives !== null && negatives !== null;
        const posNegTotal = hasPosNegData ? positives + negatives : 0;

        posnegChart.setOption({
          animationDuration: 520,
          color: [chartPalette.blueMid, chartPalette.blueLight],
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
            textStyle: { color: chartPalette.axisText, fontSize: 11 },
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
                      fill: chartPalette.axisText,
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
                color: chartPalette.tooltipText,
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
        if (sankeyChart) {
          sankeyChart.resize();
          syncSankeySvgViewBox();
        }
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
      if (sankeyEl) {
        sankeyEl.innerHTML =
          '<div class="kpiDash__chartFallback">No se pudo inicializar el Sankey de participantes.</div>';
      }
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

  function isFiniteMetric(value) {
    if (value === null || value === undefined) {
      return false;
    }
    return Number.isFinite(Number(value));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-AR").format(Number(value) || 0);
  }

  function formatDateTime(value) {
    const parsed = value ? new Date(value) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }
    const parts = new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(parsed);
    const map = {};
    parts.forEach((part) => {
      map[part.type] = part.value;
    });
    return (
      (map.day || "—") +
      "/" +
      (map.month || "—") +
      "/" +
      (map.year || "—") +
      " " +
      (map.hour || "—") +
      ":" +
      (map.minute || "—")
    );
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
