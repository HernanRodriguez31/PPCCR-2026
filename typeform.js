"use strict";

const TYPEFORM_HOST_MAP = {
  "cuestionario.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/X2jtQ7NT",
    title: "Cuestionario inicial",
    subtitle: "Registro inicial para evaluar elegibilidad y antecedentes clínicos.",
  },
  "entrevista.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/xP8fOLC4",
    title: "Entrevista médica",
    subtitle: "Carga estructurada de entrevista clínica y seguimiento médico.",
  },
  "kitfit.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/CA9UQXTK",
    title: "Entrega de kit FIT",
    subtitle: "Registro operativo de entrega de kit FIT al participante.",
  },
  "recepcionmuestra.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/ICgvwiBh",
    title: "Recepción de muestra FIT",
    subtitle: "Validación de recepción y trazabilidad de muestra FIT.",
  },
  "enviolab.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/EDtlnghR",
    title: "Envío al laboratorio",
    subtitle: "Control de envío de muestras al laboratorio de referencia.",
  },
  "recepcionresultados.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/zbS6LWx7",
    title: "Recepción de resultados FIT",
    subtitle: "Registro de resultados recibidos y estado de cierre operativo.",
  },
  "informeprograma.programadeprevencion.com": {
    url: "https://9kxsjveuebz.typeform.com/to/CPDHPjyy",
    title: "Informe de resultados al paciente",
    subtitle: "Informe clínico de resultados y acciones de continuidad.",
  },
};

const TYPEFORM_SCRIPT_SRC = "https://embed.typeform.com/next/embed.js";
let embedScriptPromise;

function getRequestedHost() {
  const params = new URLSearchParams(window.location.search);
  const previewHost = params.get("host");
  const host = previewHost || window.location.hostname;
  return String(host || "").toLowerCase();
}

function getFormId(typeformUrl) {
  const match = String(typeformUrl).match(/\/to\/([A-Za-z0-9]+)/);
  return match ? match[1] : "";
}

function withSourceParam(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.set("typeform-source", window.location.hostname);
  return url.toString();
}

function setScreenText({ title, subtitle, status }) {
  const titleEl = document.getElementById("form-title");
  const subtitleEl = document.getElementById("form-subtitle");
  const statusEl = document.getElementById("form-status");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (statusEl) statusEl.textContent = status;

  document.title = `PPCCR | ${title}`;
}

function showFallback(url, customMessage) {
  const fallbackEl = document.getElementById("form-fallback");
  const directLinkEl = document.getElementById("form-direct-link");

  if (!fallbackEl || !directLinkEl) return;

  fallbackEl.hidden = false;

  if (url) {
    directLinkEl.href = url;
    directLinkEl.textContent = "Typeform";
    directLinkEl.hidden = false;
  } else {
    directLinkEl.href = "https://programadeprevencion.com/";
    directLinkEl.textContent = "portal principal";
    directLinkEl.hidden = false;
  }

  if (customMessage) {
    const firstParagraph = fallbackEl.querySelector("p");
    if (firstParagraph) firstParagraph.textContent = customMessage;
  }
}

function hideStatusAndFallback() {
  const statusEl = document.getElementById("form-status");
  const fallbackEl = document.getElementById("form-fallback");
  if (statusEl) statusEl.hidden = true;
  if (fallbackEl) fallbackEl.hidden = true;
}

function ensureTypeformScript() {
  if (window.tf && typeof window.tf.createWidget === "function") {
    return Promise.resolve();
  }

  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TYPEFORM_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.tf && typeof window.tf.createWidget === "function") {
        resolve();
      } else {
        reject(new Error("Typeform embed API no disponible."));
      }
    };
    script.onerror = () => reject(new Error("No se pudo cargar embed.typeform.com"));
    document.head.appendChild(script);
  });

  return embedScriptPromise;
}

function renderIframeFallback(typeformUrl, title) {
  const container = document.getElementById("typeform-container");
  const statusEl = document.getElementById("form-status");
  if (!container) return;

  container.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = withSourceParam(typeformUrl);
  iframe.title = `PPCCR - ${title}`;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "fullscreen";
  container.appendChild(iframe);

  if (statusEl) {
    statusEl.hidden = true;
  }
}

async function initTypeformPage() {
  const host = getRequestedHost();
  const formConfig = TYPEFORM_HOST_MAP[host];

  if (!formConfig) {
    setScreenText({
      title: "Formulario no configurado",
      subtitle: "Este subdominio no tiene un formulario asignado.",
      status:
        "Revisá el subdominio o volvé al portal principal para acceder a los formularios operativos.",
    });
    showFallback("", "No encontramos un formulario asociado a este subdominio.");
    return;
  }

  setScreenText({
    title: formConfig.title,
    subtitle: formConfig.subtitle,
    status: "Cargando formulario...",
  });

  const container = document.getElementById("typeform-container");
  if (!container) return;

  try {
    await ensureTypeformScript();

    container.innerHTML = "";
    const formId = getFormId(formConfig.url);
    if (!formId) throw new Error("No se pudo obtener el ID del formulario.");

    window.tf.createWidget(formId, {
      container,
      iframeProps: {
        title: `PPCCR - ${formConfig.title}`,
        referrerPolicy: "strict-origin-when-cross-origin",
      },
      medium: "snippet",
      onReady: () => {
        hideStatusAndFallback();
      },
    });
  } catch (error) {
    renderIframeFallback(formConfig.url, formConfig.title);
    showFallback(formConfig.url, "No pudimos cargar el formulario embebido automáticamente.");
  }
}

document.addEventListener("DOMContentLoaded", initTypeformPage);
