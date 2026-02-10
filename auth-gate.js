"use strict";

/**
 * Gatekeeper modal de autenticación client-side (control UX, no seguridad real).
 * Se monta de forma reutilizable en todas las paginas que cargan este script.
 */
(() => {
  const AUTH_STORAGE_KEY = "ppccr_auth_user";
  const AUTH_PASSWORD = "marzo31";
  const AUTH_MODAL_ID = "auth-gate";
  const AUTH_CLOSE_CLASS = "auth-gate--closing";
  const VIEWPORT_MQ = "(max-width: 767.98px)";
  const AUTH_USERS = [
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

  /**
   * Devuelve el usuario guardado para la pestaña actual.
   * @returns {string}
   */
  function getStoredUser() {
    try {
      const rawUser = sessionStorage.getItem(AUTH_STORAGE_KEY) || "";
      return AUTH_USERS.includes(rawUser) ? rawUser : "";
    } catch (error) {
      console.warn("[auth-gate] No se pudo leer sessionStorage", error);
      return "";
    }
  }

  /**
   * Persiste el usuario autenticado en la pestaña actual.
   * @param {string} user
   */
  function setStoredUser(user) {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, user);
    } catch (error) {
      console.warn("[auth-gate] No se pudo escribir sessionStorage", error);
    }
  }

  /**
   * Obtiene un logo compatible con el sitio actual.
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
   * Asegura que el markup del gatekeeper exista en DOM.
   */
  function ensureAuthGateExists() {
    if (document.getElementById(AUTH_MODAL_ID)) return;

    const logoSrc = getAuthLogoSrc();
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
          <img class="auth-logo" src="${logoSrc}" alt="PPCCR" />
          <h2 id="authTitle" class="auth-title">Inicio de Sesión</h2>
          <p class="auth-subtitle">Seleccione estación y clave para continuar.</p>
        </header>

        <section class="auth-section">
          <div class="auth-grid" role="list" aria-label="Seleccionar ubicación">
            <button type="button" class="auth-tile" data-user="Parque Saavedra">Parque Saavedra</button>
            <button type="button" class="auth-tile" data-user="Aristóbulo del Valle">Aristóbulo del Valle</button>
            <button type="button" class="auth-tile" data-user="Parque Rivadavia">Parque Rivadavia</button>
            <button type="button" class="auth-tile" data-user="Parque Chacabuco">Parque Chacabuco</button>
            <button type="button" class="auth-tile" data-user="Administrador">Administrador</button>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="authPass">Clave</label>
            <input id="authPass" class="auth-input" type="password" inputmode="text" placeholder="Ingrese clave de acceso" autocomplete="current-password" disabled />
            <p id="authHint" class="auth-hint">Seleccione una estación antes de ingresar la clave.</p>
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
   * Bloquea scroll y gestos del body mientras el gate esta activo.
   */
  function lockBody() {
    document.body.classList.add("is-auth-locked");
  }

  /**
   * Libera body al cerrar gate.
   */
  function unlockBody() {
    document.body.classList.remove("is-auth-locked");
  }

  /**
   * Limpia nodos de identidad para evitar duplicados.
   */
  function removeIdentityNodes() {
    const banner = document.getElementById("user-banner");
    const tile = document.getElementById("user-identity-tile");
    if (banner) banner.remove();
    if (tile) tile.remove();
  }

  /**
   * @param {string} user
   * @returns {HTMLElement}
   */
  function buildUserBanner(user) {
    const banner = document.createElement("div");
    banner.id = "user-banner";
    banner.className = "user-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.textContent = user;
    return banner;
  }

  /**
   * @param {string} user
   * @param {boolean} useListItem
   * @returns {HTMLElement}
   */
  function buildUserIdentityTile(user, useListItem) {
    const tile = document.createElement(useListItem ? "li" : "div");
    tile.id = "user-identity-tile";
    tile.className = "user-identity-tile";
    tile.setAttribute("aria-label", `Usuario actual: ${user}`);

    const label = document.createElement("span");
    label.className = "user-identity-label";
    label.textContent = user;

    tile.appendChild(label);
    return tile;
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
   * Inserta banner en mobile justo debajo del header.
   * @param {string} user
   * @returns {boolean}
   */
  function insertMobileBanner(user) {
    const header = findPrimaryHeader();
    if (!header || !header.parentElement) return false;

    const banner = buildUserBanner(user);
    header.insertAdjacentElement("afterend", banner);
    return true;
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
   * Busca un contenedor desktop para insertar el cubo de identidad.
   * Aplica orden de prioridad solicitado y evita nav de header no lateral.
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
   * Inserta tile en desktop y hace fallback al header si no hay dock valido.
   * @param {string} user
   * @returns {boolean}
   */
  function insertDesktopIdentityTile(user) {
    const target = findDesktopDockContainer();
    if (target) {
      const useListItem = target.matches("ul, ol");
      const tile = buildUserIdentityTile(user, useListItem);
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

    const inlineTile = buildUserIdentityTile(user, false);
    inlineTile.classList.add("user-identity-tile--inline");
    inlineTarget.prepend(inlineTile);
    return true;
  }

  /**
   * Inserta banner o tile segun viewport. Reintenta hasta 3 veces si falta DOM.
   * @param {string} user
   * @param {number} attempt
   */
  function applyUserIdentityUI(user, attempt = 0) {
    if (!user) return;

    removeIdentityNodes();

    const isMobile = authMq ? authMq.matches : window.innerWidth < 768;
    const inserted = isMobile
      ? insertMobileBanner(user)
      : insertDesktopIdentityTile(user);

    if (!inserted && attempt < 2) {
      window.setTimeout(() => applyUserIdentityUI(user, attempt + 1), 120);
    }
  }

  /**
   * Limpia feedback visual de error.
   */
  function clearAuthError() {
    const field = document.querySelector(".auth-field");
    const error = document.getElementById("authError");
    const input = document.getElementById("authPass");
    const card = document.querySelector(".auth-card");

    if (field) field.classList.remove("is-error");
    if (error) error.hidden = true;
    if (input) input.classList.remove("is-shaking");
    if (card) card.classList.remove("is-shaking");
  }

  /**
   * Muestra estado de error y anima shake.
   * @param {string} message
   */
  function showAuthError(message) {
    const field = document.querySelector(".auth-field");
    const error = document.getElementById("authError");
    const input = document.getElementById("authPass");
    const card = document.querySelector(".auth-card");

    if (field) field.classList.add("is-error");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }

    if (input) {
      input.classList.remove("is-shaking");
      void input.offsetWidth;
      input.classList.add("is-shaking");
    }

    if (card) {
      card.classList.remove("is-shaking");
      void card.offsetWidth;
      card.classList.add("is-shaking");
    }
  }

  /**
   * @returns {{tiles: HTMLButtonElement[], input: HTMLInputElement | null, enterBtn: HTMLButtonElement | null}}
   */
  function getAuthControls() {
    const tiles = Array.from(
      document.querySelectorAll(".auth-tile"),
    ).filter((tile) => tile instanceof HTMLButtonElement);
    const input = document.getElementById("authPass");
    const enterBtn = document.getElementById("authEnter");

    return {
      tiles,
      input: input instanceof HTMLInputElement ? input : null,
      enterBtn: enterBtn instanceof HTMLButtonElement ? enterBtn : null,
    };
  }

  /**
   * @param {string} selectedUser
   */
  function updateAuthEnterButton(selectedUser) {
    const { input, enterBtn } = getAuthControls();
    if (!input || !enterBtn) return;

    const hasPassword = input.value.trim().length > 0;
    enterBtn.disabled = !(Boolean(selectedUser) && hasPassword);
  }

  /**
   * Muestra gate inmediatamente y setea foco inicial.
   */
  function showAuthGate() {
    const gate = getGate();
    if (!gate) return;

    gate.hidden = false;
    gate.style.display = "grid";
    gate.classList.remove(AUTH_CLOSE_CLASS);
    gate.setAttribute("aria-hidden", "false");
    lockBody();

    const firstTile = gate.querySelector(".auth-tile");
    if (firstTile instanceof HTMLElement) {
      window.requestAnimationFrame(() => firstTile.focus());
    }
  }

  /**
   * Oculta gate sin animacion.
   */
  function hideAuthGateImmediately() {
    const gate = getGate();
    if (!gate) return;

    gate.classList.remove(AUTH_CLOSE_CLASS);
    gate.setAttribute("aria-hidden", "true");
    gate.hidden = true;
    gate.style.display = "none";
    unlockBody();
  }

  /**
   * Cierra gate con animacion de salida.
   * @param {() => void} done
   */
  function closeAuthGate(done) {
    const gate = getGate();
    if (!gate || !isGateVisible()) {
      done();
      return;
    }

    gate.classList.add(AUTH_CLOSE_CLASS);
    gate.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      gate.hidden = true;
      gate.style.display = "none";
      gate.classList.remove(AUTH_CLOSE_CLASS);
      done();
    }, 240);
  }

  /**
   * Mantiene el foco dentro del modal mientras este visible.
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
   * @param {string} user
   */
  function completeAuth(user) {
    setStoredUser(user);
    closeAuthGate(() => {
      unlockBody();
      applyUserIdentityUI(user);

      if (lastFocusedBeforeGate && typeof lastFocusedBeforeGate.focus === "function") {
        window.setTimeout(() => {
          lastFocusedBeforeGate.focus();
        }, 0);
      }
    });
  }

  /**
   * Inicializa listeners de login y estados interactivos.
   */
  function wireAuthInteractions() {
    const gate = getGate();
    if (!gate) return;

    const { tiles, input, enterBtn } = getAuthControls();
    const error = document.getElementById("authError");

    if (!input || !enterBtn || tiles.length === 0 || !error) return;

    let selectedUser = "";
    let isAuthenticating = false;

    input.disabled = true;
    input.value = "";
    enterBtn.disabled = true;
    error.hidden = true;
    tiles.forEach((tile) => tile.setAttribute("aria-pressed", "false"));

    const setSelectedUser = (nextUser) => {
      if (!AUTH_USERS.includes(nextUser)) return;
      selectedUser = nextUser;

      tiles.forEach((tile) => {
        const isActive = tile.dataset.user === nextUser;
        tile.classList.toggle("is-selected", isActive);
        tile.setAttribute("aria-pressed", String(isActive));
      });

      input.disabled = false;
      input.focus();
      clearAuthError();
      updateAuthEnterButton(selectedUser);
    };

    const tryLogin = () => {
      if (!selectedUser || isAuthenticating) return;

      if (input.value === AUTH_PASSWORD) {
        isAuthenticating = true;
        input.disabled = true;
        enterBtn.disabled = true;
        clearAuthError();
        completeAuth(selectedUser);
        return;
      }

      showAuthError("Clave incorrecta.");
      input.value = "";
      updateAuthEnterButton(selectedUser);
      input.focus();
    };

    tiles.forEach((tile) => {
      tile.addEventListener("click", () => {
        const nextUser = tile.dataset.user || "";
        if (!nextUser) return;
        setSelectedUser(nextUser);
      });
    });

    input.addEventListener("input", () => {
      clearAuthError();
      updateAuthEnterButton(selectedUser);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      tryLogin();
    });

    enterBtn.addEventListener("click", tryLogin);
  }

  /**
   * Construye/oculta gate segun estado de sesion y aplica UI de usuario.
   */
  function bootstrapAuthGate() {
    ensureAuthGateExists();

    const gate = getGate();
    if (!gate) return;

    const savedUser = getStoredUser();

    if (savedUser) {
      hideAuthGateImmediately();
      applyUserIdentityUI(savedUser);
      return;
    }

    lastFocusedBeforeGate =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    showAuthGate();
    wireAuthInteractions();
  }

  /**
   * Registra listeners de cambios de viewport/orientacion.
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
        const user = getStoredUser();
        if (!user) return;
        applyUserIdentityUI(user);
      };

      bootstrapAuthGate();
      bindViewportListeners();
    } catch (error) {
      console.error("[auth-gate] Error de inicializacion", error);
    }
  });
})();
