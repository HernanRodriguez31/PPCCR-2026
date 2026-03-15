(() => {
  const DATA = {
    total: 35,
    fit: 20,
    fuera: 15,
    motivos: [
      { key: "riesgo", label: "Mayor riesgo (orientación)", n: 7 },
      { key: "seguimiento", label: "Seg. Vigente", n: 4 },
      { key: "edad", label: "Edad < 45", n: 4 },
    ],
  };

  const COLORS = {
    nodeGradients: {
      total: [
        ["0%", "#0b4b95", 1],
        ["55%", "#1563b7", 0.98],
        ["100%", "#347fce", 0.96],
      ],
      fit: [
        ["0%", "#8fb3dc", 0.98],
        ["55%", "#b3cdea", 0.96],
        ["100%", "#dce9f6", 0.95],
      ],
      fuera: [
        ["0%", "#b4cbe2", 0.96],
        ["55%", "#d0dfee", 0.95],
        ["100%", "#ebf2f9", 0.94],
      ],
      edad: [
        ["0%", "#c8d9e9", 0.94],
        ["55%", "#dce8f4", 0.92],
        ["100%", "#f4f8fc", 0.9],
      ],
      seguimiento: [
        ["0%", "#c0d3e5", 0.94],
        ["55%", "#d8e5f1", 0.92],
        ["100%", "#f1f6fb", 0.9],
      ],
      riesgo: [
        ["0%", "#b7cde2", 0.94],
        ["55%", "#d1e0ee", 0.92],
        ["100%", "#edf4fb", 0.9],
      ],
    },
    linkGradients: {
      fit: [
        ["0%", "#2e71c4", 0.58],
        ["55%", "#6ea1d8", 0.44],
        ["100%", "#d7e6f5", 0.22],
      ],
      fuera: [
        ["0%", "#7d9fc4", 0.54],
        ["55%", "#aec4dc", 0.4],
        ["100%", "#e5eef8", 0.2],
      ],
      edad: [
        ["0%", "#9eb9d5", 0.38],
        ["55%", "#c2d5e8", 0.28],
        ["100%", "#edf4fb", 0.14],
      ],
      seguimiento: [
        ["0%", "#94b3d1", 0.4],
        ["55%", "#bdd2e6", 0.29],
        ["100%", "#ecf3fb", 0.14],
      ],
      riesgo: [
        ["0%", "#89aace", 0.43],
        ["55%", "#b4cbdf", 0.31],
        ["100%", "#e8f1fa", 0.16],
      ],
    },
    border: "rgba(207, 222, 241, 0.78)",
  };

  const MOTIVO_LAYOUT_ORDER = ["edad", "seguimiento", "riesgo"];

  const BASE_TOKENS = Object.freeze({
    layout: {
      canvasWidth: 460,
      canvasHeight: 256,
      innerPaddingTop: 20,
      innerPaddingBottom: 20,
      centerAreaTop: 0,
      centerAreaBottom: 0,
      innerPaddingLeft: 12,
      innerPaddingRight: 16,
      opticalCenterOffset: 0,
      sourceX: 104,
      midX: 226,
      branchX: 362,
      nodeWidth: 10,
      nodeRadius: 8,
      splitGap: 5,
      branchGapMin: 6,
      branchGapMax: 10,
      branchTopInset: 0,
      branchBottomInset: 0,
      leftCalloutOffset: 18,
      leftLeaderOffset: 22,
      rightLabelInset: 12,
      rightLeaderOffset: 16,
      rightValueGap: 20,
      connectorCurvature: 0.4,
      leaderCurvature: 0.34,
      scaleMin: 3.5,
      scaleMax: 4.7,
      mainLabelRatio: 0.54,
      totalCalloutY: 28,
      totalAnchorRatio: 0.36,
      rightAnchorRatio: 0.52,
      totalCalloutMaxChars: 16,
      rightCalloutMaxChars: 17,
      rightCalloutYOffset: -2,
      rightCalloutStep: 18,
      branchCenterMin: 9,
      segmentValueYOffset: -4,
      segmentLabelYOffset: 11,
      motivoLabelYOffset: 3,
      labelValueGap: 14.4,
      metaGap: 1.6,
      hostMinHeight: 0,
    },
    type: {
      nodeValueSize: 14,
      nodeValueWeight: 850,
      nodeLabelSize: 10,
      nodeLabelWeight: 700,
      nodeMetaSize: 9,
      nodeMetaWeight: 610,
      segmentValueSize: 14,
      segmentValueWeight: 860,
      segmentLabelSize: 10,
      segmentLabelWeight: 740,
      motivoSize: 8.4,
      motivoWeight: 760,
      descriptorLineHeight: 1.15,
      nodeValueLetterSpacing: "-0.01em",
      segmentValueLetterSpacing: "-0.01em",
      segmentLabelLetterSpacing: "0.01em",
      motivoLetterSpacing: "0.01em",
    },
    visual: {
      cardPadding: "12px 14px",
      cardRadius: "16px",
      cardBackground: "linear-gradient(180deg, var(--ppccr-surface), #fff 58%)",
      cardBorder: "var(--ppccr-border)",
      cardShadow: "var(--ppccr-shadow)",
      calloutStroke: "rgba(103, 125, 151, 0.48)",
      calloutStrokeWidth: 1.05,
      calloutOpacity: 1,
      nodeValueFill: "#0a2f51",
      nodeLabelFill: "#234668",
      nodeMetaFill: "#5b6b82",
      segmentValueFill: "#123e6a",
      segmentLabelFill: "#264f78",
      motivoFill: "#34597d",
      motivoStroke: "rgba(246, 250, 255, 0.62)",
      motivoStrokeWidth: 0.45,
      nodeStrokeWidth: 0.75,
      nodeShadowDy: 0.32,
      nodeShadowBlur: 0.4,
      nodeShadowColor: "#7d9dc0",
      nodeShadowOpacity: 0.14,
      border: COLORS.border,
      nodeGradients: COLORS.nodeGradients,
      linkGradients: COLORS.linkGradients,
    },
    copy: {
      fitCenterLabel: "Criterio FIT",
      outsideCenterLabel: "Fuera de screening",
      inlineLabels: {
        edad: "Edad < 45",
        seguimiento: "Seg. Vigente",
        riesgo: "Mayor riesgo",
      },
      totalMeta: "Entrevistados",
    },
  });

  const MODE_OVERRIDES = Object.freeze({
    desktop: {
      layout: {
        canvasWidth: 560,
        canvasHeight: 244,
        innerPaddingTop: 18,
        innerPaddingBottom: 18,
        centerAreaTop: 0,
        centerAreaBottom: 0,
        innerPaddingLeft: 12,
        innerPaddingRight: 16,
        opticalCenterOffset: -2,
        sourceX: 110,
        midX: 286,
        branchX: 452,
        nodeWidth: 14,
        nodeRadius: 10,
        splitGap: 6,
        branchGapMin: 7,
        branchGapMax: 11,
        branchTopInset: 2,
        branchBottomInset: 0,
        leftCalloutOffset: 28,
        leftLeaderOffset: 20,
        rightLabelInset: 14,
        rightLeaderOffset: 18,
        rightValueGap: 26,
        connectorCurvature: 0.4,
        leaderCurvature: 0.34,
        scaleMin: 3.78,
        scaleMax: 4.35,
        totalCalloutY: 30,
        totalCalloutMaxChars: 17,
        rightCalloutMaxChars: 17,
        rightCalloutStep: 22,
        branchCenterMin: 10,
        segmentValueYOffset: -4,
        segmentLabelYOffset: 11.5,
        motivoLabelYOffset: 3.2,
        hostMinHeight: 344,
      },
      type: {
        nodeValueSize: 15.6,
        nodeValueWeight: 860,
        nodeLabelSize: 10.4,
        nodeLabelWeight: 710,
        nodeMetaSize: 9.5,
        nodeMetaWeight: 650,
        segmentValueSize: 17,
        segmentValueWeight: 880,
        segmentLabelSize: 11.1,
        segmentLabelWeight: 760,
        motivoSize: 10.2,
        motivoWeight: 760,
        descriptorLineHeight: 1.16,
        nodeValueLetterSpacing: "-0.01em",
        segmentValueLetterSpacing: "-0.01em",
        segmentLabelLetterSpacing: "0.01em",
        motivoLetterSpacing: "0.01em",
      },
      visual: {
        cardPadding: "16px 18px 12px",
        cardRadius: "18px",
        cardBackground: "linear-gradient(180deg, #f7fbff 0%, #fff 62%)",
        cardBorder: "rgba(207, 222, 241, 0.78)",
        cardShadow: "0 8px 22px rgba(11, 78, 162, 0.06)",
        calloutStroke: "rgba(119, 143, 171, 0.56)",
        calloutStrokeWidth: 1.08,
        calloutOpacity: 1,
        nodeValueFill: "#0a2f51",
        nodeLabelFill: "#234668",
        nodeMetaFill: "#5c6f88",
        segmentValueFill: "#153f6c",
        segmentLabelFill: "#2a527b",
        motivoFill: "#31597f",
        motivoStroke: "rgba(247, 251, 255, 0.72)",
        motivoStrokeWidth: 0.35,
        nodeStrokeWidth: 0.8,
        nodeShadowDy: 0.35,
        nodeShadowBlur: 0.38,
        nodeShadowColor: "#7d9dc0",
        nodeShadowOpacity: 0.15,
      },
      copy: {
        fitCenterLabel: "FIT kits",
        outsideCenterLabel: "Fuera scr.",
        inlineLabels: {
          edad: "Edad <45",
          seguimiento: "Seguim.",
          riesgo: "Riesgo",
        },
      },
    },
    tablet: {
      layout: {
        canvasWidth: 460,
        canvasHeight: 256,
        sourceX: 104,
        midX: 226,
        branchX: 362,
        nodeWidth: 10,
        nodeRadius: 8,
        splitGap: 5,
        branchGapMin: 8,
        branchGapMax: 12,
        totalCalloutY: 28,
        leftCalloutOffset: 18,
        leftLeaderOffset: 22,
        rightLeaderOffset: 16,
        rightValueGap: 20,
      },
      type: {
        nodeValueSize: 14,
        segmentValueSize: 14,
        nodeLabelSize: 10,
        nodeMetaSize: 9,
        segmentLabelSize: 9.4,
        motivoSize: 8.4,
      },
    },
    mobile: {
      layout: {
        canvasWidth: 360,
        canvasHeight: 288,
        innerPaddingTop: 24,
        innerPaddingBottom: 24,
        centerAreaTop: 0,
        centerAreaBottom: 0,
        sourceX: 72,
        midX: 170,
        branchX: 284,
        nodeWidth: 12,
        nodeRadius: 8,
        splitGap: 7,
        branchGapMin: 8,
        branchGapMax: 12,
        leftCalloutOffset: 10,
        leftLeaderOffset: 14,
        rightLabelInset: 8,
        rightLeaderOffset: 12,
        rightValueGap: 16,
        scaleMin: 4.1,
        scaleMax: 5.4,
        totalCalloutY: 24,
        totalCalloutMaxChars: 12,
        rightCalloutStep: 20,
        branchCenterMin: 11,
      },
      type: {
        nodeValueSize: 13,
        segmentValueSize: 13,
        nodeLabelSize: 9.4,
        nodeMetaSize: 8.5,
        segmentLabelSize: 8.8,
        motivoSize: 7.7,
      },
      copy: {
        fitCenterLabel: "FIT kits",
        outsideCenterLabel: "Fuera scr.",
        inlineLabels: {
          edad: "Edad <45",
          seguimiento: "Seguim.",
          riesgo: "Riesgo",
        },
      },
    },
  });

  const SANK_DIAGRAM_TOKENS = Object.freeze({
    desktop: mergeObjects(BASE_TOKENS, MODE_OVERRIDES.desktop),
    tablet: mergeObjects(BASE_TOKENS, MODE_OVERRIDES.tablet),
    mobile: mergeObjects(BASE_TOKENS, MODE_OVERRIDES.mobile),
  });

  function pct(n, total) {
    if (!total) return 0;
    return Math.round((n / total) * 100);
  }

  function clamp(min, value, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, decimals = 2) {
    return Number(value.toFixed(decimals));
  }

  function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "class") {
        element.className = value;
        return;
      }
      if (key === "html") {
        element.innerHTML = value;
        return;
      }
      element.setAttribute(key, value);
    });
    children.forEach((child) => element.appendChild(child));
    return element;
  }

  function svgEl(tag, attrs = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function mergeObjects(base, override) {
    if (!override || typeof override !== "object" || Array.isArray(override)) {
      return base;
    }
    const output = Array.isArray(base) ? base.slice() : { ...base };
    Object.entries(override).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        base &&
        typeof base[key] === "object" &&
        !Array.isArray(base[key])
      ) {
        output[key] = mergeObjects(base[key], value);
        return;
      }
      output[key] = value;
    });
    return output;
  }

  function sankeyPath(x1, y1, x2, y2, width, curvature = 0.4) {
    const curve = Math.max(0, x2 - x1) * curvature;
    const y1Bottom = y1 + width;
    const y2Bottom = y2 + width;
    return [
      `M ${round(x1)} ${round(y1)}`,
      `C ${round(x1 + curve)} ${round(y1)} ${round(x2 - curve)} ${round(y2)} ${round(x2)} ${round(y2)}`,
      `L ${round(x2)} ${round(y2Bottom)}`,
      `C ${round(x2 - curve)} ${round(y2Bottom)} ${round(x1 + curve)} ${round(y1Bottom)} ${round(x1)} ${round(y1Bottom)}`,
      "Z",
    ].join(" ");
  }

  function toSafeInt(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.max(0, Math.round(parsed));
  }

  function normalizeInputData(inputData) {
    const source =
      inputData && typeof inputData === "object" ? inputData : DATA;
    const motivosSource = Array.isArray(source.motivos)
      ? source.motivos
      : DATA.motivos;
    const motivosByKey = new Map();

    motivosSource.forEach((motivo, index) => {
      const safeKey =
        String((motivo && motivo.key) || "").trim() || `motivo_${index + 1}`;
      const safeLabel = String((motivo && motivo.label) || safeKey).trim();
      const safeN = toSafeInt(motivo && motivo.n);

      if (!motivosByKey.has(safeKey)) {
        motivosByKey.set(safeKey, {
          key: safeKey,
          label: safeLabel,
          n: safeN,
        });
        return;
      }

      const current = motivosByKey.get(safeKey);
      current.n += safeN;
      if (!current.label && safeLabel) {
        current.label = safeLabel;
      }
    });

    const orderedMotivos = [];
    MOTIVO_LAYOUT_ORDER.forEach((preferredKey) => {
      if (!motivosByKey.has(preferredKey)) {
        return;
      }
      orderedMotivos.push(motivosByKey.get(preferredKey));
      motivosByKey.delete(preferredKey);
    });
    orderedMotivos.push(...Array.from(motivosByKey.values()));

    return {
      total: toSafeInt(source.total ?? DATA.total),
      fit: toSafeInt(source.fit ?? DATA.fit),
      fuera: toSafeInt(source.fuera ?? DATA.fuera),
      motivos: orderedMotivos,
    };
  }

  function wrapLabel(label, maxChars) {
    const words = String(label).split(" ");
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const next = current ? current + " " + word : word;
      if (next.length <= maxChars) {
        current = next;
        return;
      }
      if (current) {
        lines.push(current);
        current = word;
        return;
      }
      lines.push(word);
    });

    if (current) {
      lines.push(current);
    }

    return lines.length ? lines : [label];
  }

  function resolveSankeyMode(viewportWidth) {
    if (viewportWidth >= 1025) {
      return "desktop";
    }
    if (viewportWidth >= 621) {
      return "tablet";
    }
    return "mobile";
  }

  function getViewportWidth() {
    return Math.max(
      window.innerWidth || 0,
      document.documentElement?.clientWidth || 0,
    );
  }

  function applyContainerDesignTokens(container, tokens) {
    const { layout, type, visual, mode } = tokens;
    const style = container.style;
    const px = (value) => (typeof value === "number" ? `${value}px` : value);

    container.dataset.sankeyMode = mode;
    style.setProperty(
      "--ppccr-sankey-min-height-desktop",
      `${layout.hostMinHeight}px`,
    );
    style.setProperty("--ppccr-sankey-card-padding", visual.cardPadding);
    style.setProperty("--ppccr-sankey-card-radius", visual.cardRadius);
    style.setProperty("--ppccr-sankey-card-background", visual.cardBackground);
    style.setProperty("--ppccr-sankey-card-border", visual.cardBorder);
    style.setProperty("--ppccr-sankey-card-shadow", visual.cardShadow);
    style.setProperty("--ppccr-sankey-callout-stroke", visual.calloutStroke);
    style.setProperty(
      "--ppccr-sankey-callout-stroke-width",
      px(visual.calloutStrokeWidth),
    );
    style.setProperty(
      "--ppccr-sankey-callout-opacity",
      String(visual.calloutOpacity),
    );
    style.setProperty(
      "--ppccr-sankey-node-value-size",
      px(type.nodeValueSize),
    );
    style.setProperty(
      "--ppccr-sankey-node-value-weight",
      String(type.nodeValueWeight),
    );
    style.setProperty(
      "--ppccr-sankey-node-value-fill",
      visual.nodeValueFill,
    );
    style.setProperty(
      "--ppccr-sankey-node-value-letter-spacing",
      type.nodeValueLetterSpacing,
    );
    style.setProperty(
      "--ppccr-sankey-node-label-size",
      px(type.nodeLabelSize),
    );
    style.setProperty(
      "--ppccr-sankey-node-label-weight",
      String(type.nodeLabelWeight),
    );
    style.setProperty(
      "--ppccr-sankey-node-label-fill",
      visual.nodeLabelFill,
    );
    style.setProperty(
      "--ppccr-sankey-node-meta-size",
      px(type.nodeMetaSize),
    );
    style.setProperty(
      "--ppccr-sankey-node-meta-weight",
      String(type.nodeMetaWeight),
    );
    style.setProperty(
      "--ppccr-sankey-node-meta-fill",
      visual.nodeMetaFill,
    );
    style.setProperty(
      "--ppccr-sankey-segment-value-size",
      px(type.segmentValueSize),
    );
    style.setProperty(
      "--ppccr-sankey-segment-value-weight",
      String(type.segmentValueWeight),
    );
    style.setProperty(
      "--ppccr-sankey-segment-value-fill",
      visual.segmentValueFill,
    );
    style.setProperty(
      "--ppccr-sankey-segment-value-letter-spacing",
      type.segmentValueLetterSpacing,
    );
    style.setProperty(
      "--ppccr-sankey-segment-label-size",
      px(type.segmentLabelSize),
    );
    style.setProperty(
      "--ppccr-sankey-segment-label-weight",
      String(type.segmentLabelWeight),
    );
    style.setProperty(
      "--ppccr-sankey-segment-label-fill",
      visual.segmentLabelFill,
    );
    style.setProperty(
      "--ppccr-sankey-segment-label-letter-spacing",
      type.segmentLabelLetterSpacing,
    );
    style.setProperty("--ppccr-sankey-motivo-size", px(type.motivoSize));
    style.setProperty(
      "--ppccr-sankey-motivo-weight",
      String(type.motivoWeight),
    );
    style.setProperty("--ppccr-sankey-motivo-fill", visual.motivoFill);
    style.setProperty(
      "--ppccr-sankey-motivo-letter-spacing",
      type.motivoLetterSpacing,
    );
    style.setProperty("--ppccr-sankey-motivo-stroke", visual.motivoStroke);
    style.setProperty(
      "--ppccr-sankey-motivo-stroke-width",
      px(visual.motivoStrokeWidth),
    );
  }

  function computeDiagramLayout(data, tokens) {
    const { layout, copy } = tokens;
    const orderedMotivos = data.motivos;
    const branchCount = orderedMotivos.length;
    const totalMotivos = orderedMotivos.reduce((sum, motivo) => sum + motivo.n, 0);
    const usableHeight =
      layout.canvasHeight - layout.innerPaddingTop - layout.innerPaddingBottom;
    const branchBudget =
      usableHeight - layout.branchTopInset - layout.branchBottomInset;
    const scaleByTotal =
      (usableHeight - layout.splitGap) / Math.max(1, data.total);
    const scaleByBranches =
      branchCount > 0
        ? (branchBudget -
            layout.branchGapMin * Math.max(0, branchCount - 1)) /
          Math.max(1, totalMotivos)
        : layout.scaleMax;
    const k = clamp(
      layout.scaleMin,
      Math.min(layout.scaleMax, scaleByTotal, scaleByBranches),
      layout.scaleMax,
    );
    const branchGap =
      branchCount > 1
        ? clamp(
            layout.branchGapMin,
            (branchBudget - totalMotivos * k) / (branchCount - 1),
            layout.branchGapMax,
          )
        : 0;

    const nodes = {
      total: {
        key: "total",
        x: layout.sourceX,
        y: layout.innerPaddingTop,
        h: data.total * k,
        n: data.total,
        label: "Participantes",
        meta: copy.totalMeta,
      },
      fit: {
        key: "fit",
        x: layout.midX,
        y: layout.innerPaddingTop,
        h: data.fit * k,
        n: data.fit,
      },
      fuera: {
        key: "fuera",
        x: layout.midX,
        y: layout.innerPaddingTop + data.fit * k + layout.splitGap,
        h: data.fuera * k,
        n: data.fuera,
      },
    };

    let nextBranchY = nodes.fuera.y + layout.branchTopInset;
    const motivoNodes = orderedMotivos.map((motivo) => {
      const node = {
        key: motivo.key,
        x: layout.branchX,
        y: nextBranchY,
        h: motivo.n * k,
        n: motivo.n,
        label: motivo.label,
      };
      nextBranchY += node.h + branchGap;
      return node;
    });

    const leftFlowStartX = nodes.total.x + layout.nodeWidth;
    const leftFlowEndX = nodes.fit.x;
    const leftFlowLabelX =
      leftFlowStartX + (leftFlowEndX - leftFlowStartX) * layout.mainLabelRatio;

    return {
      data,
      tokens,
      scale: k,
      branchGap,
      usableHeight,
      nodes,
      motivoNodes,
      leftFlowLabelX,
    };
  }

  function buildGradient(defs, id, stops, direction = {}) {
    const gradient = svgEl("linearGradient", {
      id,
      x1: direction.x1 || "0%",
      y1: direction.y1 || "0%",
      x2: direction.x2 || "100%",
      y2: direction.y2 || "0%",
    });

    stops.forEach(([offset, color, opacity]) => {
      gradient.appendChild(
        svgEl("stop", {
          offset,
          "stop-color": color,
          "stop-opacity": String(opacity),
        }),
      );
    });

    defs.appendChild(gradient);
    return `url(#${id})`;
  }

  function buildPaints(defs, uid, tokens) {
    const { visual } = tokens;
    const nodeShadowId = `${uid}-node-shadow`;
    const nodeShadow = svgEl("filter", {
      id: nodeShadowId,
      x: "-28%",
      y: "-24%",
      width: "168%",
      height: "168%",
    });
    nodeShadow.appendChild(
      svgEl("feDropShadow", {
        dx: "0",
        dy: String(visual.nodeShadowDy),
        "stdDeviation": String(visual.nodeShadowBlur),
        "flood-color": visual.nodeShadowColor,
        "flood-opacity": String(visual.nodeShadowOpacity),
      }),
    );
    defs.appendChild(nodeShadow);

    const nodePaints = {
      total: buildGradient(defs, `${uid}-node-total`, visual.nodeGradients.total),
      fit: buildGradient(defs, `${uid}-node-fit`, visual.nodeGradients.fit),
      fuera: buildGradient(defs, `${uid}-node-fuera`, visual.nodeGradients.fuera),
      edad: buildGradient(defs, `${uid}-node-edad`, visual.nodeGradients.edad),
      seguimiento: buildGradient(
        defs,
        `${uid}-node-seguimiento`,
        visual.nodeGradients.seguimiento,
      ),
      riesgo: buildGradient(
        defs,
        `${uid}-node-riesgo`,
        visual.nodeGradients.riesgo,
      ),
    };

    const linkPaints = {
      fit: buildGradient(defs, `${uid}-link-fit`, visual.linkGradients.fit),
      fuera: buildGradient(defs, `${uid}-link-fuera`, visual.linkGradients.fuera),
      edad: buildGradient(defs, `${uid}-link-edad`, visual.linkGradients.edad),
      seguimiento: buildGradient(
        defs,
        `${uid}-link-seguimiento`,
        visual.linkGradients.seguimiento,
      ),
      riesgo: buildGradient(
        defs,
        `${uid}-link-riesgo`,
        visual.linkGradients.riesgo,
      ),
    };

    return {
      nodeShadowId,
      nodePaints,
      linkPaints,
    };
  }

  function appendNodeRect(group, node, tokens, paint, nodeShadowId) {
    group.appendChild(
      svgEl("rect", {
        x: round(node.x),
        y: round(node.y),
        width: tokens.layout.nodeWidth,
        height: round(node.h),
        rx: tokens.layout.nodeRadius,
        ry: tokens.layout.nodeRadius,
        fill: paint,
        stroke: tokens.visual.border,
        "stroke-width": String(tokens.visual.nodeStrokeWidth),
        filter: `url(#${nodeShadowId})`,
      }),
    );
  }

  function appendLeader(group, fromX, fromY, toX, toY, curvature) {
    const c = Math.max(8, Math.min(18, Math.abs(toX - fromX) * curvature));
    group.appendChild(
      svgEl("path", {
        d: `M ${round(fromX)} ${round(fromY)} C ${round(fromX + c)} ${round(fromY)} ${round(toX - c)} ${round(toY)} ${round(toX)} ${round(toY)}`,
        class: "callout-line",
      }),
    );
  }

  function appendCallout(group, config, tokens) {
    const { layout, type } = tokens;
    const lineHeight = round(type.nodeLabelSize * type.descriptorLineHeight, 2);
    const textAnchor = config.side === "left" ? "end" : "start";
    const hasLabel = Boolean(String(config.label || "").trim());
    const valueText = config.valueText || `N ${config.node.n}`;
    const labelLines = hasLabel
      ? wrapLabel(config.label, config.maxChars || layout.rightCalloutMaxChars)
      : [];
    const hasMeta = Boolean(String(config.meta || "").trim());
    const valueY = config.y;
    const labelY = valueY + layout.labelValueGap;
    const metaY = labelY + labelLines.length * lineHeight + layout.metaGap;

    appendLeader(
      group,
      config.fromX,
      config.fromY,
      config.toX,
      config.toY,
      layout.leaderCurvature,
    );

    const calloutGroup = svgEl("g", {});
    const valueNode = svgEl("text", {
      x: round(config.textX),
      y: round(valueY),
      "text-anchor": textAnchor,
      class: "node-value",
    });
    valueNode.textContent = valueText;
    calloutGroup.appendChild(valueNode);

    if (hasLabel) {
      const labelNode = svgEl("text", {
        x: round(config.textX),
        y: round(labelY),
        "text-anchor": textAnchor,
        class: "node-label",
      });
      labelLines.forEach((line, index) => {
        const span = svgEl("tspan", {
          x: round(config.textX),
          dy: index === 0 ? 0 : lineHeight,
        });
        span.textContent = line;
        labelNode.appendChild(span);
      });
      calloutGroup.appendChild(labelNode);
    }

    if (hasMeta) {
      const metaNode = svgEl("text", {
        x: round(config.textX),
        y: round(metaY),
        "text-anchor": textAnchor,
        class: "node-meta",
      });
      metaNode.textContent = config.meta;
      calloutGroup.appendChild(metaNode);
    }

    group.appendChild(calloutGroup);
  }

  function appendSegmentLabel(group, x, y, valueText, labelText, tokens) {
    const valueNode = svgEl("text", {
      x: round(x),
      y: round(y + tokens.layout.segmentValueYOffset),
      "text-anchor": "middle",
      class: "segment-inline-value",
    });
    valueNode.textContent = valueText;
    group.appendChild(valueNode);

    const labelNode = svgEl("text", {
      x: round(x),
      y: round(y + tokens.layout.segmentLabelYOffset),
      "text-anchor": "middle",
      class: "segment-inline-label",
    });
    labelNode.textContent = labelText;
    group.appendChild(labelNode);
  }

  function centerDiagramGroup(svg, diagramGroup, tokens) {
    if (!svg.isConnected) {
      return;
    }
    const bounds = diagramGroup.getBBox();
    if (!Number.isFinite(bounds.height) || bounds.height <= 0) {
      return;
    }

    const areaTop = tokens.layout.centerAreaTop || 0;
    const areaBottom =
      tokens.layout.canvasHeight - (tokens.layout.centerAreaBottom || 0);
    const targetCenterY =
      areaTop +
      (areaBottom - areaTop) / 2 +
      tokens.layout.opticalCenterOffset;
    const rawDeltaY = targetCenterY - (bounds.y + bounds.height / 2);
    const minDelta = areaTop - bounds.y;
    const maxDelta = areaBottom - (bounds.y + bounds.height);
    const deltaY = clamp(minDelta, rawDeltaY, maxDelta);

    diagramGroup.setAttribute(
      "transform",
      `translate(0 ${round(deltaY, 2)})`,
    );
    svg.dataset.diagramDeltaY = String(round(deltaY, 2));
  }

  function render(container, inputData, options = {}) {
    const data = normalizeInputData(inputData);
    const showHeader = options.showHeader !== false;
    const calcFuera = data.total - data.fit;
    const sumMotivos = data.motivos.reduce((acc, motivo) => acc + motivo.n, 0);
    const hasMismatch = calcFuera !== data.fuera || sumMotivos !== data.fuera;
    const mode = resolveSankeyMode(getViewportWidth());
    const tokens = {
      ...SANK_DIAGRAM_TOKENS[mode],
      mode,
    };
    const layoutData = computeDiagramLayout(data, tokens);
    const { layout, copy } = tokens;
    const { nodes, motivoNodes, leftFlowLabelX, scale } = layoutData;
    const outOffsets = { total: 0, fuera: 0 };
    const inOffsets = { fit: 0, fuera: 0 };

    motivoNodes.forEach((motivo) => {
      inOffsets[motivo.key] = 0;
    });

    applyContainerDesignTokens(container, tokens);

    const svg = svgEl("svg", {
      viewBox: `0 0 ${layout.canvasWidth} ${layout.canvasHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "Flujo de participantes y segmentación de screening",
    });
    svg.dataset.sankeyMode = mode;

    const defs = svgEl("defs", {});
    const uid = `ppccr-sankey-${Math.random().toString(36).slice(2, 8)}`;
    const paints = buildPaints(defs, uid, tokens);
    svg.appendChild(defs);

    const diagramGroup = svgEl("g", { class: "ppccr-sankey__diagram" });
    svg.appendChild(diagramGroup);

    function appendLink(fromKey, fromNode, toKey, toNode, value, fill) {
      const width = value * scale;
      const yFrom = fromNode.y + outOffsets[fromKey];
      const yTo = toNode.y + (inOffsets[toKey] || 0);

      outOffsets[fromKey] += width;
      inOffsets[toKey] = (inOffsets[toKey] || 0) + width;

      diagramGroup.appendChild(
        svgEl("path", {
          d: sankeyPath(
            fromNode.x + layout.nodeWidth,
            yFrom,
            toNode.x,
            yTo,
            width,
            layout.connectorCurvature,
          ),
          fill,
          stroke: "transparent",
        }),
      );
    }

    appendLink("total", nodes.total, "fit", nodes.fit, data.fit, paints.linkPaints.fit);
    appendLink(
      "total",
      nodes.total,
      "fuera",
      nodes.fuera,
      data.fuera,
      paints.linkPaints.fuera,
    );
    motivoNodes.forEach((motivo) => {
      appendLink(
        "fuera",
        nodes.fuera,
        motivo.key,
        motivo,
        motivo.n,
        paints.linkPaints[motivo.key] || paints.linkPaints.fuera,
      );
    });

    appendNodeRect(
      diagramGroup,
      nodes.total,
      tokens,
      paints.nodePaints.total,
      paints.nodeShadowId,
    );
    appendNodeRect(
      diagramGroup,
      nodes.fit,
      tokens,
      paints.nodePaints.fit,
      paints.nodeShadowId,
    );
    appendNodeRect(
      diagramGroup,
      nodes.fuera,
      tokens,
      paints.nodePaints.fuera,
      paints.nodeShadowId,
    );
    motivoNodes.forEach((motivo) => {
      appendNodeRect(
        diagramGroup,
        motivo,
        tokens,
        paints.nodePaints[motivo.key] || paints.nodePaints.fuera,
        paints.nodeShadowId,
      );
    });

    appendCallout(
      diagramGroup,
      {
        node: nodes.total,
        side: "left",
        textX: nodes.total.x - layout.leftCalloutOffset,
        y: nodes.total.y + layout.totalCalloutY,
        label: nodes.total.label,
        meta: nodes.total.meta,
        maxChars: layout.totalCalloutMaxChars,
        fromX: nodes.total.x,
        fromY: nodes.total.y + nodes.total.h * layout.totalAnchorRatio,
        toX: nodes.total.x - layout.leftLeaderOffset,
        toY: nodes.total.y + layout.totalCalloutY,
      },
      tokens,
    );

    appendSegmentLabel(
      diagramGroup,
      leftFlowLabelX,
      nodes.fit.y + nodes.fit.h * 0.5,
      `N ${data.fit}`,
      copy.fitCenterLabel,
      tokens,
    );
    appendSegmentLabel(
      diagramGroup,
      leftFlowLabelX,
      nodes.fuera.y + nodes.fuera.h * 0.5,
      `N ${data.fuera}`,
      copy.outsideCenterLabel,
      tokens,
    );

    const motivoLabelX = layout.branchX - layout.rightLabelInset;
    motivoNodes.forEach((motivo) => {
      const inlineLabel = copy.inlineLabels[motivo.key] || motivo.label;
      const inlineText = svgEl("text", {
        x: round(motivoLabelX),
        y: round(motivo.y + motivo.h * 0.5 + layout.motivoLabelYOffset),
        "text-anchor": "end",
        class: "motivo-inline-label",
      });
      inlineText.textContent = inlineLabel;
      diagramGroup.appendChild(inlineText);
    });

    let minCalloutY = nodes.fuera.y + layout.branchCenterMin;
    motivoNodes.forEach((motivo) => {
      const centeredY = round(
        motivo.y + Math.max(layout.branchCenterMin, motivo.h * layout.rightAnchorRatio),
        2,
      );
      const calloutY = Math.max(minCalloutY, centeredY);
      minCalloutY = calloutY + layout.rightCalloutStep;

      appendCallout(
        diagramGroup,
        {
          node: motivo,
          side: "right",
          textX: motivo.x + layout.nodeWidth + layout.rightValueGap,
          y: calloutY,
          label: "",
          meta: "",
          maxChars: layout.rightCalloutMaxChars,
          fromX: motivo.x + layout.nodeWidth,
          fromY: motivo.y + motivo.h * layout.rightAnchorRatio,
          toX: motivo.x + layout.nodeWidth + layout.rightLeaderOffset,
          toY: calloutY + layout.rightCalloutYOffset,
        },
        tokens,
      );
    });

    const vizClass = showHeader ? "viz" : "viz viz--solo";
    const viz = el("div", { class: vizClass }, [svg]);

    container.innerHTML = "";
    if (showHeader) {
      container.appendChild(
        el("div", { class: "head" }, [
          el("div", {}, [
            el("h3", { html: "Flujo de participantes" }),
            el("p", {
              class: "sub",
              html: "Participantes y segmentación de screening",
            }),
          ]),
        ]),
      );
    }
    container.appendChild(viz);

    if (hasMismatch) {
      container.appendChild(
        el("div", {
          class: "legend",
          html: "Revisar datos: inconsistencia detectada",
        }),
      );
    }

    centerDiagramGroup(svg, diagramGroup, tokens);
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => centerDiagramGroup(svg, diagramGroup, tokens));
    }
  }

  function boot() {
    window.PPCCR_SANK = { render };
    const host = document.getElementById("ppccrSankeyParticipantes");
    if (!host) return;
    render(host, DATA);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
