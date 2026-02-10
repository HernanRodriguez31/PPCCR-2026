"use strict";

/**
 * Gatekeeper modal de autenticación client-side (control UX, no seguridad real).
 * Módulo reutilizable para todas las páginas que cargan este script.
 */
(() => {
  const AUTH_MODAL_ID = "auth-gate";
  const AUTH_PASS = "marzo31";
  const AUTH_CLOSE_CLASS = "auth-gate--closing";
  const AUTH_HIDING_CLASS = "is-hiding";
  const VIEWPORT_MQ = "(max-width: 767.98px)";

  const STORAGE_KEYS = {
    authFlag: "ppccr_auth",
    authFlagAlt: "ppccr_auth_ok",
    station: "ppccr_station",
    stationId: "ppccr_station_id",
    stationLegacy: "ppccr_auth_user",
  };

  const STATIONS = [
    { id: "saavedra", name: "Parque Saavedra" },
    { id: "aristobulo", name: "Aristóbulo del Valle" },
    { id: "rivadavia", name: "Parque Rivadavia" },
    { id: "chacabuco", name: "Parque Chacabuco" },
    { id: "admin", name: "Administrador" },
  ];

  /** @type {Map<string, {id: string, name: string}>} */
  const STATION_BY_ID = new Map();
  /** @type {Map<string, {id: string, name: string}>} */
  const STATION_BY_NAME = new Map();

  STATIONS.forEach((station) => {
    STATION_BY_ID.set(station.id, station);
    STATION_BY_NAME.set(foldText(station.name), station);
  });

  /** @type {MediaQueryList | null} */
  let authMq = null;
  /** @type {HTMLElement | null} */
  let lastFocusedBeforeGate = null;
  /** @type {(() => void) | null} */
  let viewportChangeHandler = null;
  /** @type {number} */
  let headerSyncRaf = 0;
  /** @type {boolean} */
  let headerSyncBound = false;
  /** @type {ResizeObserver | null} */
  let headerResizeObserver = null;
  /** @type {boolean} */
  let interactionsBound = false;
  /** @type {boolean} */
  let stationTriggerBound = false;

  /** @type {"login" | "switch"} */
  let gateMode = "login";
  /** @type {string} */
  let selectedStationId = "";
  /** @type {boolean} */
  let isAuthenticating = false;
  /** @type {boolean} */
  let isPassVisible = false;

  /**
   * @param {string} value
   * @returns {string}
   */
  function normalizePass(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  function foldText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  function safeSessionGet(key) {
    try {
      return sessionStorage.getItem(key) || "";
    } catch (error) {
      console.warn("[auth-gate] No se pudo leer sessionStorage", error);
      return "";
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function safeSessionSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn("[auth-gate] No se pudo escribir sessionStorage", error);
    }
  }

  /**
   * @param {unknown} stationCandidate
   * @returns {{id: string, name: string} | null}
   */
  function resolveStation(stationCandidate) {
    if (!stationCandidate) return null;

    if (typeof stationCandidate === "string") {
      const trimmed = stationCandidate.trim();
      if (!trimmed) return null;

      const byId = STATION_BY_ID.get(trimmed.toLowerCase());
      if (byId) return byId;

      const byName = STATION_BY_NAME.get(foldText(trimmed));
      if (byName) return byName;

      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return resolveStation(parsed);
        } catch {
          return null;
        }
      }

      return null;
    }

    if (typeof stationCandidate === "object") {
      const maybeStation = /** @type {{id?: unknown, stationId?: unknown, name?: unknown, stationName?: unknown}} */ (
        stationCandidate
      );

      const stationId = String(maybeStation.id ?? maybeStation.stationId ?? "")
        .trim()
        .toLowerCase();
      if (stationId) {
        const byId = STATION_BY_ID.get(stationId);
        if (byId) return byId;
      }

      const stationName = String(maybeStation.name ?? maybeStation.stationName ?? "").trim();
      if (stationName) {
        const byName = STATION_BY_NAME.get(foldText(stationName));
        if (byName) return byName;
      }
    }

    return null;
  }

  /**
   * @returns {boolean}
   */
  function isAuthFlagEnabled() {
    const valid = new Set(["1", "true", "ok", "yes"]);
    const mainFlag = safeSessionGet(STORAGE_KEYS.authFlag).trim().toLowerCase();
    const altFlag = safeSessionGet(STORAGE_KEYS.authFlagAlt).trim().toLowerCase();
    return valid.has(mainFlag) || valid.has(altFlag);
  }

  function setAuthFlagEnabled() {
    safeSessionSet(STORAGE_KEYS.authFlag, "1");
    safeSessionSet(STORAGE_KEYS.authFlagAlt, "1");
  }

  /**
   * @returns {{id: string, name: string} | null}
   */
  function readStationFromStorage() {
    const primary = resolveStation(safeSessionGet(STORAGE_KEYS.station));
    if (primary) return primary;

    const byId = resolveStation(safeSessionGet(STORAGE_KEYS.stationId));
    if (byId) return byId;

    const legacy = resolveStation(safeSessionGet(STORAGE_KEYS.stationLegacy));
    if (legacy) return legacy;

    return null;
  }

  /**
   * @returns {{id: string, name: string} | null}
   */
  function getStoredStation() {
    const station = readStationFromStorage();
    if (!station) return null;

    if (isAuthFlagEnabled()) return station;

    // Compatibilidad con sesiones previas que solo persistían estación.
    const hasAnyLegacy = Boolean(
      safeSessionGet(STORAGE_KEYS.station) || safeSessionGet(STORAGE_KEYS.stationLegacy),
    );
    return hasAnyLegacy ? station : null;
  }

  /**
   * @param {{id: string, name: string}} station
   */
  function setStoredStation(station) {
    const payload = {
      id: station.id,
      name: station.name,
      ts: Date.now(),
    };

    setAuthFlagEnabled();
    safeSessionSet(STORAGE_KEYS.station, JSON.stringify(payload));
    safeSessionSet(STORAGE_KEYS.stationId, station.id);
    // Compatibilidad con implementación previa.
    safeSessionSet(STORAGE_KEYS.stationLegacy, station.name);
  }

  /**
   * @param {{id: string, name: string} | null} station
   */
  function syncBodyStationDataset(station) {
    if (!document.body) return;

    if (!station) {
      delete document.body.dataset.station;
      delete document.body.dataset.stationName;
      return;
    }

    document.body.dataset.station = station.id;
    document.body.dataset.stationName = station.name;
  }

  /**
   * @param {{id: string, name: string}} station
   */
  function emitStationChanged(station) {
    window.dispatchEvent(
      new CustomEvent("ppccr:stationChanged", {
        detail: {
          stationId: station.id,
          stationName: station.name,
        },
      }),
    );
  }

  /**
   * @returns {{stationId: string, stationName: string, id: string, name: string} | null}
   */
  function getStationPublicState() {
    const station = getStoredStation();
    if (!station) return null;

    return {
      stationId: station.id,
      stationName: station.name,
      id: station.id,
      name: station.name,
    };
  }

  /**
   * @param {(detail: {stationId: string, stationName: string}) => void} handler
   * @returns {() => void}
   */
  function onStationChange(handler) {
    if (typeof handler !== "function") {
      return () => {};
    }

    const wrapped = (event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = /** @type {{stationId?: string, stationName?: string}} */ (
        event.detail || {}
      );
      if (!detail.stationId || !detail.stationName) return;
      handler({ stationId: detail.stationId, stationName: detail.stationName });
    };

    window.addEventListener("ppccr:stationChanged", wrapped);
    return () => window.removeEventListener("ppccr:stationChanged", wrapped);
  }

  function setupGlobalStationApi() {
    window.PPCCR = window.PPCCR || {};
    window.PPCCR.station = {
      get: () => getStationPublicState(),
      set: (stationId) => {
        const station = resolveStation(stationId);
        if (!station) return;
        applyStationState(station, { emit: true, render: true });
      },
      openSwitcher: () => {
        openStationSwitcher();
      },
      onChange: (fn) => onStationChange(fn),
    };
  }

  /**
   * @returns {string}
   */
  function getAuthLogoSrc() {
    const existingLogo =
      document.querySelector(".brand-ribbon") ||
      document.querySelector(".wf-brand__logo") ||
      document.querySelector(".kf-brand__logo") ||
      document.querySelector(".roles-brand__logo") ||
      document.querySelector(".telemed-brand__logo") ||
      document.querySelector(".page-algoritmo__brand-logo") ||
      document.querySelector('img[src*="logo"]');

    if (existingLogo && existingLogo.getAttribute("src")) {
      return existingLogo.getAttribute("src") || "assets/logo-ppccr.png";
    }

    return "assets/logo-ppccr.png";
  }

  /**
   * @param {{id: string, name: string}} station
   * @returns {string}
   */
  function getStationTileLabelMarkup(station) {
    if (station.id === "aristobulo") {
      return `
        <span class="station-tile__label">
          <span class="station-tile__line">Aristóbulo</span>
          <span class="station-tile__line">del Valle</span>
        </span>
      `;
    }

    return `<span class="station-tile__label"><span class="station-tile__line">${station.name}</span></span>`;
  }

  /**
   * Crea el modal si todavía no existe en la página.
   */
  function ensureAuthGateExists() {
    if (document.getElementById(AUTH_MODAL_ID)) return;

    const logoSrc = getAuthLogoSrc();
    const stationsMarkup = STATIONS.map(
      (station) => `
        <button
          type="button"
          class="auth-station auth-tile station-tile"
          data-station-id="${station.id}"
          data-station="${station.id}"
          data-station-name="${station.name}"
          aria-pressed="false"
        >
          ${getStationTileLabelMarkup(station)}
        </button>
      `,
    ).join("");

    const gate = document.createElement("div");
    gate.id = AUTH_MODAL_ID;
    gate.className = "auth-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "authTitle");
    gate.setAttribute("aria-describedby", "authHint");

    gate.innerHTML = `
      <div class="auth-card pp-modal__card" role="document">
        <header class="auth-header pp-modal__header">
          <div class="auth-brand pp-modal__brand">
            <img
              class="auth-brand__logo auth-logo pp-modal__logo"
              src="${logoSrc}"
              alt="PPCCR"
            />
            <div class="auth-brand__copy pp-modal__brandText">
              <span id="authKicker" class="auth-brand__kicker pp-modal__kicker">Inicio de sesión</span>
              <h1 id="authTitle" class="auth-brand__title pp-modal__programTitle">Programa de Prevención de Cáncer Colorrectal</h1>
              <p id="authHint" class="auth-brand__subtitle pp-modal__hint">Seleccioná la estación saludable</p>
            </div>
          </div>
          <div id="authSectionTitleWrap" class="pp-modal__sectionTitle" hidden>
            <span id="authSectionKicker" class="pp-modal__sectionKicker">Selecciona</span>
            <h2 id="stationSectionTitle" class="pp-modal__sectionHeading">Estación saludable</h2>
          </div>
        </header>

        <section class="auth-section pp-modal__body">
          <div
            class="auth-grid pp-modal__station-grid station-grid"
            id="authStationGrid"
            role="list"
            aria-label="Seleccionar ubicación"
          >
            ${stationsMarkup}
          </div>

          <div class="auth-field" id="authPasswordField">
            <label class="auth-label" for="authPass">Clave</label>
            <div class="auth-inputWrap">
              <input
                id="authPass"
                class="auth-input"
                type="password"
                inputmode="text"
                placeholder="Ingrese clave de acceso"
                autocomplete="current-password"
                disabled
              />
              <button
                id="authPassToggle"
                class="auth-passToggle"
                type="button"
                aria-label="Mostrar clave"
                aria-pressed="false"
              >
                <svg class="auth-passToggle__icon auth-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"></circle>
                </svg>
                <svg class="auth-passToggle__icon auth-eye-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden>
                  <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                  <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16.8 16.8 0 0 1-3.1 3.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M6.3 6.4A16.1 16.1 0 0 0 2 12s3.5 7 10 7c1.7 0 3.1-.4 4.4-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </button>
            </div>
            <p id="authFieldHelp" class="auth-helper">Seleccione una estación antes de ingresar la clave.</p>
            <p id="authError" class="auth-error" aria-live="polite" hidden>Clave incorrecta.</p>
          </div>

          <footer class="auth-actions pp-modal__footer">
            <div class="pp-modal__actions">
              <button
                id="authCancel"
                class="auth-btn auth-btn--ghost pp-btn pp-btn--secondary"
                type="button"
                hidden
              >
                Cancelar
              </button>
              <button
                id="authEnter"
                class="auth-btn pp-btn pp-btn--primary"
                type="button"
                disabled
              >
                Ingresar
              </button>
            </div>
          </footer>
        </section>
      </div>
    `;

    document.body.appendChild(gate);
  }

  /**
   * @returns {HTMLElement | null}
   */
  function getGate() {
    return document.getElementById(AUTH_MODAL_ID);
  }

  /**
   * @returns {HTMLElement | null}
   */
  function findPrimaryHeader() {
    return (
      document.querySelector(".site-header.site-topbar") ||
      document.querySelector(".site-header") ||
      document.querySelector("header")
    );
  }

  /**
   * Sincroniza variables CSS con alto real del header fijo.
   */
  function syncHeaderHeight() {
    const headerEl = findPrimaryHeader();
    if (!headerEl) return;

    const headerHeight = Math.max(0, Math.round(headerEl.getBoundingClientRect().height));
    document.documentElement.style.setProperty("--app-header-h", `${headerHeight}px`);
    document.documentElement.style.setProperty("--header-fixed-h", `${headerHeight}px`);
  }

  /**
   * Programa sincronización en RAF para evitar jank.
   */
  function scheduleHeaderSync() {
    if (headerSyncRaf) return;
    headerSyncRaf = window.requestAnimationFrame(() => {
      headerSyncRaf = 0;
      syncHeaderHeight();
    });
  }

  /**
   * Vincula listeners para recalcular alto de header durante scroll/resize/compact mode.
   */
  function bindHeaderHeightSync() {
    if (headerSyncBound) {
      scheduleHeaderSync();
      return;
    }

    window.addEventListener("scroll", scheduleHeaderSync, { passive: true });
    window.addEventListener("resize", scheduleHeaderSync, { passive: true });
    window.addEventListener("orientationchange", scheduleHeaderSync, {
      passive: true,
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleHeaderSync, {
        passive: true,
      });
    }

    if ("ResizeObserver" in window) {
      const headerEl = findPrimaryHeader();
      if (headerEl) {
        headerResizeObserver = new ResizeObserver(() => scheduleHeaderSync());
        headerResizeObserver.observe(headerEl);
      }
    }

    headerSyncBound = true;
    scheduleHeaderSync();
  }

  /**
   * @param {HTMLElement | null} root
   * @returns {HTMLElement[]}
   */
  function getFocusableElements(root) {
    if (!root) return [];

    const focusables = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    return Array.from(focusables).filter((el) => {
      const htmlEl = /** @type {HTMLElement} */ (el);
      if (htmlEl.hasAttribute("disabled")) return false;
      if (htmlEl.getAttribute("aria-hidden") === "true") return false;
      return true;
    });
  }

  /**
   * @returns {boolean}
   */
  function isGateVisible() {
    const gate = getGate();
    if (!gate) return false;
    if (gate.hidden) return false;
    if (gate.style.display === "none") return false;
    return true;
  }

  /**
   * Bloquea interacción subyacente cuando el gate está abierto.
   */
  function lockBody() {
    document.body.classList.add("is-auth-locked");
  }

  /**
   * Libera el body cuando el gate se cierra.
   */
  function unlockBody() {
    document.body.classList.remove("is-auth-locked");
  }

  /**
   * Remueve elementos de identidad previos para evitar duplicados.
   */
  function removeIdentityNodes() {
    const ids = [
      "user-banner",
      "station-switch-trigger",
      "user-dock-tile",
      "user-identity-tile",
    ];
    ids.forEach((id) => {
      const node = document.getElementById(id);
      if (node) {
        const parent = node.parentElement;
        if (parent && parent.classList.contains("station-chip-item")) {
          parent.remove();
        } else {
          node.remove();
        }
      }
    });
  }

  /**
   * @param {{id: string, name: string}} station
   * @returns {HTMLElement}
   */
  function buildUserBanner(station) {
    const banner = document.createElement("button");
    banner.type = "button";
    banner.id = "user-banner";
    banner.className = "user-banner user-banner--sticky";
    banner.setAttribute("aria-label", "Cambiar estación saludable");
    banner.dataset.stationId = station.id;
    banner.innerHTML = `
      <span class="user-banner__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 20.5s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
          <circle cx="12" cy="10.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.9"></circle>
        </svg>
      </span>
      <span class="user-banner__text">${station.name}</span>
      <span class="user-banner__chevron" aria-hidden="true">
        <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
          <path d="m6.5 7.5 3.5 3.7 3.5-3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </span>
    `;
    return banner;
  }

  /**
   * @param {{id: string, name: string}} station
   * @returns {HTMLButtonElement}
   */
  function buildStationChipButton(station) {
    const isAdmin = station.id === "admin";
    const tightLabel = isAdmin || station.name.length >= 12;
    const metaClass = `station-chip__meta${isAdmin ? " station-chip__meta--admin" : ""}`;
    const labelClass = `station-chip__label user-dock-tile__label${
      tightLabel ? " station-chip__label--tight" : ""
    }${isAdmin ? " station-chip__label--admin" : ""}`;
    const kickerMarkup = isAdmin
      ? ""
      : '<span class="station-chip__kicker">Estación</span>';

    const button = document.createElement("button");
    button.type = "button";
    button.id = "station-switch-trigger";
    button.className = `station-chip user-dock-tile${isAdmin ? " station-chip--admin" : ""}`;
    button.setAttribute("aria-label", `Cambiar estación saludable. Activa: ${station.name}`);
    button.dataset.stationId = station.id;
    button.innerHTML = `
      <span class="station-chip__icon user-dock-tile__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 20.6s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M12 8.7v4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path>
          <path d="M9.6 11.1h4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path>
        </svg>
      </span>
      <span class="${metaClass}">
        ${kickerMarkup}
        <span class="${labelClass}">${station.name}</span>
      </span>
    `;
    return button;
  }

  /**
   * @param {Element} candidate
   * @returns {boolean}
   */
  function shouldSkipDockCandidate(candidate) {
    if (!candidate) return true;

    if (
      candidate.matches("#mobile-fixed-dock") ||
      candidate.matches(".mobile-fixed-dock") ||
      candidate.closest("#mobile-fixed-dock") ||
      candidate.closest(".mobile-fixed-dock")
    ) {
      return true;
    }

    if (candidate.hasAttribute("hidden")) return true;
    if (candidate.getAttribute("aria-hidden") === "true") return true;

    const insideHeader = Boolean(candidate.closest("header"));
    const isHomeSideDock =
      candidate.matches(".site-nav") ||
      candidate.matches("#mobileDockWrap") ||
      candidate.matches("#nav-list") ||
      Boolean(candidate.closest(".site-nav"));

    if (insideHeader && !isHomeSideDock) return true;

    return false;
  }

  /**
   * Busca contenedor de dock desktop por prioridad.
   * @returns {HTMLElement | null}
   */
  function findDesktopDockContainer() {
    const selectors = [
      "#sideDock",
      ".side-nav",
      ".side-dock",
      ".nav-rail",
      ".sidebar",
      'nav[aria-label*="Navegación"]',
      "nav",
      "#mobileDockWrap",
      ".site-nav",
      "#nav-list",
    ];

    for (const selector of selectors) {
      const matches = document.querySelectorAll(selector);
      for (const candidate of matches) {
        if (shouldSkipDockCandidate(candidate)) continue;

        if (candidate.matches("ul, ol")) {
          return /** @type {HTMLElement} */ (candidate);
        }

        if (candidate.matches(".site-nav") || candidate.matches("#mobileDockWrap")) {
          const innerList = candidate.querySelector(".nav-list, ul, ol");
          if (innerList && !shouldSkipDockCandidate(innerList)) {
            return /** @type {HTMLElement} */ (innerList);
          }
          return /** @type {HTMLElement} */ (candidate);
        }

        if (candidate.matches("nav")) {
          const navList = candidate.querySelector(".nav-list, ul, ol");
          if (navList && !shouldSkipDockCandidate(navList)) {
            return /** @type {HTMLElement} */ (navList);
          }
          return /** @type {HTMLElement} */ (candidate);
        }

        return /** @type {HTMLElement} */ (candidate);
      }
    }

    return null;
  }

  /**
   * Inserta banner móvil debajo del header fijo.
   * @param {{id: string, name: string}} station
   * @returns {boolean}
   */
  function insertMobileBanner(station) {
    const header = findPrimaryHeader();
    const banner = buildUserBanner(station);

    if (header && header.parentElement) {
      header.insertAdjacentElement("afterend", banner);
    } else {
      document.body.prepend(banner);
    }

    document.body.classList.add("has-user-banner");
    bindHeaderHeightSync();
    scheduleHeaderSync();
    return true;
  }

  /**
   * Inserta tile de estación en desktop (dock izquierdo o fallback en header).
   * @param {{id: string, name: string}} station
   * @returns {boolean}
   */
  function insertDesktopIdentityTile(station) {
    document.body.classList.remove("has-user-banner");

    const target = findDesktopDockContainer();
    if (target) {
      const button = buildStationChipButton(station);

      if (target.matches("ul, ol")) {
        const item = document.createElement("li");
        item.className = "station-chip-item";
        item.appendChild(button);
        target.prepend(item);
      } else {
        target.prepend(button);
      }

      return true;
    }

    const header = findPrimaryHeader();
    if (!header) return false;

    const inlineTarget =
      header.querySelector(".topbar") ||
      header.querySelector(".container") ||
      header.querySelector('[class*="hero__inner"]') ||
      header.querySelector('[class*="header-inner"]') ||
      header;

    const inlineTile = buildStationChipButton(station);
    inlineTile.classList.add("station-chip--inline", "user-dock-tile--inline");
    inlineTarget.prepend(inlineTile);
    return true;
  }

  /**
   * Inserta identidad según viewport (banner móvil / tile desktop).
   * @param {{id: string, name: string}} station
   * @param {number} attempt
   */
  function applyUserIdentityUI(station, attempt = 0) {
    if (!station) return;

    removeIdentityNodes();

    const isMobile = authMq ? authMq.matches : window.innerWidth < 768;
    const inserted = isMobile ? insertMobileBanner(station) : insertDesktopIdentityTile(station);

    if (!inserted && attempt < 2) {
      window.setTimeout(() => applyUserIdentityUI(station, attempt + 1), 120);
    }
  }

  /**
   * @returns {{
   * gate: HTMLElement | null;
   * stations: HTMLButtonElement[];
   * input: HTMLInputElement | null;
   * enterBtn: HTMLButtonElement | null;
   * cancelBtn: HTMLButtonElement | null;
   * toggleBtn: HTMLButtonElement | null;
   * error: HTMLElement | null;
   * field: HTMLElement | null;
   * help: HTMLElement | null;
   * grid: HTMLElement | null;
   * inputWrap: HTMLElement | null;
   * title: HTMLElement | null;
   * hint: HTMLElement | null;
   * kicker: HTMLElement | null;
   * sectionTitleWrap: HTMLElement | null;
   * sectionKicker: HTMLElement | null;
   * sectionHeading: HTMLElement | null;
   * }}
   */
  function getAuthControls() {
    const gate = getGate();
    const stations = Array.from(document.querySelectorAll(".auth-station")).filter(
      (el) => el instanceof HTMLButtonElement,
    );

    const input = document.getElementById("authPass");
    const enterBtn = document.getElementById("authEnter");
    const cancelBtn = document.getElementById("authCancel");
    const toggleBtn = document.getElementById("authPassToggle");
    const error = document.getElementById("authError");
    const field = document.getElementById("authPasswordField") || document.querySelector(".auth-field");
    const help = document.getElementById("authFieldHelp");
    const grid = document.getElementById("authStationGrid") || document.querySelector(".auth-grid");
    const inputWrap = document.querySelector(".auth-inputWrap");
    const title = document.getElementById("authTitle");
    const hint = document.getElementById("authHint");
    const kicker = document.getElementById("authKicker");
    const sectionTitleWrap = document.getElementById("authSectionTitleWrap");
    const sectionKicker = document.getElementById("authSectionKicker");
    const sectionHeading = document.getElementById("stationSectionTitle");

    return {
      gate: gate instanceof HTMLElement ? gate : null,
      stations,
      input: input instanceof HTMLInputElement ? input : null,
      enterBtn: enterBtn instanceof HTMLButtonElement ? enterBtn : null,
      cancelBtn: cancelBtn instanceof HTMLButtonElement ? cancelBtn : null,
      toggleBtn: toggleBtn instanceof HTMLButtonElement ? toggleBtn : null,
      error: error instanceof HTMLElement ? error : null,
      field: field instanceof HTMLElement ? field : null,
      help: help instanceof HTMLElement ? help : null,
      grid: grid instanceof HTMLElement ? grid : null,
      inputWrap: inputWrap instanceof HTMLElement ? inputWrap : null,
      title: title instanceof HTMLElement ? title : null,
      hint: hint instanceof HTMLElement ? hint : null,
      kicker: kicker instanceof HTMLElement ? kicker : null,
      sectionTitleWrap: sectionTitleWrap instanceof HTMLElement ? sectionTitleWrap : null,
      sectionKicker: sectionKicker instanceof HTMLElement ? sectionKicker : null,
      sectionHeading: sectionHeading instanceof HTMLElement ? sectionHeading : null,
    };
  }

  /**
   * @param {string} text
   * @param {boolean} isError
   */
  function setFieldHelp(text, isError = false) {
    const { help } = getAuthControls();
    if (!help) return;

    help.textContent = text;
    help.classList.toggle("is-error", isError);
    help.hidden = false;
  }

  /**
   * Limpia feedback de error.
   */
  function clearAuthError() {
    const { field, error, inputWrap, grid } = getAuthControls();

    if (field) field.classList.remove("is-error");
    if (error) {
      error.textContent = "Clave incorrecta.";
      error.hidden = true;
    }
    if (inputWrap) inputWrap.classList.remove("is-shaking");
    if (grid) grid.classList.remove("is-error");
  }

  /**
   * Muestra error visual y animación de shake.
   * @param {string} message
   */
  function showAuthError(message) {
    const { field, error, inputWrap } = getAuthControls();

    if (field && gateMode === "login") field.classList.add("is-error");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }

    if (inputWrap && gateMode === "login") {
      inputWrap.classList.remove("is-shaking");
      void inputWrap.offsetWidth;
      inputWrap.classList.add("is-shaking");
    }
  }

  /**
   * @param {boolean} shouldReveal
   */
  function setPasswordVisibility(shouldReveal) {
    const { input, toggleBtn } = getAuthControls();
    if (!input || !toggleBtn) return;

    const eye = toggleBtn.querySelector(".auth-eye");
    const eyeOff = toggleBtn.querySelector(".auth-eye-off");

    input.type = shouldReveal ? "text" : "password";
    toggleBtn.setAttribute("aria-label", shouldReveal ? "Ocultar clave" : "Mostrar clave");
    toggleBtn.setAttribute("aria-pressed", String(shouldReveal));

    if (eye instanceof HTMLElement) eye.hidden = shouldReveal;
    if (eyeOff instanceof HTMLElement) eyeOff.hidden = !shouldReveal;
  }

  /**
   * @param {string} stationId
   * @param {{focusInput?: boolean}} options
   */
  function selectStation(stationId, options = {}) {
    const station = resolveStation(stationId);
    if (!station) return;

    selectedStationId = station.id;

    const { stations, input, grid } = getAuthControls();

    stations.forEach((stationBtn) => {
      const isActive = stationBtn.dataset.stationId === station.id;
      stationBtn.classList.toggle("is-selected", isActive);
      stationBtn.setAttribute("aria-pressed", String(isActive));
    });

    if (grid) grid.classList.remove("is-error");
    clearAuthError();

    if (gateMode === "login") {
      if (input) input.disabled = false;
      setFieldHelp(`Estación seleccionada: ${station.name}`);
      if (options.focusInput !== false && input) input.focus();
    } else {
      setFieldHelp(`Estación seleccionada: ${station.name}`);
    }

    syncPrimaryActionState();
  }

  function syncPrimaryActionState() {
    const { input, enterBtn } = getAuthControls();
    if (!enterBtn) return;

    const hasStation = Boolean(selectedStationId);

    if (gateMode === "switch") {
      enterBtn.disabled = !hasStation || isAuthenticating;
      return;
    }

    const hasPassword = input ? input.value.trim().length > 0 : false;
    enterBtn.disabled = !(hasStation && hasPassword) || isAuthenticating;
  }

  function resetAuthFormState() {
    const { stations, input, enterBtn, toggleBtn, field, cancelBtn } = getAuthControls();

    selectedStationId = "";
    isAuthenticating = false;
    isPassVisible = false;

    stations.forEach((stationBtn) => {
      stationBtn.classList.remove("is-selected");
      stationBtn.setAttribute("aria-pressed", "false");
    });

    if (input) {
      input.value = "";
      input.disabled = true;
      input.type = "password";
    }

    if (toggleBtn) {
      toggleBtn.disabled = false;
      toggleBtn.setAttribute("aria-pressed", "false");
      toggleBtn.setAttribute("aria-label", "Mostrar clave");
    }

    if (enterBtn) enterBtn.disabled = true;
    if (field) {
      field.hidden = false;
      field.removeAttribute("aria-hidden");
    }
    if (cancelBtn) cancelBtn.hidden = true;

    setPasswordVisibility(false);
    clearAuthError();
    setFieldHelp("Seleccione una estación antes de ingresar la clave.");
  }

  /**
   * @param {"login" | "switch"} mode
   */
  function configureGateMode(mode) {
    gateMode = mode;

    const currentStation = getStoredStation();
    const {
      title,
      hint,
      kicker,
      sectionTitleWrap,
      sectionKicker,
      sectionHeading,
      field,
      input,
      enterBtn,
      cancelBtn,
      toggleBtn,
      stations,
    } = getAuthControls();

    if (!enterBtn || !toggleBtn || !stations.length) return;

    clearAuthError();

    if (mode === "switch") {
      if (kicker) {
        kicker.textContent = "";
        kicker.hidden = true;
      }
      if (title) title.textContent = "Programa de Prevención de Cáncer Colorrectal";
      if (hint) hint.textContent = "Seleccioná la estación activa para esta sesión";
      if (sectionTitleWrap) sectionTitleWrap.hidden = false;
      if (sectionKicker) sectionKicker.textContent = "Selecciona";
      if (sectionHeading) sectionHeading.textContent = "Estación saludable";

      if (field) {
        field.hidden = true;
        field.setAttribute("aria-hidden", "true");
      }

      if (input) {
        input.value = "";
        input.disabled = true;
      }

      toggleBtn.disabled = true;
      enterBtn.textContent = "Aplicar";
      if (cancelBtn) cancelBtn.hidden = false;

      const stationToSelect = currentStation ? currentStation.id : STATIONS[0].id;
      selectStation(stationToSelect, { focusInput: false });
      setFieldHelp(
        "Seleccioná una estación y aplicá cambios. No se requiere clave en este modo.",
      );
      syncPrimaryActionState();
      return;
    }

    if (kicker) {
      kicker.hidden = false;
      kicker.textContent = "Inicio de sesión";
    }
    if (title) title.textContent = "Programa de Prevención de Cáncer Colorrectal";
    if (hint) hint.textContent = "Seleccioná la estación saludable";
    if (sectionTitleWrap) sectionTitleWrap.hidden = true;

    if (field) {
      field.hidden = false;
      field.removeAttribute("aria-hidden");
    }

    if (cancelBtn) cancelBtn.hidden = true;
    toggleBtn.disabled = false;
    enterBtn.textContent = "Ingresar";

    selectedStationId = "";
    stations.forEach((stationBtn) => {
      stationBtn.classList.remove("is-selected");
      stationBtn.setAttribute("aria-pressed", "false");
    });

    if (currentStation) {
      selectStation(currentStation.id, { focusInput: false });
    } else {
      if (input) {
        input.disabled = true;
        input.value = "";
      }
      setFieldHelp("Seleccione una estación antes de ingresar la clave.");
      syncPrimaryActionState();
    }
  }

  /**
   * Muestra gate y mueve foco inicial.
   * @param {"login" | "switch"} mode
   */
  function showAuthGate(mode) {
    const gate = getGate();
    if (!gate) return;

    gate.dataset.mode = mode === "switch" ? "station" : "login";
    resetAuthFormState();
    configureGateMode(mode);

    gate.hidden = false;
    gate.style.display = "grid";
    gate.classList.remove(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
    gate.setAttribute("aria-hidden", "false");
    lockBody();

    const selected = gate.querySelector(".auth-station.is-selected");
    const firstStation = gate.querySelector(".auth-station");
    const focusTarget =
      selected instanceof HTMLElement
        ? selected
        : firstStation instanceof HTMLElement
          ? firstStation
          : null;

    if (focusTarget) {
      window.requestAnimationFrame(() => focusTarget.focus());
    }
  }

  /**
   * Oculta gate sin animación.
   */
  function hideAuthGateImmediately() {
    const gate = getGate();
    if (!gate) return;

    gate.dataset.mode = "login";
    gate.classList.remove(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
    gate.setAttribute("aria-hidden", "true");
    gate.hidden = true;
    gate.style.display = "none";
    unlockBody();
  }

  /**
   * Cierra gate con transición y luego ejecuta callback.
   * @param {() => void} done
   */
  function closeAuthGate(done) {
    const gate = getGate();
    if (!gate || !isGateVisible()) {
      done();
      return;
    }

    gate.classList.add(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
    gate.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      gate.hidden = true;
      gate.style.display = "none";
      gate.dataset.mode = "login";
      gate.classList.remove(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
      done();
    }, 250);
  }

  function restoreFocusAfterGate() {
    if (lastFocusedBeforeGate && typeof lastFocusedBeforeGate.focus === "function") {
      window.setTimeout(() => {
        lastFocusedBeforeGate.focus();
      }, 0);
    }
  }

  /**
   * @param {{id: string, name: string}} station
   * @param {{emit?: boolean, render?: boolean}} options
   */
  function applyStationState(station, options = {}) {
    const { emit = true, render = true } = options;

    setStoredStation(station);
    syncBodyStationDataset(station);
    if (render) applyUserIdentityUI(station);
    if (emit) emitStationChanged(station);
  }

  /**
   * @param {{id: string, name: string}} station
   */
  function completeGateFlow(station) {
    closeAuthGate(() => {
      unlockBody();
      applyStationState(station, { emit: true, render: true });
      restoreFocusAfterGate();
    });
  }

  function trySubmitGate() {
    if (isAuthenticating) return;

    const station = resolveStation(selectedStationId);
    if (!station) {
      const { stations, grid } = getAuthControls();
      if (grid) grid.classList.add("is-error");
      showAuthError("Seleccione una estación saludable.");
      setFieldHelp("Seleccione una estación antes de continuar.", true);
      const firstStation = stations[0];
      if (firstStation) firstStation.focus();
      return;
    }

    if (gateMode === "switch") {
      completeGateFlow(station);
      return;
    }

    const { input, enterBtn, toggleBtn } = getAuthControls();
    if (!input || !enterBtn || !toggleBtn) return;

    const passOK = normalizePass(input.value) === AUTH_PASS;

    if (passOK) {
      isAuthenticating = true;
      input.disabled = true;
      enterBtn.disabled = true;
      toggleBtn.disabled = true;
      clearAuthError();
      completeGateFlow(station);
      return;
    }

    showAuthError("Clave incorrecta.");
    setFieldHelp(`Estación seleccionada: ${station.name}`);
    input.focus();
    input.select();
    syncPrimaryActionState();
  }

  /**
   * Trap de foco básico mientras el modal está visible.
   * @param {KeyboardEvent} event
   */
  function trapAuthFocus(event) {
    if (event.key !== "Tab") return;
    if (!isGateVisible()) return;

    const gate = getGate();
    const focusables = getFocusableElements(gate);

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const containsActive = gate ? gate.contains(active) : false;

    if (event.shiftKey) {
      if (active === first || !containsActive) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !containsActive) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Configura eventos y validaciones del formulario de auth.
   */
  function wireAuthInteractions() {
    if (interactionsBound) return;

    const { gate, input, enterBtn, toggleBtn, cancelBtn, grid } = getAuthControls();
    if (!input || !enterBtn || !toggleBtn || !grid || !gate) return;

    grid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const stationBtn = target.closest(".auth-station");
      if (!(stationBtn instanceof HTMLButtonElement)) return;

      const stationId = stationBtn.dataset.stationId || "";
      selectStation(stationId);
    });

    input.addEventListener("input", () => {
      clearAuthError();
      if (selectedStationId) {
        const station = resolveStation(selectedStationId);
        if (station) setFieldHelp(`Estación seleccionada: ${station.name}`);
      }
      syncPrimaryActionState();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      trySubmitGate();
    });

    toggleBtn.addEventListener("click", () => {
      if (input.disabled || gateMode !== "login") return;
      isPassVisible = !isPassVisible;
      setPasswordVisibility(isPassVisible);
      input.focus();
    });

    enterBtn.addEventListener("click", trySubmitGate);

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (gateMode !== "switch") return;
        closeAuthGate(() => {
          unlockBody();
          restoreFocusAfterGate();
        });
      });
    }

    gate.addEventListener("click", (event) => {
      if (gateMode !== "switch") return;
      if (event.target !== gate) return;

      closeAuthGate(() => {
        unlockBody();
        restoreFocusAfterGate();
      });
    });

    interactionsBound = true;
  }

  function openStationSwitcher() {
    const station = getStoredStation();
    lastFocusedBeforeGate =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!station) {
      showAuthGate("login");
      return;
    }

    showAuthGate("switch");
  }

  function bindStationSwitcherTriggers() {
    if (stationTriggerBound) return;

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest("#user-banner, #station-switch-trigger");
      if (!(trigger instanceof HTMLElement)) return;

      event.preventDefault();
      openStationSwitcher();
    });

    stationTriggerBound = true;
  }

  /**
   * Inicializa gate según sesión guardada.
   */
  function bootstrapAuthGate() {
    ensureAuthGateExists();
    setupGlobalStationApi();
    wireAuthInteractions();
    bindStationSwitcherTriggers();

    const savedStation = getStoredStation();

    if (savedStation) {
      hideAuthGateImmediately();
      syncBodyStationDataset(savedStation);
      applyUserIdentityUI(savedStation);
      return;
    }

    removeIdentityNodes();
    document.body.classList.remove("has-user-banner");
    syncBodyStationDataset(null);

    lastFocusedBeforeGate =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    showAuthGate("login");
  }

  /**
   * Registra listeners de cambio de viewport/orientación.
   */
  function bindViewportListeners() {
    if (!authMq || !viewportChangeHandler) return;

    if (typeof authMq.addEventListener === "function") {
      authMq.addEventListener("change", viewportChangeHandler);
    } else if (typeof authMq.addListener === "function") {
      authMq.addListener(viewportChangeHandler);
    }

    window.addEventListener("orientationchange", viewportChangeHandler, {
      passive: true,
    });
  }

  function handleGlobalKeydown(event) {
    trapAuthFocus(event);

    if (!isGateVisible()) return;
    if (event.key !== "Escape") return;
    if (gateMode !== "switch") return;

    event.preventDefault();
    closeAuthGate(() => {
      unlockBody();
      restoreFocusAfterGate();
    });
  }

  document.addEventListener("keydown", handleGlobalKeydown, true);

  document.addEventListener("DOMContentLoaded", () => {
    try {
      authMq = window.matchMedia(VIEWPORT_MQ);
      viewportChangeHandler = () => {
        const station = getStoredStation();
        if (!station) return;
        applyUserIdentityUI(station);
        scheduleHeaderSync();
      };

      bootstrapAuthGate();
      bindViewportListeners();
      bindHeaderHeightSync();
    } catch (error) {
      console.error("[auth-gate] Error de inicialización", error);
    }
  });
})();
