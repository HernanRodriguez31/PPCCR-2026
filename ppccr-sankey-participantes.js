(() => {
  const DATA = {
    total: 35,
    fit: 20,
    fuera: 15,
    motivos: [
      { key: "riesgo", label: "Mayor riesgo (orientación)", n: 7 },
      { key: "seguimiento", label: "Seg. Vigente", n: 4 },
      { key: "edad", label: "Edad < 45", n: 4 }
    ]
  };

  const COLORS = {
    nodeMain: "#0f58b5",
    nodeFit: "#3b87ea",
    nodeFuera: "#8faac6",
    motivoNodes: {
      riesgo: "#9ab0c8",
      seguimiento: "#afc1d5",
      edad: "#c2d0e0"
    },
    linkFit: "rgba(104,151,219,.52)",
    linkFuera: "rgba(169,190,214,.46)",
    linkMotivos: {
      riesgo: "rgba(155,176,201,.46)",
      seguimiento: "rgba(171,191,213,.46)",
      edad: "rgba(189,205,223,.46)"
    },
    nodeGradients: {
      total: [
        ["0%", "#0a4a9a", 1],
        ["55%", "#176ac1", 0.98],
        ["100%", "#3e8fdf", 0.96],
      ],
      fit: [
        ["0%", "#4f88c9", 0.98],
        ["55%", "#73a7dd", 0.96],
        ["100%", "#a8c9ea", 0.95],
      ],
      fuera: [
        ["0%", "#89a8c9", 0.96],
        ["55%", "#a8bfd9", 0.95],
        ["100%", "#d0deed", 0.94],
      ],
      edad: [
        ["0%", "#a8bfd8", 0.94],
        ["55%", "#c4d5e7", 0.92],
        ["100%", "#e1ebf6", 0.9],
      ],
      seguimiento: [
        ["0%", "#9eb7d2", 0.94],
        ["55%", "#bfd1e4", 0.92],
        ["100%", "#dde8f4", 0.9],
      ],
      riesgo: [
        ["0%", "#96b0cc", 0.94],
        ["55%", "#b8ccdf", 0.92],
        ["100%", "#d7e4f2", 0.9],
      ]
    },
    linkGradients: {
      fit: [
        ["0%", "#2f72c4", 0.62],
        ["55%", "#6a9fd8", 0.48],
        ["100%", "#c2d8ef", 0.3],
      ],
      fuera: [
        ["0%", "#5d87b4", 0.56],
        ["55%", "#8fb0d2", 0.43],
        ["100%", "#d0e0f0", 0.28],
      ],
      edad: [
        ["0%", "#7ca1c5", 0.5],
        ["55%", "#a7c1da", 0.36],
        ["100%", "#deebf7", 0.22],
      ],
      seguimiento: [
        ["0%", "#769cc2", 0.5],
        ["55%", "#a3bed8", 0.36],
        ["100%", "#dbe9f6", 0.22],
      ],
      riesgo: [
        ["0%", "#6e94bc", 0.52],
        ["55%", "#9bb8d4", 0.38],
        ["100%", "#d7e6f5", 0.24],
      ]
    },
    border: "rgba(222,234,248,.98)"
  };
  const MOTIVO_LAYOUT_ORDER = ["edad", "seguimiento", "riesgo"];

  function pct(n, total) {
    if (!total) return 0;
    return Math.round((n / total) * 100);
  }

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    children.forEach((c) => e.appendChild(c));
    return e;
  }

  function svgEl(tag, attrs = {}) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function sankeyPath(x1, y1, x2, y2, w) {
    const c = (x2 - x1) * 0.4;
    const y1b = y1 + w;
    const y2b = y2 + w;

    return [
      `M ${x1} ${y1}`,
      `C ${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`,
      `L ${x2} ${y2b}`,
      `C ${x2 - c} ${y2b} ${x1 + c} ${y1b} ${x1} ${y1b}`,
      "Z"
    ].join(" ");
  }

  function logScaledDistribution(values, targetTotal) {
    const weights = values.map((value) => Math.log1p(Math.max(0, Number(value) || 0)));
    const weightSum = weights.reduce((acc, value) => acc + value, 0);
    if (!weightSum || !targetTotal) {
      return values.map(() => 0);
    }
    return weights.map((weight) => (targetTotal * weight) / weightSum);
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

  function render(container, inputData) {
    const data = inputData || DATA;
    const calcFuera = data.total - data.fit;
    const sumMotivos = data.motivos.reduce((acc, motivo) => acc + motivo.n, 0);
    const hasMismatch = calcFuera !== data.fuera || sumMotivos !== data.fuera;

    const W = 520;
    const H = 236;
    const x0 = 130;
    const x1 = 254;
    const x2 = 402;
    const y0 = 28;
    const nodeW = 10;
    const splitGap = 5;
    const motivoGap = 6;

    const k = Math.max(3.5, Math.min(4.4, 150 / Math.max(1, data.total)));

    const nodes = {
      total: {
        key: "total",
        x: x0,
        y: y0,
        h: data.total * k,
        c: COLORS.nodeMain,
        label: "Participantes",
        n: data.total,
        meta: "Entrevistados"
      },
      fit: {
        key: "fit",
        x: x1,
        y: y0,
        h: data.fit * k,
        c: COLORS.nodeFit,
        label: "Criterio FIT (kits)",
        n: data.fit,
        meta: `${pct(data.fit, data.total)}% del total`
      },
      fuera: {
        key: "fuera",
        x: x1,
        y: y0 + data.fit * k + splitGap,
        h: data.fuera * k,
        c: COLORS.nodeFuera,
        label: "Fuera de screening",
        n: data.fuera,
        meta: `${pct(data.fuera, data.total)}% del total`
      }
    };

    const motivosByKey = {};
    data.motivos.forEach((motivo) => {
      motivosByKey[motivo.key] = motivo;
    });
    const orderedMotivos = MOTIVO_LAYOUT_ORDER.map((key) => motivosByKey[key]).filter(
      Boolean,
    );

    const motivoDisplayValues = logScaledDistribution(
      orderedMotivos.map((motivo) => motivo.n),
      data.fuera,
    );

    let yMotivo = nodes.fuera.y + 2;
    const motivoNodes = orderedMotivos.map((motivo, index) => {
      const displayValue = motivoDisplayValues[index];
      const h = displayValue * k;
      const node = {
        key: motivo.key,
        x: x2,
        y: yMotivo,
        h,
        n: motivo.n,
        label: motivo.label,
        meta: "",
        c: COLORS.motivoNodes[motivo.key] || COLORS.nodeFuera,
        displayValue
      };
      yMotivo += h + motivoGap;
      return node;
    });

    const outOff = { total: 0, fuera: 0 };
    const inOff = { fit: 0, fuera: 0 };
    motivoNodes.forEach((motivo) => {
      inOff[motivo.key] = 0;
    });

    function link(fromKey, fromNode, toKey, toNode, value, fill) {
      const w = value * k;
      const yFrom = fromNode.y + outOff[fromKey];
      const yTo = toNode.y + (inOff[toKey] || 0);

      outOff[fromKey] += w;
      inOff[toKey] = (inOff[toKey] || 0) + w;

      return svgEl("path", {
        d: sankeyPath(fromNode.x + nodeW, yFrom, toNode.x, yTo, w),
        fill,
        stroke: "transparent"
      });
    }

    const svg = svgEl("svg", {
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
      "aria-label": "Flujo de participantes y segmentación de screening"
    });

    const gradientUid = `ppccr-sankey-${Math.random().toString(36).slice(2, 8)}`;
    const defs = svgEl("defs", {});

    function addLinearGradient(id, stops, direction = {}) {
      const gradient = svgEl("linearGradient", {
        id,
        x1: direction.x1 || "0%",
        y1: direction.y1 || "0%",
        x2: direction.x2 || "100%",
        y2: direction.y2 || "0%"
      });
      stops.forEach(([offset, color, opacity]) => {
        gradient.appendChild(
          svgEl("stop", {
            offset,
            "stop-color": color,
            "stop-opacity": String(opacity)
          }),
        );
      });
      defs.appendChild(gradient);
      return `url(#${id})`;
    }

    const nodeShadowId = `${gradientUid}-node-shadow`;
    const nodeShadow = svgEl("filter", {
      id: nodeShadowId,
      x: "-30%",
      y: "-25%",
      width: "170%",
      height: "170%"
    });
    nodeShadow.appendChild(
      svgEl("feDropShadow", {
        dx: "0",
        dy: "0.5",
        "stdDeviation": "0.55",
        "flood-color": "#7ea2c9",
        "flood-opacity": "0.28"
      }),
    );
    defs.appendChild(nodeShadow);

    const nodePaints = {
      total: addLinearGradient(`${gradientUid}-node-total`, COLORS.nodeGradients.total, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      }),
      fit: addLinearGradient(`${gradientUid}-node-fit`, COLORS.nodeGradients.fit, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      }),
      fuera: addLinearGradient(`${gradientUid}-node-fuera`, COLORS.nodeGradients.fuera, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      }),
      edad: addLinearGradient(`${gradientUid}-node-edad`, COLORS.nodeGradients.edad, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      }),
      seguimiento: addLinearGradient(`${gradientUid}-node-seguimiento`, COLORS.nodeGradients.seguimiento, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      }),
      riesgo: addLinearGradient(`${gradientUid}-node-riesgo`, COLORS.nodeGradients.riesgo, {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "0%"
      })
    };

    const linkPaints = {
      fit: addLinearGradient(`${gradientUid}-link-fit`, COLORS.linkGradients.fit),
      fuera: addLinearGradient(`${gradientUid}-link-fuera`, COLORS.linkGradients.fuera),
      edad: addLinearGradient(`${gradientUid}-link-edad`, COLORS.linkGradients.edad),
      seguimiento: addLinearGradient(`${gradientUid}-link-seguimiento`, COLORS.linkGradients.seguimiento),
      riesgo: addLinearGradient(`${gradientUid}-link-riesgo`, COLORS.linkGradients.riesgo)
    };

    svg.appendChild(defs);

    svg.appendChild(link("total", nodes.total, "fit", nodes.fit, data.fit, linkPaints.fit));
    svg.appendChild(link("total", nodes.total, "fuera", nodes.fuera, data.fuera, linkPaints.fuera));

    motivoNodes.forEach((motivo) => {
      svg.appendChild(
        link(
          "fuera",
          nodes.fuera,
          motivo.key,
          motivo,
          motivo.displayValue,
          linkPaints[motivo.key] || linkPaints.fuera,
        ),
      );
    });

    function nodeRect(node) {
      return svgEl("rect", {
        x: node.x,
        y: node.y,
        width: nodeW,
        height: node.h,
        rx: 8,
        ry: 8,
        fill: nodePaints[node.key] || node.c,
        stroke: COLORS.border,
        "stroke-width": 1,
        filter: `url(#${nodeShadowId})`
      });
    }

    svg.appendChild(nodeRect(nodes.total));
    svg.appendChild(nodeRect(nodes.fit));
    svg.appendChild(nodeRect(nodes.fuera));
    motivoNodes.forEach((motivo) => svg.appendChild(nodeRect(motivo)));

    function addLeader(fromX, fromY, toX, toY) {
      const c = Math.max(8, Math.min(18, Math.abs(toX - fromX) * 0.34));
      svg.appendChild(
        svgEl("path", {
          d: `M ${fromX} ${fromY} C ${fromX + c} ${fromY} ${toX - c} ${toY} ${toX} ${toY}`,
          class: "callout-line"
        }),
      );
    }

    function addCallout(config) {
      const side = config.side || "right";
      const value = config.valueText || `N ${config.node.n}`;
      const hasCustomLabel = Object.prototype.hasOwnProperty.call(config, "label");
      const hasCustomMeta = Object.prototype.hasOwnProperty.call(config, "meta");
      const label = hasCustomLabel ? config.label : config.node.label;
      const meta = hasCustomMeta ? config.meta : (config.node.meta || "");
      const hasLabel = Boolean(String(label || "").trim());
      const labelLines = hasLabel ? wrapLabel(label, config.maxChars || 22) : [];
      const textAnchor = side === "left" ? "end" : "start";
      const lineHeight = 10;
      const valueY = config.y;
      const labelY = valueY + 14;
      const metaY = hasLabel
        ? labelY + labelLines.length * lineHeight + 1
        : valueY + lineHeight + 2;

      addLeader(config.fromX, config.fromY, config.toX, config.toY);

      const g = svgEl("g", {});
      const valueNode = svgEl("text", {
        x: config.textX,
        y: valueY,
        "text-anchor": textAnchor,
        class: "node-value"
      });
      valueNode.textContent = value;
      g.appendChild(valueNode);

      if (hasLabel) {
        const labelNode = svgEl("text", {
          x: config.textX,
          y: labelY,
          "text-anchor": textAnchor,
          class: "node-label"
        });
        labelLines.forEach((line, index) => {
          const span = svgEl("tspan", {
            x: config.textX,
            dy: index === 0 ? 0 : lineHeight
          });
          span.textContent = line;
          labelNode.appendChild(span);
        });
        g.appendChild(labelNode);
      }

      if (meta) {
        const metaNode = svgEl("text", {
          x: config.textX,
          y: metaY,
          "text-anchor": textAnchor,
          class: "node-meta"
        });
        metaNode.textContent = meta;
        g.appendChild(metaNode);
      }

      svg.appendChild(g);
    }

    function addNodeCenterLabel(node, valueText, labelText, options = {}) {
      const centerX =
        typeof options.x === "number" ? options.x : node.x + nodeW / 2;
      const centerY =
        typeof options.y === "number" ? options.y : node.y + node.h / 2;

      const valueNode = svgEl("text", {
        x: centerX,
        y: centerY - 4,
        "text-anchor": "middle",
        class: "segment-inline-value"
      });
      valueNode.textContent = valueText;
      svg.appendChild(valueNode);

      const labelNode = svgEl("text", {
        x: centerX,
        y: centerY + 10,
        "text-anchor": "middle",
        class: "segment-inline-label"
      });
      labelNode.textContent = labelText;
      svg.appendChild(labelNode);
    }

    addCallout({
      node: nodes.total,
      side: "left",
      textX: x0 - 18,
      y: nodes.total.y + 28,
      maxChars: 16,
      fromX: nodes.total.x,
      fromY: nodes.total.y + nodes.total.h * 0.36,
      toX: x0 - 22,
      toY: nodes.total.y + 30,
    });

    const leftFlowStartX = nodes.total.x + nodeW;
    const leftFlowEndX = nodes.fit.x;
    const leftFlowLabelX =
      leftFlowStartX + (leftFlowEndX - leftFlowStartX) * 0.54;

    addNodeCenterLabel(nodes.fit, "N 20", "Criterio FIT", {
      x: leftFlowLabelX,
      y: nodes.fit.y + nodes.fit.h * 0.5,
    });
    addNodeCenterLabel(nodes.fuera, "N 15", "Fuera de screening", {
      x: leftFlowLabelX,
      y: nodes.fuera.y + nodes.fuera.h * 0.5,
    });

    const motivoInlineLabels = {
      edad: "Edad < 45",
      seguimiento: "Seg. Vigente",
      riesgo: "Mayor riesgo",
    };
    const motivoInlineLabelX = x2 - 12;

    motivoNodes.forEach((motivo) => {
      const inlineLabel = motivoInlineLabels[motivo.key] || motivo.label;
      const inlineText = svgEl("text", {
        x: motivoInlineLabelX,
        y: motivo.y + motivo.h * 0.5 + 3,
        "text-anchor": "end",
        class: "motivo-inline-label"
      });
      inlineText.textContent = inlineLabel;
      svg.appendChild(inlineText);
    });

    const motivoRows = [
      nodes.fuera.y + 4,
      nodes.fuera.y + 36,
      nodes.fuera.y + 70,
    ];

    motivoNodes.forEach((motivo, index) => {
      addCallout({
        node: motivo,
        side: "right",
        textX: x2 + nodeW + 20,
        y: motivoRows[index],
        label: "",
        maxChars: 17,
        meta: "",
        fromX: motivo.x + nodeW,
        fromY: motivo.y + motivo.h * 0.52,
        toX: x2 + nodeW + 16,
        toY: motivoRows[index] - 2,
      });
    });

    container.innerHTML = "";
    container.appendChild(
      el("div", { class: "head" }, [
        el("div", {}, [
          el("h3", { html: "Flujo de participantes" }),
          el("p", { class: "sub", html: "Participantes y segmentación de screening" })
        ])
      ]),
    );

    container.appendChild(el("div", { class: "viz" }, [svg]));

    if (hasMismatch) {
      container.appendChild(
        el("div", { class: "legend", html: "Revisar datos: inconsistencia detectada" }),
      );
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
