"use strict";

/**
 * @file Módulo Telemedicina P2P sin backend para PPCCR 2026.
 * Integra Jitsi Meet IFrame API con gestión singleton, anti-race y cleanup total.
 */

(() => {
  /** @type {string} */
  const JITSI_DOMAIN = "meet.jit.si";
  /** @type {string} */
  const ROOM_PREFIX = "PAE_PPCCR_TELEMED_2026";
  /** @type {string} */
  const ROOM_SALT = "PPCCR26_4h2P9xW7sQ1kLm3D8vN5yR0tB6cJ";
  /** @type {string} */
  const JITSI_PROMISE_KEY = "__ppccrJitsiLoaderPromise";

  /** @type {Record<string, {key:string,label:string,code:string,roomSuffix:string,password:string}>} */
  const STATIONS = Object.freeze({
    saavedra: Object.freeze({
      key: "saavedra",
      label: "Parque Saavedra",
      code: "SAAV",
      roomSuffix: "K7M2Q8X4",
      password: "PPCCR-SAAV-2026",
    }),
    aristobulo: Object.freeze({
      key: "aristobulo",
      label: "Aristóbulo del Valle",
      code: "ARDV",
      roomSuffix: "R3N9T4P6",
      password: "PPCCR-ARDV-2026",
    }),
    rivadavia: Object.freeze({
      key: "rivadavia",
      label: "Parque Rivadavia",
      code: "RIVA",
      roomSuffix: "V5L8C2H9",
      password: "PPCCR-RIVA-2026",
    }),
    chacabuco: Object.freeze({
      key: "chacabuco",
      label: "Parque Chacabuco",
      code: "CHAC",
      roomSuffix: "D4S7W1F8",
      password: "PPCCR-CHAC-2026",
    }),
  });

  /** @type {Record<string, string>} */
  const STATION_ALIASES = Object.freeze({
    saavedra: "saavedra",
    parquesaavedra: "saavedra",
    aristobulo: "aristobulo",
    aristobulodelvalle: "aristobulo",
    delvalle: "aristobulo",
    rivadavia: "rivadavia",
    parquerivadavia: "rivadavia",
    chacabuco: "chacabuco",
    parquechacabuco: "chacabuco",
  });

  /**
   * Espera un frame de animación.
   * @returns {Promise<void>}
   */
  function raf() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  /**
   * Normaliza una clave de estación desde UI o querystring.
   * @param {string | null | undefined} value
   * @returns {string | null}
   */
  function normalizeStationKey(value) {
    if (!value) return null;
    const clean = String(value)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    return STATION_ALIASES[clean] || null;
  }

  /**
   * Devuelve la configuración de estación si existe.
   * @param {string | null | undefined} stationKey
   * @returns {{key:string,label:string,code:string,roomSuffix:string,password:string} | null}
   */
  function getStationConfig(stationKey) {
    const key = normalizeStationKey(stationKey);
    if (!key) return null;
    return STATIONS[key] || null;
  }

  /**
   * Hash determinista fallback si WebCrypto no está disponible.
   * @param {string} input
   * @returns {string}
   */
  function fallbackHashHex(input) {
    const seeds = [
      0x811c9dc5,
      0x1b873593,
      0x9e3779b9,
      0x85ebca6b,
      0xc2b2ae35,
      0x27d4eb2f,
      0x165667b1,
      0xd3a2646c,
    ];

    return seeds
      .map((seed) => {
        let h = seed >>> 0;
        for (let i = 0; i < input.length; i += 1) {
          h ^= input.charCodeAt(i);
          h = Math.imul(h, 16777619);
          h = ((h << 13) | (h >>> 19)) >>> 0;
        }
        return h.toString(16).padStart(8, "0");
      })
      .join("");
  }

  /**
   * Calcula hash SHA-256 en hex usando WebCrypto. Fallback determinista si no existe.
   * @param {string} input
   * @returns {Promise<string>}
   */
  async function sha256Hex(input) {
    const value = String(input ?? "");

    if (
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.digest === "function" &&
      typeof window.TextEncoder === "function"
    ) {
      const bytes = new TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }

    return fallbackHashHex(value);
  }

  /**
   * Construye nombre de sala determinista y no trivial por estación.
   * @param {string} stationKey
   * @returns {Promise<string>}
   */
  async function buildRoomName(stationKey) {
    const station = getStationConfig(stationKey);
    if (!station) throw new Error("Estación inválida para roomName");

    const roomBase = `${ROOM_PREFIX}_${station.code}_${station.roomSuffix}`
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");

    const hash = (await sha256Hex(`${ROOM_SALT}|${roomBase}`))
      .slice(0, 12)
      .toUpperCase();

    return `${roomBase}_${hash}`;
  }

  /**
   * Carga `external_api.js` de Jitsi con patrón single-flight.
   * @param {string} [domain]
   * @returns {Promise<void>}
   */
  function loadJitsiScript(domain = JITSI_DOMAIN) {
    if (window.JitsiMeetExternalAPI) return Promise.resolve();

    if (window[JITSI_PROMISE_KEY]) {
      return window[JITSI_PROMISE_KEY];
    }

    const src = `https://${domain}/external_api.js`;

    window[JITSI_PROMISE_KEY] = new Promise((resolve, reject) => {
      /** @type {HTMLScriptElement | null} */
      let scriptEl = document.querySelector(`script[src="${src}"]`);
      let timeoutId = 0;
      let settled = false;

      if (
        scriptEl &&
        (scriptEl.dataset.ppccrState === "error" ||
          (scriptEl.dataset.ppccrState === "loaded" &&
            !window.JitsiMeetExternalAPI))
      ) {
        scriptEl.remove();
        scriptEl = null;
      }

      const cleanup = () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (scriptEl) {
          scriptEl.removeEventListener("load", onLoad);
          scriptEl.removeEventListener("error", onError);
        }
      };

      const finish = (handler, payload) => {
        if (settled) return;
        settled = true;
        cleanup();
        handler(payload);
      };

      const onLoad = () => {
        if (scriptEl) scriptEl.dataset.ppccrState = "loaded";
        if (window.JitsiMeetExternalAPI) {
          finish(resolve);
          return;
        }
        finish(reject, new Error("Jitsi API cargó sin exponer JitsiMeetExternalAPI"));
      };

      const onError = () => {
        if (scriptEl) {
          scriptEl.dataset.ppccrState = "error";
        }
        finish(reject, new Error("No se pudo cargar external_api.js de Jitsi"));
        if (scriptEl) {
          scriptEl.remove();
          scriptEl = null;
        }
      };

      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.src = src;
        scriptEl.async = true;
        scriptEl.defer = true;
        scriptEl.crossOrigin = "anonymous";
        scriptEl.dataset.ppccrJitsi = "true";
        scriptEl.dataset.ppccrState = "loading";
        document.head.appendChild(scriptEl);
      }

      if (window.JitsiMeetExternalAPI) {
        finish(resolve);
        return;
      }

      scriptEl.addEventListener("load", onLoad);
      scriptEl.addEventListener("error", onError);

      timeoutId = window.setTimeout(() => {
        if (window.JitsiMeetExternalAPI) {
          onLoad();
        } else {
          onError();
        }
      }, 15000);
    }).catch((error) => {
      window[JITSI_PROMISE_KEY] = null;
      throw error;
    });

    return window[JITSI_PROMISE_KEY];
  }

  /**
   * Lee estación desde querystring.
   * @returns {string | null}
   */
  function readStationFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return normalizeStationKey(params.get("station"));
  }

  /**
   * Actualiza querystring con estación actual sin recargar.
   * @param {string} stationKey
   */
  function writeStationToQuery(stationKey) {
    const station = getStationConfig(stationKey);
    if (!station) return;

    const url = new URL(window.location.href);
    url.searchParams.set("station", station.key);
    const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
    window.history.replaceState(null, "", next);
  }

  /**
   * Limpia parámetro `station` del querystring sin recargar.
   */
  function clearStationFromQuery() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("station")) return;
    url.searchParams.delete("station");
    const query = url.searchParams.toString();
    const next = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
    window.history.replaceState(null, "", next);
  }

  /**
   * Controlador de UI para estados de telemedicina.
   */
  class TelemedUIController {
    /**
     * @param {{root: HTMLElement, role: 'doctor'|'station'}} options
     */
    constructor({ root, role }) {
      this.root = root;
      this.role = role;

      this.overlayEl = document.getElementById("telemedOverlay");
      this.overlayTextEl = document.getElementById("telemedOverlayText");
      this.statusbarEl = document.getElementById("telemedStatusbar");
      this.statusTextEl = document.getElementById("telemedStatusText");
      this.stationNameEl = document.getElementById("telemedStationName");
      this.stationSelectorEl = document.getElementById("telemedSelectorPanel");
      this.retryBtn = document.getElementById("telemedRetry");
      this.resetBtn = document.getElementById("telemedReset");
      this.hangupBtn = document.getElementById("telemedHangup");

      this.cards = Array.from(
        document.querySelectorAll(".station-card[data-station]"),
      );
      this.cardMap = new Map();
      this.cards.forEach((card) => {
        const key = normalizeStationKey(card.dataset.station);
        if (!key) return;
        this.cardMap.set(key, card);
        const badge = card.querySelector("[data-badge]");
        if (badge && !badge.dataset.defaultText) {
          badge.dataset.defaultText = badge.textContent?.trim() || "Disponible";
        }
      });
    }

    /**
     * @returns {Array<HTMLElement>}
     */
    getCards() {
      return this.cards;
    }

    /**
     * @param {boolean} visible
     */
    setSelectorVisible(visible) {
      if (!this.stationSelectorEl) return;
      this.stationSelectorEl.hidden = !visible;
    }

    /**
     * @param {boolean} busy
     */
    setBusy(busy) {
      this.root.classList.toggle("is-busy", Boolean(busy));
      this.cards.forEach((card) => {
        card.setAttribute("aria-busy", busy ? "true" : "false");
      });
    }

    /**
     * @param {'idle'|'loading'|'active'|'error'} state
     * @param {string} text
     */
    setStatus(state, text) {
      if (this.statusbarEl) {
        this.statusbarEl.classList.remove(
          "is-idle",
          "is-loading",
          "is-active",
          "is-error",
        );
        this.statusbarEl.classList.add(`is-${state}`);
      }
      if (this.statusTextEl) {
        this.statusTextEl.textContent = text;
      }
    }

    /**
     * @param {boolean} visible
     */
    setRetryVisible(visible) {
      if (!this.retryBtn) return;
      this.retryBtn.hidden = !visible;
    }

    /**
     * @param {string} text
     */
    showOverlay(text) {
      if (!this.overlayEl) return;
      this.overlayEl.hidden = false;
      if (this.overlayTextEl) this.overlayTextEl.textContent = text;
    }

    hideOverlay() {
      if (!this.overlayEl) return;
      this.overlayEl.hidden = true;
    }

    /**
     * @param {HTMLElement} card
     * @param {string} text
     */
    setBadgeText(card, text) {
      const badge = card.querySelector("[data-badge]");
      if (badge) badge.textContent = text;
    }

    /**
     * @param {HTMLElement} card
     */
    resetBadge(card) {
      const badge = card.querySelector("[data-badge]");
      if (!badge) return;
      badge.textContent = badge.dataset.defaultText || "Disponible";
    }

    /**
     * @param {string | null} stationKey
     */
    updateStationLabel(stationKey) {
      if (!this.stationNameEl) return;
      const station = getStationConfig(stationKey);
      this.stationNameEl.textContent = station ? station.label : "Sin estación";
    }

    /**
     * @param {{active?: string|null, loading?: string|null, pending?: string|null, error?: string|null}} states
     */
    paintCards(states = {}) {
      this.cards.forEach((card) => {
        const key = normalizeStationKey(card.dataset.station);
        card.classList.remove("is-active", "is-loading", "is-pending", "is-error");
        card.removeAttribute("aria-current");
        this.resetBadge(card);

        if (!key) return;

        if (states.active && states.active === key) {
          card.classList.add("is-active");
          card.setAttribute("aria-current", "true");
          this.setBadgeText(card, "Activo");
          return;
        }

        if (states.loading && states.loading === key) {
          card.classList.add("is-loading");
          this.setBadgeText(card, "Conectando");
        }

        if (states.pending && states.pending === key) {
          card.classList.add("is-pending");
          this.setBadgeText(card, "En cola");
        }

        if (states.error && states.error === key) {
          card.classList.add("is-error");
          this.setBadgeText(card, "Error");
        }
      });
    }

    /**
     * @param {string} stationKey
     */
    setLoading(stationKey) {
      const station = getStationConfig(stationKey);
      const label = station ? station.label : "estación";
      this.setBusy(true);
      this.setRetryVisible(false);
      this.paintCards({ loading: stationKey });
      this.showOverlay(`Conectando con ${label}...`);
      this.setStatus("loading", `Conectando con ${label}...`);
      this.updateStationLabel(stationKey);
    }

    /**
     * @param {string} stationKey
     */
    setPending(stationKey, context = {}) {
      const station = getStationConfig(stationKey);
      const label = station ? station.label : "estación";
      this.paintCards({
        active: context.active || null,
        loading: context.loading || null,
        pending: stationKey,
      });
      this.setStatus("loading", `Conectando... próximo destino en cola: ${label}.`);
      this.showOverlay(`Conectando... siguiente estación: ${label}`);
      this.updateStationLabel(stationKey);
    }

    /**
     * @param {string} stationKey
     */
    setActive(stationKey) {
      const station = getStationConfig(stationKey);
      const label = station ? station.label : "estación";
      this.setBusy(false);
      this.setRetryVisible(false);
      this.hideOverlay();
      this.paintCards({ active: stationKey });
      this.setStatus("active", `En consulta con ${label}.`);
      this.updateStationLabel(stationKey);
    }

    /**
     * @param {string} [message]
     */
    setIdle(message = "Seleccione una estación para iniciar la consulta.") {
      this.setBusy(false);
      this.setRetryVisible(false);
      this.hideOverlay();
      this.paintCards();
      this.setStatus("idle", message);
      this.updateStationLabel(null);
    }

    /**
     * @param {string} message
     * @param {string | null} stationKey
     */
    setError(message, stationKey = null) {
      this.setBusy(false);
      this.setRetryVisible(true);
      this.hideOverlay();
      this.paintCards({ error: stationKey || undefined });
      this.setStatus("error", message);
      this.updateStationLabel(stationKey);
    }
  }

  /**
   * Gestor singleton de instancia Jitsi para evitar múltiples iframes simultáneos.
   */
  class JitsiManager {
    /** @type {JitsiManager | null} */
    static instance = null;

    /**
     * @param {{mountEl: HTMLElement, ui: TelemedUIController, domain?: string}} options
     * @returns {JitsiManager}
     */
    static getInstance({ mountEl, ui, domain = JITSI_DOMAIN }) {
      if (!JitsiManager.instance) {
        JitsiManager.instance = new JitsiManager({ mountEl, ui, domain });
        return JitsiManager.instance;
      }

      JitsiManager.instance.mountEl = mountEl;
      JitsiManager.instance.ui = ui;
      JitsiManager.instance.domain = domain;
      return JitsiManager.instance;
    }

    /**
     * @param {{mountEl: HTMLElement, ui: TelemedUIController, domain: string}} options
     */
    constructor({ mountEl, ui, domain }) {
      this.mountEl = mountEl;
      this.ui = ui;
      this.domain = domain;
      this.api = null;
      this.currentRoom = null;
      this.currentStationKey = null;
      this.currentRole = "doctor";
      this.lastRequestedStationKey = null;
      this.loadingStationKey = null;
      this.errorStationKey = null;

      this.busy = false;
      this.pendingStationKey = null;
      this.switchToken = 0;
      this.joinTimeoutId = null;
      this.apiListeners = [];
    }

    /**
     * @param {number} token
     * @returns {boolean}
     */
    isSuperseded(token) {
      return token !== this.switchToken;
    }

    /**
     * Limpia timeout de espera de join para evitar falsos positivos.
     */
    clearJoinTimeout() {
      if (this.joinTimeoutId) {
        window.clearTimeout(this.joinTimeoutId);
        this.joinTimeoutId = null;
      }
    }

    /**
     * @param {string} stationKey
     * @param {{role?: 'doctor'|'station'}} [options]
     * @returns {Promise<void>}
     */
    async connectToStation(stationKey, options = {}) {
      const normalized = normalizeStationKey(stationKey);
      const station = getStationConfig(normalized);
      const role = options.role === "station" ? "station" : "doctor";

      if (!station) {
        this.ui.setError("La estación seleccionada no es válida.");
        return;
      }

      this.lastRequestedStationKey = normalized;
      this.currentRole = role;

      if (this.busy) {
        this.pendingStationKey = normalized;
        this.ui.setPending(normalized, {
          loading: this.loadingStationKey,
          active: this.currentStationKey,
        });
        return;
      }

      if (this.api && this.currentStationKey === normalized) {
        this.ui.setActive(normalized);
        return;
      }

      this.busy = true;
      this.loadingStationKey = normalized;
      this.errorStationKey = null;
      const localToken = ++this.switchToken;
      this.ui.setLoading(normalized);

      try {
        await this._disposeCurrent({ preserveUiState: true });
        await raf();

        if (this.isSuperseded(localToken)) return;

        await loadJitsiScript(this.domain);
        if (this.isSuperseded(localToken)) return;

        const roomName = await buildRoomName(normalized);
        if (this.isSuperseded(localToken)) return;

        await this._createApi(roomName, normalized, role, localToken);
        if (this.isSuperseded(localToken)) {
          await this._disposeCurrent({ preserveUiState: true });
          return;
        }

        this.currentStationKey = normalized;
        this.currentRoom = roomName;
      } catch (error) {
        this.loadingStationKey = null;
        this.errorStationKey = normalized;
        if (!this.isSuperseded(localToken)) {
          const stationLabel = station.label;
          this.ui.setError(
            `No se pudo conectar con ${stationLabel}. Revise la red y reintente.`,
            normalized,
          );
        }
        console.error("[telemed] connectToStation error", error);
      } finally {
        if (!this.isSuperseded(localToken)) {
          this.busy = false;
          this.ui.setBusy(false);
        }

        const pending = this.pendingStationKey;
        this.pendingStationKey = null;

        if (!this.busy && pending && pending !== this.currentStationKey) {
          this.connectToStation(pending, { role: this.currentRole }).catch(
            (error) => {
              console.error("[telemed] pending connect error", error);
            },
          );
        }
      }
    }

    /**
     * @param {{reason?: string, suppressStatus?: boolean}} [options]
     * @returns {Promise<void>}
     */
    async disconnect(options = {}) {
      const { reason = "Consulta finalizada.", suppressStatus = false } = options;

      this.pendingStationKey = null;
      this.loadingStationKey = null;
      this.errorStationKey = null;
      this.busy = false;
      this.switchToken += 1;

      await this._disposeCurrent({ preserveUiState: suppressStatus });

      if (!suppressStatus) {
        this.ui.setIdle(reason);
      }
    }

    /**
     * @param {{preserveUiState?: boolean}} [options]
     * @returns {Promise<void>}
     */
    async _disposeCurrent(options = {}) {
      const { preserveUiState = false } = options;
      const currentApi = this.api;

      this.clearJoinTimeout();
      this._unbindApiEvents();

      if (currentApi) {
        try {
          currentApi.executeCommand?.("hangup");
        } catch (error) {
          console.warn("[telemed] hangup warning", error);
        }

        try {
          currentApi.dispose?.();
        } catch (error) {
          console.warn("[telemed] dispose warning", error);
        }
      }

      this.api = null;
      this.currentRoom = null;
      this.currentStationKey = null;

      if (this.mountEl) {
        this.mountEl.innerHTML = "";
      }

      await raf();

      if (!preserveUiState) {
        this.ui.hideOverlay();
      }
    }

    /**
     * @param {string} roomName
     * @param {string} stationKey
     * @param {'doctor'|'station'} role
     * @param {number} token
     * @returns {Promise<void>}
     */
    async _createApi(roomName, stationKey, role, token) {
      if (!window.JitsiMeetExternalAPI) {
        throw new Error("JitsiMeetExternalAPI no disponible");
      }

      if (!this.mountEl) {
        throw new Error("Contenedor de montaje no disponible");
      }

      const station = getStationConfig(stationKey);
      if (!station) {
        throw new Error("Estación inválida en _createApi");
      }

      const displayName =
        role === "doctor"
          ? "Consultorio Central · Médico"
          : `Estación ${station.label}`;

      const toolbarButtons = [
        "microphone",
        "camera",
        "desktop",
        "fullscreen",
        "hangup",
        "settings",
      ];

      const options = {
        roomName,
        parentNode: this.mountEl,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          disableReactions: true,
          enableWelcomePage: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          toolbarButtons,
          defaultLanguage: "es",
          analytics: { disabled: true },
          disableSelfViewSettings: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: toolbarButtons,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(this.domain, options);
      this.api = api;

      this._bindApiEvents(api, { stationKey, role, token });

      this.clearJoinTimeout();
      this.joinTimeoutId = window.setTimeout(() => {
        if (this.api !== api || this.isSuperseded(token)) return;
        const stationLabel = station.label;
        this.loadingStationKey = null;
        this.errorStationKey = stationKey;
        this.ui.setError(
          `La conexión con ${stationLabel} está demorando. Reintente si persiste.`,
          stationKey,
        );
      }, 20000);
    }

    /**
     * @param {JitsiMeetExternalAPI} api
     * @param {{stationKey:string, role:'doctor'|'station', token:number}} context
     */
    _bindApiEvents(api, context) {
      const { stationKey, role, token } = context;
      const station = getStationConfig(stationKey);
      if (!station) return;

      const applyPassword = () => {
        if (!station.password || this.api !== api) return;
        try {
          api.executeCommand("password", station.password);
        } catch (error) {
          console.warn("[telemed] password warning", error);
        }
      };

      const onJoined = () => {
        if (this.api !== api || this.isSuperseded(token)) return;
        this.clearJoinTimeout();
        this.loadingStationKey = null;
        this.errorStationKey = null;
        if (role === "doctor") {
          applyPassword();
        }
        this.ui.setActive(stationKey);
      };

      const onRoleChanged = (event) => {
        if (this.api !== api || this.isSuperseded(token)) return;
        if (role !== "doctor") return;
        if (event && event.role === "moderator") {
          applyPassword();
        }
      };

      const onPasswordRequired = () => {
        if (this.api !== api || this.isSuperseded(token)) return;
        applyPassword();
      };

      const onReadyToClose = () => {
        if (this.api !== api) return;
        if (this.busy) return;
        this.disconnect({ reason: "Llamada finalizada.", suppressStatus: false }).catch(
          (error) => {
            console.error("[telemed] readyToClose disconnect error", error);
          },
        );
      };

      const onVideoConferenceLeft = () => {
        if (this.api !== api || this.isSuperseded(token)) return;
        if (this.busy) return;
        this.loadingStationKey = null;
        this.ui.setIdle("Consulta finalizada. Seleccione una estación.");
      };

      const onError = () => {
        if (this.api !== api || this.isSuperseded(token)) return;
        this.clearJoinTimeout();
        this.loadingStationKey = null;
        this.errorStationKey = stationKey;
        this.ui.setError(
          `Se produjo un error de conferencia en ${station.label}. Reintente.`,
          stationKey,
        );
      };

      this._addApiListener(api, "videoConferenceJoined", onJoined);
      this._addApiListener(api, "participantRoleChanged", onRoleChanged);
      this._addApiListener(api, "passwordRequired", onPasswordRequired);
      this._addApiListener(api, "readyToClose", onReadyToClose);
      this._addApiListener(api, "videoConferenceLeft", onVideoConferenceLeft);
      this._addApiListener(api, "errorOccurred", onError);
      this._addApiListener(api, "conferenceError", onError);
    }

    /**
     * @param {JitsiMeetExternalAPI} api
     * @param {string} eventName
     * @param {(payload?: any) => void} handler
     */
    _addApiListener(api, eventName, handler) {
      if (typeof api.addListener === "function") {
        api.addListener(eventName, handler);
      } else if (typeof api.addEventListener === "function") {
        api.addEventListener(eventName, handler);
      }
      this.apiListeners.push({ api, eventName, handler });
    }

    /**
     * Elimina listeners suscriptos contra la API previa para evitar leaks.
     */
    _unbindApiEvents() {
      if (!Array.isArray(this.apiListeners) || this.apiListeners.length === 0) {
        return;
      }

      this.apiListeners.forEach(({ api, eventName, handler }) => {
        try {
          if (typeof api.removeListener === "function") {
            api.removeListener(eventName, handler);
          } else if (typeof api.removeEventListener === "function") {
            api.removeEventListener(eventName, handler);
          }
        } catch (error) {
          console.warn("[telemed] remove listener warning", error);
        }
      });

      this.apiListeners = [];
    }
  }

  /**
   * Inicializa la página de telemedicina según rol.
   */
  function initTelemedPage() {
    const root = document.getElementById("telemedRoot");
    const mountEl = document.getElementById("jitsiMount");
    if (!root || !mountEl) return;

    /** @type {'doctor'|'station'} */
    const role = root.dataset.role === "station" ? "station" : "doctor";

    const ui = new TelemedUIController({ root, role });
    const manager = JitsiManager.getInstance({ mountEl, ui, domain: JITSI_DOMAIN });

    const cards = ui.getCards();
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const stationKey = normalizeStationKey(card.dataset.station);
        if (!stationKey) return;

        if (role === "station") {
          writeStationToQuery(stationKey);
          ui.setSelectorVisible(false);
        }

        manager.connectToStation(stationKey, { role }).catch((error) => {
          console.error("[telemed] click connect error", error);
        });
      });
    });

    if (ui.retryBtn) {
      ui.retryBtn.addEventListener("click", () => {
        const retryKey =
          manager.pendingStationKey ||
          manager.lastRequestedStationKey ||
          readStationFromQuery() ||
          "saavedra";

        manager.connectToStation(retryKey, { role }).catch((error) => {
          console.error("[telemed] retry error", error);
        });
      });
    }

    if (ui.resetBtn) {
      ui.resetBtn.addEventListener("click", () => {
        const message =
          role === "station"
            ? "Seleccione su estación para iniciar la conexión."
            : "Seleccione una estación para iniciar la consulta.";

        if (role === "station") {
          ui.setSelectorVisible(true);
          clearStationFromQuery();
        }

        manager
          .disconnect({ reason: message })
          .catch((error) => {
            console.error("[telemed] reset disconnect error", error);
          });
      });
    }

    if (ui.hangupBtn) {
      ui.hangupBtn.addEventListener("click", () => {
        manager.disconnect({ reason: "Llamada finalizada por el operador." }).catch(
          (error) => {
            console.error("[telemed] hangup disconnect error", error);
          },
        );
      });
    }

    if (role === "doctor") {
      ui.setSelectorVisible(true);
      ui.setIdle("Seleccione una estación para iniciar la consulta.");
    } else {
      const stationFromQuery = readStationFromQuery();
      if (stationFromQuery) {
        ui.setSelectorVisible(false);
        manager.connectToStation(stationFromQuery, { role: "station" }).catch(
          (error) => {
            console.error("[telemed] autoconnect station error", error);
          },
        );
      } else {
        ui.setSelectorVisible(true);
        ui.setIdle("Seleccione su estación para iniciar la conexión.");
      }
    }

    const cleanup = () => {
      manager.disconnect({ suppressStatus: true }).catch(() => {
        // best effort durante cierre de página
      });
    };

    window.addEventListener("pagehide", cleanup);
    window.addEventListener("beforeunload", cleanup);
  }

  document.addEventListener("DOMContentLoaded", initTelemedPage);
})();
