(function () {
  "use strict";

  const SHEET_ID = "1le0b37MzYrWxfWt3r__QdiWDasLC1u_e6v9Exluttrc";
  const GID_ENTREVISTAS = "1342787691";
  const GVIZ_QUERY = "select C, count(A) group by C pivot I";
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID_ENTREVISTAS}&tq=${encodeURIComponent(GVIZ_QUERY)}&cb=${Date.now()}`;

  const STOCK_INICIAL = {
    saavedra: 75,
    rivadavia: 75,
    chacabuco: 75,
    aristobulo: 75,
  };
  const STOCK_UMBRAL = 20;

  const ECHARTS_CDN =
    "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js";

  const SELECTORS = {
    root: "[data-kpi-dashboard]",
    bars: "[data-kpi-chart-bars]",
    donut: "[data-kpi-chart-donut]",
  };

  function initKpiDashboard() {
    const root = document.querySelector(SELECTORS.root);
    if (!root) {
      return;
    }

    renderLoading(root);

    fetchCsv(CSV_URL)
      .then((csvText) => {
        const matrix = parseCsv(csvText);
        const model = buildModel(matrix);
        renderDashboard(root, model);
        return renderCharts(root, model);
      })
      .catch((error) => {
        console.error(
          "[KPI Dashboard] No se pudo cargar entrevistas agregadas (gviz pivot).",
          error,
        );
        renderEmptyState(root);
      });
  }

  function renderLoading(root) {
    root.innerHTML =
      '<div class="kpiDash__loading"><h3>Construyendo tablero local</h3><p>Sincronizando entrevistas agregadas por estación (sin PII).</p></div>';
  }

  function renderEmptyState(root) {
    root.innerHTML = [
      '<div class="kpiDash__empty" role="status">',
      "<h3>Tablero temporalmente sin datos</h3>",
      "<p>No fue posible leer la agregación de entrevistas por estación. Verificá permisos de la hoja y la consulta gviz pivot.</p>",
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

  function buildModel(matrix) {
    if (!Array.isArray(matrix) || matrix.length < 2) {
      throw new Error("Sin filas de datos");
    }

    const headers = matrix[0].map((header) => String(header || "").trim());
    const normalizedHeaders = headers.map((header) => normalizeKey(header));
    const stationIndex = 0;

    const interviewsIndex = 1;
    const kitsIndex = normalizedHeaders.findIndex((header) => {
      return header.includes("candidato") && header.includes("fit");
    });
    const highRiskIndex = normalizedHeaders.findIndex((header) => {
      return header.includes("excluido_paso_3");
    });

    if (kitsIndex < 0) {
      console.warn(
        "[KPI Dashboard] No se encontró columna de 'Candidato a Test FIT'. Se usará 0.",
      );
    }
    if (highRiskIndex < 0) {
      console.warn(
        "[KPI Dashboard] No se encontró columna de 'Excluido Paso 3'. Se usará 0.",
      );
    }

    const metricIndices = normalizedHeaders
      .map((_, index) => index)
      .filter((index) => index > 0);

    const dataRows = matrix.slice(1);
    const stationsMap = new Map();

    dataRows.forEach((rawRow) => {
      const stationRaw = getCell(rawRow, stationIndex);
      if (!stationRaw) {
        return;
      }

      const stationId = normalizeKey(stationRaw);
      const station = formatStationName(stationRaw);
      const pivotTotal = sumRowByIndices(rawRow, metricIndices);

      const entrevistasBase = toInt(getCell(rawRow, interviewsIndex));

      const kits = kitsIndex >= 0 ? toInt(getCell(rawRow, kitsIndex)) : 0;
      const highRisk = highRiskIndex >= 0 ? toInt(getCell(rawRow, highRiskIndex)) : 0;
      const interviews = Math.max(entrevistasBase, pivotTotal, kits, highRisk);
      const others = Math.max(0, interviews - kits - highRisk);

      const stockKey = resolveStationStockKey(stationRaw);
      const stockInitial = stockKey ? STOCK_INICIAL[stockKey] : 0;

      if (!stationsMap.has(stationId)) {
        stationsMap.set(stationId, {
          station,
          interviews: 0,
          kits: 0,
          highRisk: 0,
          others: 0,
          stockInitial,
        });
      }

      const current = stationsMap.get(stationId);
      current.interviews += interviews;
      current.kits += kits;
      current.highRisk += highRisk;
      current.others += others;
      current.stockInitial = Math.max(current.stockInitial, stockInitial);
    });

    const stations = Array.from(stationsMap.values())
      .map((station) => {
        const stockRemanente = Math.max(0, station.stockInitial - station.kits);
        return {
          station: station.station,
          interviews: station.interviews,
          kits: station.kits,
          highRisk: station.highRisk,
          others: Math.max(0, station.interviews - station.kits - station.highRisk),
          stockInitial: station.stockInitial,
          stockRemanente,
        };
      })
      .filter((station) => {
        return (
          station.interviews > 0 ||
          station.kits > 0 ||
          station.highRisk > 0 ||
          station.stockInitial > 0
        );
      })
      .sort((a, b) => {
        if (b.interviews !== a.interviews) {
          return b.interviews - a.interviews;
        }
        return a.station.localeCompare(b.station, "es");
      });

    if (stations.length === 0) {
      throw new Error("No hay estaciones con métricas para mostrar");
    }

    const totals = stations.reduce(
      (acc, station) => {
        acc.interviews += station.interviews;
        acc.kits += station.kits;
        acc.highRisk += station.highRisk;
        acc.others += station.others;
        acc.stockInitial += station.stockInitial;
        acc.stockRemanente += station.stockRemanente;
        return acc;
      },
      {
        interviews: 0,
        kits: 0,
        highRisk: 0,
        others: 0,
        stockInitial: 0,
        stockRemanente: 0,
      },
    );

    return { stations, totals };
  }

  function sumRowByIndices(row, indices) {
    return indices.reduce((acc, index) => acc + toInt(getCell(row, index)), 0);
  }

  function resolveStationStockKey(stationRaw) {
    const normalizedStation = normalizeKey(stationRaw);
    const keys = Object.keys(STOCK_INICIAL);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (
        normalizedStation === key ||
        normalizedStation.includes(key) ||
        key.includes(normalizedStation)
      ) {
        return key;
      }
    }

    return "";
  }

  function getCell(row, index) {
    if (index < 0 || !row || index >= row.length) {
      return "";
    }
    return String(row[index] || "").trim();
  }

  function normalizeKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
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

  function renderDashboard(root, model) {
    const kitRate = model.totals.interviews
      ? Math.round((model.totals.kits / model.totals.interviews) * 100)
      : 0;
    const highRiskRate = model.totals.interviews
      ? Math.round((model.totals.highRisk / model.totals.interviews) * 100)
      : 0;

    const funnelRows = model.stations
      .map((station) => {
        const entrevistas = Math.max(station.interviews, 1);
        const kits = clampToFunnel(station.kits, entrevistas);
        const highRisk = clampToFunnel(station.highRisk, entrevistas);
        const advisory = highRisk;

        return [
          "<tr>",
          '<td class="kpiDash__station">' + escapeHtml(station.station) + "</td>",
          stageCell(entrevistas, 100),
          stageCell(kits, percentage(kits, entrevistas)),
          stageCell(highRisk, percentage(highRisk, entrevistas)),
          stageCell(advisory, percentage(advisory, entrevistas)),
          "</tr>",
        ].join("");
      })
      .join("");

    const stockItems = model.stations
      .map((station) => {
        const badge = stockBadge(station.stockRemanente, STOCK_UMBRAL);

        return [
          '<li class="kpiDash__stockItem">',
          '<div class="kpiDash__stockTop">',
          '<p class="kpiDash__stockStation">' + escapeHtml(station.station) + "</p>",
          '<span class="kpiDash__badge ' + badge.className + '">' + badge.label + "</span>",
          "</div>",
          '<p class="kpiDash__stockValue">' + formatNumber(station.stockRemanente) + " kits</p>",
          '<p class="kpiDash__stockMeta">Inicial: ' +
            formatNumber(station.stockInitial) +
            " · Entregados: " +
            formatNumber(station.kits) +
            "</p>",
          "</li>",
        ].join("");
      })
      .join("");

    root.innerHTML = [
      '<div class="kpiDash__shell">',
      '<section class="kpiDash__header" aria-label="Resumen operativo de KPIs">',
      "<h3>Panel consolidado por estación</h3>",
      "<p>Lectura local agregada de entrevistas con foco en FIT, mayor riesgo, orientación y prevención.</p>",
      "</section>",
      '<section class="kpiDash__cards" aria-label="Totales consolidados">',
      kpiCard(
        "Entrevistas",
        formatNumber(model.totals.interviews),
        "Total consolidado",
      ),
      kpiCard(
        "Kits FIT entregados",
        formatNumber(model.totals.kits),
        kitRate + "% sobre entrevistas",
      ),
      kpiCard(
        "Mayor riesgo (orientación)",
        formatNumber(model.totals.highRisk),
        highRiskRate + "% sobre entrevistas",
      ),
      kpiCard(
        "Stock remanente",
        formatNumber(model.totals.stockRemanente),
        formatNumber(model.stations.length) + " estaciones",
      ),
      "</section>",
      '<section class="kpiDash__charts" aria-label="Comparativos por estación">',
      '<article class="kpiDash__panel">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Comparativo por estación</h4>",
      "<p>Entrevistas, kits FIT y mayor riesgo</p>",
      "</header>",
      '<div class="kpiDash__chart" data-kpi-chart-bars></div>',
      "</article>",
      '<article class="kpiDash__panel">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Distribución consolidada</h4>",
      "<p>Kits FIT, mayor riesgo y otros</p>",
      "</header>",
      '<div class="kpiDash__chart" data-kpi-chart-donut></div>',
      "</article>",
      "</section>",
      '<section class="kpiDash__funnel" aria-label="Embudo por estación">',
      '<header class="kpiDash__panelHeader">',
      "<h4>Embudo por estación</h4>",
      "<p>Vista tabular con avance por etapa</p>",
      "</header>",
      '<div class="kpiDash__tableWrap">',
      '<table class="kpiDash__table">',
      "<thead><tr><th>Estación</th><th>Entrevistas</th><th>Kits FIT</th><th>Mayor riesgo</th><th>Orientación</th></tr></thead>",
      "<tbody>",
      funnelRows,
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
      stockItems,
      "</ul>",
      "</section>",
      "</div>",
    ].join("");
  }

  function kpiCard(label, value, meta) {
    return [
      '<article class="kpiDash__card">',
      '<span class="kpiDash__cardLabel">' + escapeHtml(label) + "</span>",
      '<span class="kpiDash__cardValue">' + escapeHtml(value) + "</span>",
      '<span class="kpiDash__cardMeta">' + escapeHtml(meta) + "</span>",
      "</article>",
    ].join("");
  }

  function stageCell(value, pct) {
    return [
      "<td>",
      '<div class="kpiDash__stage">',
      '<span class="kpiDash__stageValue">' + formatNumber(value) + "</span>",
      '<div class="kpiDash__progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div>',
      "</div>",
      "</td>",
    ].join("");
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

  function percentage(value, total) {
    if (!total) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  }

  function clampToFunnel(value, max) {
    return Math.max(0, Math.min(value, max));
  }

  async function renderCharts(root, model) {
    const barsEl = root.querySelector(SELECTORS.bars);
    const donutEl = root.querySelector(SELECTORS.donut);

    if (!barsEl || !donutEl) {
      return;
    }

    try {
      const echarts = await ensureEcharts();
      const barChart = echarts.init(barsEl, null, { renderer: "canvas" });
      const donutChart = echarts.init(donutEl, null, { renderer: "canvas" });

      const stationNames = model.stations.map((station) => station.station);
      const interviews = model.stations.map((station) => station.interviews);
      const kits = model.stations.map((station) => station.kits);
      const highRisk = model.stations.map((station) => station.highRisk);

      barChart.setOption({
        animationDuration: 550,
        animationEasing: "cubicOut",
        color: ["#2457aa", "#3f83f1", "#ef9c40"],
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
            name: "Entrevistas",
            type: "bar",
            barMaxWidth: 30,
            data: interviews,
            emphasis: { focus: "series" },
          },
          {
            name: "Kits FIT",
            type: "bar",
            barMaxWidth: 28,
            data: kits,
            emphasis: { focus: "series" },
          },
          {
            name: "Mayor riesgo",
            type: "bar",
            barMaxWidth: 26,
            data: highRisk,
            emphasis: { focus: "series" },
          },
        ],
      });

      const donutTotal =
        model.totals.kits + model.totals.highRisk + model.totals.others;
      donutChart.setOption({
        animationDuration: 520,
        color: ["#2457aa", "#ef9c40", "#bfd3f5"],
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
          donutTotal > 0
            ? []
            : [
                {
                  type: "text",
                  left: "center",
                  top: "middle",
                  style: {
                    text: "Sin datos\nKits/Mayor riesgo/Otros",
                    textAlign: "center",
                    fill: "#6b7f9f",
                    fontSize: 13,
                  },
                },
              ],
        series: [
          {
            name: "Resultado consolidado",
            type: "pie",
            radius: ["56%", "75%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: true,
            label: {
              show: true,
              color: "#3e5479",
              formatter: "{d}%",
            },
            labelLine: { show: true, length: 10, length2: 6 },
            data: [
              { value: model.totals.kits, name: "Kits FIT" },
              { value: model.totals.highRisk, name: "Mayor riesgo" },
              { value: model.totals.others, name: "Otros" },
            ],
          },
        ],
      });

      const resize = () => {
        barChart.resize();
        donutChart.resize();
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
      donutEl.innerHTML =
        '<div class="kpiDash__chartFallback">No se pudo inicializar el gráfico de distribución.</div>';
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
