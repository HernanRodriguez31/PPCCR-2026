(() => {
  const DATA = {
    total: 35,
    fit: 20,
    fuera: 15,
    motivos: [
      { key: "riesgo", label: "Mayor riesgo (orientación)", n: 7 },
      { key: "seguimiento", label: "Seguimiento vigente", n: 4 },
      { key: "edad", label: "Edad < 45", n: 4 }
    ]
  };

  const COLORS = {
    nodeMain: "#0b4ea2",
    nodeFit: "#2a78e4",
    nodeFuera: "#7e9ec2",
    motivoNodes: {
      riesgo: "#8ca4c0",
      seguimiento: "#9db2cb",
      edad: "#b4c4d8"
    },
    linkFit: "rgba(42,120,228,.46)",
    linkFuera: "rgba(126,158,194,.42)",
    linkMotivos: {
      riesgo: "rgba(140,164,192,.45)",
      seguimiento: "rgba(157,178,203,.45)",
      edad: "rgba(180,196,216,.45)"
    },
    border: "rgba(226,236,249,1)"
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

    const W = 560;
    const H = 214;
    const x0 = 96;
    const x1 = 220;
    const x2 = 368;
    const y0 = 18;
    const nodeW = 10;
    const splitGap = 5;
    const motivoGap = 6;

    const k = Math.max(3.3, Math.min(4.1, 132 / Math.max(1, data.total)));

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

    svg.appendChild(link("total", nodes.total, "fit", nodes.fit, data.fit, COLORS.linkFit));
    svg.appendChild(link("total", nodes.total, "fuera", nodes.fuera, data.fuera, COLORS.linkFuera));

    motivoNodes.forEach((motivo) => {
      svg.appendChild(
        link(
          "fuera",
          nodes.fuera,
          motivo.key,
          motivo,
          motivo.displayValue,
          COLORS.linkMotivos[motivo.key] || COLORS.linkFuera,
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
        fill: node.c,
        stroke: COLORS.border
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
      const label = config.label || config.node.label;
      const meta = config.meta || config.node.meta || "";
      const labelLines = wrapLabel(label, config.maxChars || 22);
      const textAnchor = side === "left" ? "end" : "start";
      const lineHeight = 10;
      const valueY = config.y;
      const labelY = valueY + 14;
      const metaY = labelY + labelLines.length * lineHeight + 1;

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
      leftFlowStartX + (leftFlowEndX - leftFlowStartX) * 0.45;

    addNodeCenterLabel(nodes.fit, "N 20", "Criterio FIT", {
      x: leftFlowLabelX,
      y: nodes.fit.y + nodes.fit.h * 0.5,
    });
    addNodeCenterLabel(nodes.fuera, "N 15", "Fuera de screening", {
      x: leftFlowLabelX,
      y: nodes.fuera.y + nodes.fuera.h * 0.5,
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
