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

  const AUTH_STORAGE_LEGACY = "ppccr_auth_user";
  const AUTH_STORAGE_FLAG = "ppccr_auth";
  const AUTH_STORAGE_STATION = "ppccr_station";

  const AUTH_STATIONS = [
    "Parque Saavedra",
    "Aristóbulo del Valle",
    "Parque Rivadavia",
    "Parque Chacabuco",
    "Administrador",
  ];

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

  /**
   * Normaliza la clave para validación case-insensitive.
   * @param {string} value
   * @returns {string}
   */
  function normalizePass(value) {
    return String(value ?? "").trim().toLowerCase();
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
   * Obtiene estación persistida de la pestaña actual.
   * @returns {string}
   */
  function getStoredStation() {
    const authFlag = safeSessionGet(AUTH_STORAGE_FLAG);
    const storedStation = safeSessionGet(AUTH_STORAGE_STATION);

    if (authFlag === "1" && AUTH_STATIONS.includes(storedStation)) {
      return storedStation;
    }

    const legacyStation = safeSessionGet(AUTH_STORAGE_LEGACY);
    return AUTH_STATIONS.includes(legacyStation) ? legacyStation : "";
  }

  /**
   * Persiste sesión y estación actual.
   * @param {string} station
   */
  function setStoredStation(station) {
    safeSessionSet(AUTH_STORAGE_FLAG, "1");
    safeSessionSet(AUTH_STORAGE_STATION, station);
    // Compatibilidad con implementación previa.
    safeSessionSet(AUTH_STORAGE_LEGACY, station);
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
   * Crea el modal si todavía no existe en la página.
   */
  function ensureAuthGateExists() {
    if (document.getElementById(AUTH_MODAL_ID)) return;

    const logoSrc = getAuthLogoSrc();
    const stationsMarkup = AUTH_STATIONS.map(
      (station) => `
        <button
          type="button"
          class="auth-station auth-tile"
          data-station="${station}"
          aria-pressed="false"
        >
          <span>${station}</span>
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
      <div class="auth-card" role="document">
        <header class="auth-header">
          <div class="auth-brand">
            <img class="auth-brand__logo auth-logo" src="${logoSrc}" alt="PPCCR" />
            <div class="auth-brand__copy">
              <span class="auth-brand__kicker">Inicio de sesión</span>
              <h1 id="authTitle" class="auth-brand__title">Programa de Prevención de Cáncer Colorrectal</h1>
              <p id="authHint" class="auth-brand__subtitle">Selecciona la estación saludable</p>
            </div>
          </div>
        </header>

        <section class="auth-section">
          <div class="auth-grid" role="list" aria-label="Seleccionar ubicación">
            ${stationsMarkup}
          </div>

          <div class="auth-field">
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

          <div class="auth-actions">
            <button id="authEnter" class="auth-btn" type="button" disabled>Ingresar</button>
          </div>
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
      document.querySelector("header")
    );
  }

  /**
   * Sincroniza variable CSS con alto real del header fijo.
   */
  function syncHeaderHeight() {
    const headerEl = findPrimaryHeader();
    if (!headerEl) return;

    const headerHeight = Math.max(0, Math.round(headerEl.getBoundingClientRect().height));
    document.documentElement.style.setProperty("--app-header-h", `${headerHeight}px`);
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
    const ids = ["user-banner", "user-dock-tile", "user-identity-tile"];
    ids.forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.remove();
    });
  }

  /**
   * @param {string} station
   * @returns {HTMLElement}
   */
  function buildUserBanner(station) {
    const banner = document.createElement("div");
    banner.id = "user-banner";
    banner.className = "user-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.textContent = station;
    return banner;
  }

  /**
   * @param {string} station
   * @param {boolean} useListItem
   * @returns {HTMLElement}
   */
  function buildUserDockTile(station, useListItem) {
    const tile = document.createElement(useListItem ? "li" : "div");
    tile.id = "user-dock-tile";
    tile.className = "user-dock-tile";
    tile.setAttribute("aria-label", `Estación activa: ${station}`);
    tile.innerHTML = `
      <span class="user-dock-tile__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 20.6s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M12 8.7v4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path>
          <path d="M9.6 11.1h4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path>
        </svg>
      </span>
      <span class="user-dock-tile__label">${station}</span>
    `;
    return tile;
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
   * @param {string} station
   * @returns {boolean}
   */
  function insertMobileBanner(station) {
    const header = findPrimaryHeader();
    if (!header || !header.parentElement) return false;

    const banner = buildUserBanner(station);
    header.insertAdjacentElement("afterend", banner);
    document.body.classList.add("has-user-banner");
    bindHeaderHeightSync();
    scheduleHeaderSync();
    return true;
  }

  /**
   * Inserta tile de estación en desktop (dock izquierdo o fallback en header).
   * @param {string} station
   * @returns {boolean}
   */
  function insertDesktopIdentityTile(station) {
    document.body.classList.remove("has-user-banner");

    const target = findDesktopDockContainer();
    if (target) {
      const useListItem = target.matches("ul, ol");
      const tile = buildUserDockTile(station, useListItem);
      target.prepend(tile);
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

    const inlineTile = buildUserDockTile(station, false);
    inlineTile.classList.add("user-dock-tile--inline");
    inlineTarget.prepend(inlineTile);
    return true;
  }

  /**
   * Inserta identidad según viewport (banner móvil / tile desktop).
   * @param {string} station
   * @param {number} attempt
   */
  function applyUserIdentityUI(station, attempt = 0) {
    if (!station) return;

    removeIdentityNodes();

    const isMobile = authMq ? authMq.matches : window.innerWidth < 768;
    const inserted = isMobile
      ? insertMobileBanner(station)
      : insertDesktopIdentityTile(station);

    if (!inserted && attempt < 2) {
      window.setTimeout(() => applyUserIdentityUI(station, attempt + 1), 120);
    }
  }

  /**
   * @returns {{
   * stations: HTMLButtonElement[];
   * input: HTMLInputElement | null;
   * enterBtn: HTMLButtonElement | null;
   * toggleBtn: HTMLButtonElement | null;
   * error: HTMLElement | null;
   * field: HTMLElement | null;
   * help: HTMLElement | null;
   * grid: HTMLElement | null;
   * inputWrap: HTMLElement | null;
   * }}
   */
  function getAuthControls() {
    const stations = Array.from(
      document.querySelectorAll(".auth-station"),
    ).filter((el) => el instanceof HTMLButtonElement);

    const input = document.getElementById("authPass");
    const enterBtn = document.getElementById("authEnter");
    const toggleBtn = document.getElementById("authPassToggle");
    const error = document.getElementById("authError");
    const field = document.querySelector(".auth-field");
    const help = document.getElementById("authFieldHelp");
    const grid = document.querySelector(".auth-grid");
    const inputWrap = document.querySelector(".auth-inputWrap");

    return {
      stations,
      input: input instanceof HTMLInputElement ? input : null,
      enterBtn: enterBtn instanceof HTMLButtonElement ? enterBtn : null,
      toggleBtn: toggleBtn instanceof HTMLButtonElement ? toggleBtn : null,
      error: error instanceof HTMLElement ? error : null,
      field: field instanceof HTMLElement ? field : null,
      help: help instanceof HTMLElement ? help : null,
      grid: grid instanceof HTMLElement ? grid : null,
      inputWrap: inputWrap instanceof HTMLElement ? inputWrap : null,
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

    if (field) field.classList.add("is-error");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }

    if (inputWrap) {
      inputWrap.classList.remove("is-shaking");
      void inputWrap.offsetWidth;
      inputWrap.classList.add("is-shaking");
    }
  }

  /**
   * Actualiza estado del botón ingresar.
   * @param {string | null} selectedStation
   */
  function updateEnterButton(selectedStation) {
    const { input, enterBtn } = getAuthControls();
    if (!input || !enterBtn) return;

    const hasPassword = input.value.trim().length > 0;
    enterBtn.disabled = !(Boolean(selectedStation) && hasPassword);
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
   * Muestra gate y mueve foco inicial.
   */
  function showAuthGate() {
    const gate = getGate();
    if (!gate) return;

    gate.hidden = false;
    gate.style.display = "grid";
    gate.classList.remove(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
    gate.setAttribute("aria-hidden", "false");
    lockBody();

    const firstStation = gate.querySelector(".auth-station");
    if (firstStation instanceof HTMLElement) {
      window.requestAnimationFrame(() => firstStation.focus());
    }
  }

  /**
   * Oculta gate sin animación.
   */
  function hideAuthGateImmediately() {
    const gate = getGate();
    if (!gate) return;

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
      gate.classList.remove(AUTH_CLOSE_CLASS, AUTH_HIDING_CLASS);
      done();
    }, 250);
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
   * Finaliza login exitoso.
   * @param {string} station
   */
  function completeAuth(station) {
    setStoredStation(station);

    closeAuthGate(() => {
      unlockBody();
      applyUserIdentityUI(station);

      if (lastFocusedBeforeGate && typeof lastFocusedBeforeGate.focus === "function") {
        window.setTimeout(() => {
          lastFocusedBeforeGate.focus();
        }, 0);
      }
    });
  }

  /**
   * Configura eventos y validaciones del formulario de auth.
   */
  function wireAuthInteractions() {
    const { stations, input, enterBtn, toggleBtn, grid } = getAuthControls();

    if (!input || !enterBtn || !toggleBtn || stations.length === 0) return;

    let selectedStation = null;
    let isAuthenticating = false;
    let isPassVisible = false;

    input.disabled = true;
    input.value = "";
    enterBtn.disabled = true;
    setPasswordVisibility(false);
    clearAuthError();
    setFieldHelp("Seleccione una estación antes de ingresar la clave.");

    stations.forEach((stationBtn) => {
      stationBtn.classList.remove("is-selected");
      stationBtn.setAttribute("aria-pressed", "false");
    });

    const setSelectedStation = (stationName) => {
      if (!AUTH_STATIONS.includes(stationName)) return;
      selectedStation = stationName;

      stations.forEach((stationBtn) => {
        const isActive = stationBtn.dataset.station === stationName;
        stationBtn.classList.toggle("is-selected", isActive);
        stationBtn.setAttribute("aria-pressed", String(isActive));
      });

      if (grid) grid.classList.remove("is-error");
      input.disabled = false;
      clearAuthError();
      setFieldHelp(`Estación seleccionada: ${stationName}`);
      updateEnterButton(selectedStation);
      input.focus();
    };

    const tryLogin = () => {
      if (isAuthenticating) return;

      if (!selectedStation) {
        if (grid) grid.classList.add("is-error");
        showAuthError("Seleccione una estación saludable.");
        setFieldHelp("Seleccione una estación antes de ingresar la clave.", true);
        const firstStation = stations[0];
        if (firstStation) firstStation.focus();
        return;
      }

      const passOK = normalizePass(input.value) === AUTH_PASS;

      if (passOK) {
        isAuthenticating = true;
        input.disabled = true;
        enterBtn.disabled = true;
        toggleBtn.disabled = true;
        clearAuthError();
        completeAuth(selectedStation);
        return;
      }

      showAuthError("Clave incorrecta.");
      setFieldHelp(`Estación seleccionada: ${selectedStation}`);
      input.focus();
      input.select();
      updateEnterButton(selectedStation);
    };

    stations.forEach((stationBtn) => {
      stationBtn.addEventListener("click", () => {
        const stationName = stationBtn.dataset.station || "";
        setSelectedStation(stationName);
      });
    });

    input.addEventListener("input", () => {
      clearAuthError();
      if (selectedStation) setFieldHelp(`Estación seleccionada: ${selectedStation}`);
      updateEnterButton(selectedStation);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      tryLogin();
    });

    toggleBtn.addEventListener("click", () => {
      if (input.disabled) return;
      isPassVisible = !isPassVisible;
      setPasswordVisibility(isPassVisible);
      input.focus();
    });

    enterBtn.addEventListener("click", tryLogin);
  }

  /**
   * Inicializa gate según sesión guardada.
   */
  function bootstrapAuthGate() {
    ensureAuthGateExists();

    const gate = getGate();
    if (!gate) return;

    const savedStation = getStoredStation();

    if (savedStation) {
      hideAuthGateImmediately();
      applyUserIdentityUI(savedStation);
      return;
    }

    removeIdentityNodes();
    document.body.classList.remove("has-user-banner");

    lastFocusedBeforeGate =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    showAuthGate();
    wireAuthInteractions();
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

  document.addEventListener("keydown", trapAuthFocus, true);

  document.addEventListener("DOMContentLoaded", () => {
    try {
      authMq = window.matchMedia(VIEWPORT_MQ);
      viewportChangeHandler = () => {
        const station = getStoredStation();
        if (!station) return;
        applyUserIdentityUI(station);
      };

      bootstrapAuthGate();
      bindViewportListeners();
    } catch (error) {
      console.error("[auth-gate] Error de inicialización", error);
    }
  });
})();
