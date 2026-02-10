"use strict";

/**
 * @file Teleconsulta embebida P2P para PPCCR 2026.
 * Integra Firebase Realtime Database (señalización/presencia) y Jitsi IFrame API.
 */
(() => {
  const STATIONS = Object.freeze([
    Object.freeze({ id: "saavedra", name: "Parque Saavedra" }),
    Object.freeze({ id: "aristobulo", name: "Aristóbulo del Valle" }),
    Object.freeze({ id: "rivadavia", name: "Parque Rivadavia" }),
    Object.freeze({ id: "chacabuco", name: "Parque Chacabuco" }),
    Object.freeze({ id: "admin", name: "Administrador" }),
  ]);

  const STATION_MAP = new Map(STATIONS.map((station) => [station.id, station]));

  const JITSI_DOMAIN = "meet.jit.si";
  const JITSI_SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

  const FIREBASE_CONFIG =
    window.PPCCR_FIREBASE_CONFIG || window.firebaseConfig || window.FIREBASE_CONFIG || null;

  const STORAGE_KEYS = Object.freeze({
    station: "ppccr_station",
    stationId: "ppccr_station_id",
    stationName: "ppccr_station_name",
    stationLegacy: "ppccr_auth_user",
  });

  const DB_PATHS = Object.freeze({
    presence: "ppccr/teleconsulta/presence",
    calls: "ppccr/teleconsulta/calls",
  });

  const CALL_TIMEOUT_MS = 30_000;
  const LIVE_CALL_STATUSES = new Set(["ringing", "accepted", "in-call"]);

  /**
   * @param {string | null | undefined} value
   * @returns {string}
   */
  function normalizeStationId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  /**
   * @param {string | null | undefined} stationId
   * @returns {{id: string, name: string} | null}
   */
  function getStationById(stationId) {
    const key = normalizeStationId(stationId);
    if (!key) return null;
    return STATION_MAP.get(key) || null;
  }

  /**
   * @param {string} key
   * @returns {string}
   */
  function safeSessionGet(key) {
    try {
      return sessionStorage.getItem(key) || "";
    } catch (error) {
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
      // no-op
    }
  }

  /**
   * @param {unknown} candidate
   * @returns {{id: string, name: string} | null}
   */
  function resolveStation(candidate) {
    if (!candidate) return null;

    if (typeof candidate === "string") {
      const station = getStationById(candidate);
      if (!station) return null;
      return { id: station.id, name: station.name };
    }

    if (typeof candidate === "object") {
      const value = /** @type {{id?: unknown, stationId?: unknown, name?: unknown, stationName?: unknown}} */ (
        candidate
      );

      const id = normalizeStationId(value.stationId || value.id);
      const byId = getStationById(id);
      if (!byId) return null;

      const name =
        String(value.stationName || value.name || "").trim() ||
        byId.name;

      return { id: byId.id, name };
    }

    return null;
  }

  /**
   * Fuente de verdad de estación actual (dataset body -> sessionStorage).
   * @returns {{id: string, name: string} | null}
   */
  function getActiveStation() {
    const fromDataset = resolveStation({
      stationId: document.body?.dataset.station,
      stationName: document.body?.dataset.stationName,
    });
    if (fromDataset) return fromDataset;

    const rawStation = safeSessionGet(STORAGE_KEYS.station);
    if (rawStation) {
      try {
        const parsed = JSON.parse(rawStation);
        const parsedStation = resolveStation(parsed);
        if (parsedStation) return parsedStation;
      } catch (error) {
        const fallback = resolveStation({
          stationId: safeSessionGet(STORAGE_KEYS.stationId),
          stationName: rawStation,
        });
        if (fallback) return fallback;
      }
    }

    const byId = resolveStation({
      stationId: safeSessionGet(STORAGE_KEYS.stationId),
      stationName:
        safeSessionGet(STORAGE_KEYS.stationName) ||
        safeSessionGet(STORAGE_KEYS.stationLegacy),
    });

    return byId;
  }

  /**
   * @param {{id: string, name: string}} station
   */
  function persistStationState(station) {
    if (!station || !document.body) return;

    document.body.dataset.station = station.id;
    document.body.dataset.stationName = station.name;

    safeSessionSet(
      STORAGE_KEYS.station,
      JSON.stringify({
        id: station.id,
        name: station.name,
        stationId: station.id,
        stationName: station.name,
      }),
    );
    safeSessionSet(STORAGE_KEYS.stationId, station.id);
    safeSessionSet(STORAGE_KEYS.stationName, station.name);
    safeSessionSet(STORAGE_KEYS.stationLegacy, station.name);
  }

  /**
   * @param {number} [size]
   * @returns {string}
   */
  function randomSuffix(size = 6) {
    return Math.random().toString(36).slice(2, 2 + size);
  }

  /**
   * @returns {string}
   */
  function buildCallId() {
    return `${Date.now()}_${randomSuffix(6)}`;
  }

  /**
   * @param {{fromId: string, toId: string, callId: string}} params
   * @returns {string}
   */
  function buildRoomName({ fromId, toId, callId }) {
    return `PPCCR_2026_P2P_${callId}_${fromId}_${toId}`;
  }

  /**
   * @param {string} stationId
   * @returns {string}
   */
  function getPresencePath(stationId) {
    return `${DB_PATHS.presence}/${stationId}`;
  }

  /**
   * @param {string} stationId
   * @returns {string}
   */
  function getCallsPath(stationId) {
    return `${DB_PATHS.calls}/${stationId}`;
  }

  class FirebaseTeleconsultaService {
    /**
     * @param {Record<string, unknown> | null} config
     */
    constructor(config) {
      this.config = config;
      this.initPromise = null;
      this.app = null;
      this.db = null;
      this.auth = null;
      this.presenceRef = null;
      this.presenceOnDisconnect = null;
      this.presenceStation = null;
    }

    /**
     * @returns {Promise<void>}
     */
    async init() {
      if (!this.config) {
        throw new Error("Teleconsulta requiere Firebase config");
      }

      if (this.initPromise) return this.initPromise;

      this.initPromise = (async () => {
        if (!window.firebase || !window.firebase.initializeApp) {
          throw new Error("Firebase SDK no disponible");
        }

        const apps = Array.isArray(window.firebase.apps) ? window.firebase.apps : [];
        this.app = apps.length > 0 ? apps[0] : window.firebase.initializeApp(this.config);
        this.auth = window.firebase.auth(this.app);
        this.db = window.firebase.database(this.app);

        if (!this.auth.currentUser) {
          await this.auth.signInAnonymously();
        }
      })().catch((error) => {
        this.initPromise = null;
        throw error;
      });

      return this.initPromise;
    }

    /**
     * @returns {any}
     */
    getServerTimestamp() {
      return window.firebase.database.ServerValue.TIMESTAMP;
    }

    /**
     * @param {string} path
     * @returns {any}
     */
    ref(path) {
      return this.db.ref(path);
    }

    /**
     * @param {{id: string, name: string}} station
     * @returns {Promise<void>}
     */
    async setPresence(station) {
      await this.init();

      const nextStation = resolveStation(station);
      if (!nextStation) return;

      const previous = this.presenceStation;
      if (previous && previous.id !== nextStation.id) {
        try {
          await this.ref(getPresencePath(previous.id)).set({
            online: false,
            name: previous.name,
            ts: this.getServerTimestamp(),
          });
        } catch (error) {
          console.warn("[teleconsulta] No se pudo limpiar presence previa", error);
        }
      }

      if (this.presenceOnDisconnect) {
        try {
          await this.presenceOnDisconnect.cancel();
        } catch (error) {
          // no-op
        }
      }

      this.presenceRef = this.ref(getPresencePath(nextStation.id));
      await this.presenceRef.set({
        online: true,
        name: nextStation.name,
        ts: this.getServerTimestamp(),
      });

      const onDisconnect = this.presenceRef.onDisconnect();
      await onDisconnect.set({
        online: false,
        name: nextStation.name,
        ts: this.getServerTimestamp(),
      });

      this.presenceOnDisconnect = onDisconnect;
      this.presenceStation = nextStation;
    }

    /**
     * @returns {Promise<void>}
     */
    async clearPresence() {
      if (!this.db || !this.presenceStation) return;

      const station = this.presenceStation;

      if (this.presenceOnDisconnect) {
        try {
          await this.presenceOnDisconnect.cancel();
        } catch (error) {
          // no-op
        }
      }

      try {
        await this.ref(getPresencePath(station.id)).set({
          online: false,
          name: station.name,
          ts: this.getServerTimestamp(),
        });
      } catch (error) {
        console.warn("[teleconsulta] No se pudo limpiar presence", error);
      }

      this.presenceOnDisconnect = null;
      this.presenceRef = null;
      this.presenceStation = null;
    }

    /**
     * @param {string} path
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listen(path, handler, onError) {
      const ref = this.ref(path);
      const onValue = (snapshot) => {
        handler(snapshot.val());
      };

      const onListenError = (error) => {
        if (typeof onError === "function") {
          onError(error);
          return;
        }
        console.error("[teleconsulta] Listener error", error);
      };

      ref.on("value", onValue, onListenError);
      return () => {
        ref.off("value", onValue);
      };
    }

    /**
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenPresence(handler, onError) {
      return this.listen(DB_PATHS.presence, handler, onError);
    }

    /**
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenCalls(handler, onError) {
      return this.listen(DB_PATHS.calls, handler, onError);
    }

    /**
     * @param {string} stationId
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenInbox(stationId, handler, onError) {
      return this.listen(getCallsPath(stationId), handler, onError);
    }

    /**
     * @param {string} stationId
     * @param {Record<string, unknown>} call
     * @returns {Promise<void>}
     */
    async setCall(stationId, call) {
      await this.init();
      const payload = {
        ...call,
        updatedAt: this.getServerTimestamp(),
      };
      await this.ref(getCallsPath(stationId)).set(payload);
    }

    /**
     * @param {string} stationId
     * @param {Record<string, unknown>} patch
     * @returns {Promise<void>}
     */
    async patchCall(stationId, patch) {
      await this.init();
      const payload = {
        ...patch,
        updatedAt: this.getServerTimestamp(),
      };
      await this.ref(getCallsPath(stationId)).update(payload);
    }

    /**
     * @param {string} stationId
     * @returns {Promise<void>}
     */
    async clearCall(stationId) {
      await this.init();
      await this.ref(getCallsPath(stationId)).remove();
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async clearCallIfMatch(stationId, callId) {
      await this.init();
      const ref = this.ref(getCallsPath(stationId));
      const snapshot = await ref.once("value");
      const value = snapshot.val();

      if (value && String(value.callId || "") === callId) {
        await ref.remove();
      }
    }
  }

  class RingtoneService {
    constructor() {
      this.audioContext = null;
      this.intervalId = 0;
      this.running = false;
    }

    /**
     * @returns {Promise<void>}
     */
    async start() {
      if (this.running) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      try {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
      } catch (error) {
        this.audioContext = null;
        return;
      }

      this.running = true;

      const beep = () => {
        if (!this.audioContext || this.audioContext.state === "closed") return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      };

      beep();
      this.intervalId = window.setInterval(beep, 1500);
    }

    stop() {
      this.running = false;

      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = 0;
      }

      if (this.audioContext) {
        this.audioContext.close().catch(() => {
          // no-op
        });
      }

      this.audioContext = null;
    }
  }

  class JitsiSingleton {
    static instance = null;

    /**
     * @returns {JitsiSingleton}
     */
    static getInstance() {
      if (!JitsiSingleton.instance) {
        JitsiSingleton.instance = new JitsiSingleton();
      }
      return JitsiSingleton.instance;
    }

    constructor() {
      this.api = null;
      this.scriptPromise = null;
      this.listeners = [];
      this.hostNode = document.createElement("div");
      this.hostNode.className = "telew__meetingHost";
    }

    /**
     * @returns {Promise<void>}
     */
    async loadJitsiScriptOnce() {
      if (window.JitsiMeetExternalAPI) return;
      if (this.scriptPromise) return this.scriptPromise;

      this.scriptPromise = new Promise((resolve, reject) => {
        let settled = false;
        let timeoutId = 0;

        /** @type {HTMLScriptElement | null} */
        let scriptEl = document.querySelector(`script[src="${JITSI_SCRIPT_SRC}"]`);

        const cleanup = () => {
          if (timeoutId) window.clearTimeout(timeoutId);
          if (scriptEl) {
            scriptEl.removeEventListener("load", onLoad);
            scriptEl.removeEventListener("error", onError);
          }
        };

        const finish = (callback, payload) => {
          if (settled) return;
          settled = true;
          cleanup();
          callback(payload);
        };

        const onLoad = () => {
          if (window.JitsiMeetExternalAPI) {
            finish(resolve);
            return;
          }
          finish(reject, new Error("Jitsi cargó sin exponer JitsiMeetExternalAPI"));
        };

        const onError = () => {
          finish(reject, new Error("No se pudo cargar external_api.js de Jitsi"));
          if (scriptEl) {
            scriptEl.remove();
            scriptEl = null;
          }
        };

        if (!scriptEl) {
          scriptEl = document.createElement("script");
          scriptEl.src = JITSI_SCRIPT_SRC;
          scriptEl.async = true;
          scriptEl.defer = true;
          scriptEl.crossOrigin = "anonymous";
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
        }, 15_000);
      }).catch((error) => {
        this.scriptPromise = null;
        throw error;
      });

      return this.scriptPromise;
    }

    /**
     * @param {HTMLElement} parentNode
     */
    moveHost(parentNode) {
      if (!(parentNode instanceof HTMLElement)) return;
      if (this.hostNode.parentNode === parentNode) return;
      parentNode.appendChild(this.hostNode);
    }

    /**
     * @param {JitsiMeetExternalAPI} api
     * @param {string} eventName
     * @param {(payload?: any) => void} handler
     */
    bind(api, eventName, handler) {
      if (typeof api.addListener === "function") {
        api.addListener(eventName, handler);
      } else if (typeof api.addEventListener === "function") {
        api.addEventListener(eventName, handler);
      }

      this.listeners.push({ api, eventName, handler });
    }

    unbindAll() {
      this.listeners.forEach(({ api, eventName, handler }) => {
        try {
          if (typeof api.removeListener === "function") {
            api.removeListener(eventName, handler);
          } else if (typeof api.removeEventListener === "function") {
            api.removeEventListener(eventName, handler);
          }
        } catch (error) {
          // no-op
        }
      });

      this.listeners = [];
    }

    /**
     * @param {{
     *   roomName: string,
     *   displayName: string,
     *   parentNode: HTMLElement,
     *   onReadyToClose?: () => void,
     *   onAudioMuteStatus?: (muted: boolean) => void,
     *   onVideoMuteStatus?: (muted: boolean) => void,
     *   onParticipantJoined?: () => void
     * }} options
     * @returns {Promise<void>}
     */
    async mountMeeting(options) {
      const {
        roomName,
        displayName,
        parentNode,
        onReadyToClose,
        onAudioMuteStatus,
        onVideoMuteStatus,
        onParticipantJoined,
      } = options;

      if (!roomName) throw new Error("Room inválida");
      if (!(parentNode instanceof HTMLElement)) {
        throw new Error("Parent node inválido para Jitsi");
      }

      await this.loadJitsiScriptOnce();
      this.moveHost(parentNode);
      await this.disposeMeeting();

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: this.hostNode,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          disableInviteFunctions: true,
          disableProfile: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          TOOLBAR_BUTTONS: [],
        },
      });

      this.api = api;

      this.bind(api, "readyToClose", () => {
        if (typeof onReadyToClose === "function") onReadyToClose();
      });

      this.bind(api, "audioMuteStatusChanged", (event) => {
        if (typeof onAudioMuteStatus === "function") {
          onAudioMuteStatus(Boolean(event?.muted));
        }
      });

      this.bind(api, "videoMuteStatusChanged", (event) => {
        if (typeof onVideoMuteStatus === "function") {
          onVideoMuteStatus(Boolean(event?.muted));
        }
      });

      this.bind(api, "participantJoined", () => {
        if (typeof onParticipantJoined === "function") onParticipantJoined();
      });
    }

    /**
     * @returns {Promise<void>}
     */
    async disposeMeeting() {
      const api = this.api;
      this.unbindAll();

      if (api) {
        try {
          api.dispose();
        } catch (error) {
          // no-op
        }
      }

      this.api = null;
      this.hostNode.innerHTML = "";
    }

    /**
     * @param {string} command
     */
    executeCommand(command) {
      if (!this.api) return;
      try {
        this.api.executeCommand(command);
      } catch (error) {
        console.warn("[teleconsulta] executeCommand error", error);
      }
    }

    /**
     * @returns {boolean}
     */
    hasMeeting() {
      return Boolean(this.api);
    }
  }

  class TeleconsultaController {
    /**
     * @param {{
     *  widget: HTMLElement,
     *  stationPill: HTMLButtonElement,
     *  stationName: HTMLElement,
     *  targets: HTMLElement,
     *  status: HTMLElement,
     *  callBtn: HTMLButtonElement,
     *  hangupBtn: HTMLButtonElement,
     *  stage: HTMLElement,
     *  placeholder: HTMLElement,
     *  controls: HTMLElement,
     *  toggleMic: HTMLButtonElement,
     *  toggleCam: HTMLButtonElement,
     *  fullscreenBtn: HTMLButtonElement,
     *  incomingModal: HTMLElement,
     *  incomingFrom: HTMLElement,
     *  incomingAccept: HTMLButtonElement,
     *  incomingDecline: HTMLButtonElement,
     *  fullscreenModal: HTMLElement,
     *  fullscreenStage: HTMLElement,
     *  fsLabel: HTMLElement,
     *  fsMinimize: HTMLButtonElement,
     *  fsHangup: HTMLButtonElement,
     * }} refs
     */
    constructor(refs) {
      this.refs = refs;

      this.firebase = new FirebaseTeleconsultaService(FIREBASE_CONFIG);
      this.jitsi = JitsiSingleton.getInstance();
      this.ringtone = new RingtoneService();

      this.state = "idle";
      this.activeCall = null;
      this.currentStation = null;
      this.selectedTargetId = null;
      this.opSeq = 0;
      this.firebaseReady = false;
      this.fullscreenOpen = false;
      this.destroyed = false;
      this.stationRollbackInProgress = false;

      this.presenceById = {};
      this.busyById = {};

      this.outgoingTimeoutId = 0;
      this.unsubscribePresence = null;
      this.unsubscribeCalls = null;
      this.unsubscribeInbox = null;
      this.unsubscribeOutgoing = null;
      this.cleanupFns = [];
    }

    /**
     * @returns {boolean}
     */
    get hasFirebaseConfig() {
      return Boolean(FIREBASE_CONFIG);
    }

    /**
     * @returns {number}
     */
    beginOp() {
      this.opSeq += 1;
      return this.opSeq;
    }

    /**
     * @param {number} op
     * @returns {boolean}
     */
    isOpCurrent(op) {
      return !this.destroyed && op === this.opSeq;
    }

    /**
     * @param {EventTarget} target
     * @param {string} eventName
     * @param {(event: any) => void} handler
     * @param {AddEventListenerOptions | boolean} [options]
     */
    on(target, eventName, handler, options) {
      if (!target || typeof target.addEventListener !== "function") return;
      target.addEventListener(eventName, handler, options);
      this.cleanupFns.push(() => {
        target.removeEventListener(eventName, handler, options);
      });
    }

    bindUI() {
      this.on(this.refs.stationPill, "click", () => {
        this.openStationPicker();
      });

      this.on(this.refs.targets, "click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const card = target ? target.closest(".telew-target[data-target-id]") : null;
        if (!(card instanceof HTMLButtonElement)) return;

        this.selectedTargetId = normalizeStationId(card.dataset.targetId);
        this.renderTargets();
        this.syncUI();

        const station = getStationById(this.selectedTargetId);
        if (station && this.state === "idle") {
          this.setStatus(`Destino seleccionado: ${station.name}.`, "info");
        }
      });

      this.on(this.refs.callBtn, "click", () => {
        this.startOutgoingCall().catch((error) => {
          console.error("[teleconsulta] Error en llamada saliente", error);
        });
      });

      this.on(this.refs.hangupBtn, "click", () => {
        this.hangup("Llamada finalizada.").catch((error) => {
          console.error("[teleconsulta] Error al colgar", error);
        });
      });

      this.on(this.refs.incomingAccept, "click", () => {
        this.acceptIncomingCall().catch((error) => {
          console.error("[teleconsulta] Error al aceptar llamada", error);
        });
      });

      this.on(this.refs.incomingDecline, "click", () => {
        this.declineIncomingCall().catch((error) => {
          console.error("[teleconsulta] Error al rechazar llamada", error);
        });
      });

      this.on(this.refs.incomingModal, "click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target || target.getAttribute("data-close") !== "1") return;
        this.declineIncomingCall().catch((error) => {
          console.error("[teleconsulta] Error al cerrar modal entrante", error);
        });
      });

      this.on(this.refs.toggleMic, "click", () => {
        this.jitsi.executeCommand("toggleAudio");
      });

      this.on(this.refs.toggleCam, "click", () => {
        this.jitsi.executeCommand("toggleVideo");
      });

      this.on(this.refs.fullscreenBtn, "click", () => {
        this.openFullscreen();
      });

      this.on(this.refs.fsMinimize, "click", () => {
        this.closeFullscreen();
      });

      this.on(this.refs.fsHangup, "click", () => {
        this.hangup("Llamada finalizada.").catch((error) => {
          console.error("[teleconsulta] Error al colgar desde fullscreen", error);
        });
      });

      this.on(document, "keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;

        if (event.key === "Escape" && this.fullscreenOpen) {
          event.preventDefault();
          this.closeFullscreen();
          return;
        }

        if (
          event.key === "Escape" &&
          this.refs.incomingModal.classList.contains("is-open")
        ) {
          event.preventDefault();
          this.declineIncomingCall().catch((error) => {
            console.error("[teleconsulta] Error al rechazar por Escape", error);
          });
        }
      });
    }

    bindGlobalEvents() {
      const stationChangeHandler = (event) => {
        if (this.stationRollbackInProgress) return;

        const detail =
          event instanceof CustomEvent && event.detail ? event.detail : null;

        const nextStation = resolveStation({
          stationId: detail?.stationId || detail?.id,
          stationName: detail?.stationName || detail?.name,
        });

        this.handleStationChange(nextStation || getActiveStation()).catch((error) => {
          console.error("[teleconsulta] Error al cambiar estación", error);
        });
      };

      this.on(window, "ppccr:station-changed", stationChangeHandler);
      this.on(window, "ppccr:stationChanged", stationChangeHandler);

      const cleanup = () => {
        this.destroy().catch(() => {
          // no-op
        });
      };

      this.on(window, "beforeunload", cleanup);
      this.on(window, "pagehide", cleanup);
    }

    /**
     * @returns {Promise<void>}
     */
    async init() {
      this.bindUI();
      this.bindGlobalEvents();

      this.syncMuteButtons({ audioMuted: false, videoMuted: true });
      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );

      await this.handleStationChange(getActiveStation(), {
        force: true,
        skipConfirm: true,
      });

      if (!this.hasFirebaseConfig) {
        this.setStatus("Teleconsulta requiere Firebase config.", "warn");
        this.renderTargets();
        this.syncUI();
        return;
      }

      try {
        await this.firebase.init();
        this.firebaseReady = true;
      } catch (error) {
        this.firebaseReady = false;
        this.setStatus("No se pudo inicializar Firebase para teleconsulta.", "error");
        this.renderTargets();
        this.syncUI();
        return;
      }

      this.subscribeGlobalRealtime();

      if (this.currentStation) {
        try {
          await this.bindStationRealtime(this.currentStation);
        } catch (error) {
          console.error("[teleconsulta] Error al enlazar estación", error);
        }
      }

      if (this.currentStation) {
        this.setStatus("Listo.", "ok");
      } else {
        this.setStatus("Seleccioná una estación para habilitar teleconsulta.", "warn");
      }

      this.renderTargets();
      this.syncUI();
    }

    /**
     * @param {{id?: unknown, stationId?: unknown, name?: unknown, stationName?: unknown} | null} stationCandidate
     * @param {{force?: boolean, skipConfirm?: boolean}} [options]
     * @returns {Promise<void>}
     */
    async handleStationChange(stationCandidate, options = {}) {
      const { force = false, skipConfirm = false } = options;
      const nextStation = resolveStation(stationCandidate);

      if (!nextStation) {
        this.currentStation = null;
        this.selectedTargetId = null;
        this.refs.stationName.textContent = "Sin estación";

        this.clearInboxListener();
        this.clearOutgoingWatch();
        if (this.firebaseReady) {
          await this.firebase.clearPresence();
        }
        this.renderTargets();
        this.syncUI();
        this.setStatus("Seleccioná una estación para habilitar teleconsulta.", "warn");
        return;
      }

      const previousStation = this.currentStation;
      const changedStation = !previousStation || previousStation.id !== nextStation.id;

      if (
        !force &&
        previousStation &&
        previousStation.id === nextStation.id &&
        previousStation.name === nextStation.name
      ) {
        return;
      }

      const op = this.beginOp();

      if (!force && changedStation && this.hasOngoingCall()) {
        if (!skipConfirm) {
          const confirmed = window.confirm(
            "Cambiar estación corta la llamada actual. ¿Desea continuar?",
          );

          if (!confirmed && previousStation) {
            this.rollbackStation(previousStation);
            return;
          }
        }

        await this.hangup("Llamada finalizada por cambio de estación.", {
          notifyPeer: true,
          op,
        });

        if (!this.isOpCurrent(op)) return;
      }

      this.currentStation = nextStation;
      persistStationState(nextStation);
      this.refs.stationName.textContent = nextStation.name;

      if (this.selectedTargetId === nextStation.id) {
        this.selectedTargetId = null;
      }

      if (this.firebaseReady && changedStation) {
        await this.bindStationRealtime(nextStation);
        if (!this.isOpCurrent(op)) return;
      }

      this.renderTargets();
      this.syncUI();

      if (this.firebaseReady) {
        this.setStatus("Listo.", "ok");
      } else if (this.hasFirebaseConfig) {
        this.setStatus("Inicializando señalización...", "info");
      } else {
        this.setStatus("Teleconsulta requiere Firebase config.", "warn");
      }
    }

    /**
     * @param {{id: string, name: string}} station
     */
    rollbackStation(station) {
      this.stationRollbackInProgress = true;

      try {
        if (window.PPCCR?.station && typeof window.PPCCR.station.set === "function") {
          window.PPCCR.station.set(station.id);
        } else {
          persistStationState(station);
          window.dispatchEvent(
            new CustomEvent("ppccr:station-changed", {
              detail: {
                stationId: station.id,
                stationName: station.name,
              },
            }),
          );
        }
      } finally {
        window.setTimeout(() => {
          this.stationRollbackInProgress = false;
        }, 0);
      }
    }

    subscribeGlobalRealtime() {
      this.clearGlobalRealtime();

      this.unsubscribePresence = this.firebase.listenPresence(
        (snapshotValue) => {
          const nextPresence = {};

          if (snapshotValue && typeof snapshotValue === "object") {
            Object.entries(snapshotValue).forEach(([stationId, value]) => {
              const normalizedId = normalizeStationId(stationId);
              if (!getStationById(normalizedId)) return;

              const payload =
                value && typeof value === "object"
                  ? /** @type {{online?: unknown, name?: unknown}} */ (value)
                  : {};

              nextPresence[normalizedId] = {
                online: Boolean(payload.online),
                name: String(payload.name || "").trim(),
              };
            });
          }

          this.presenceById = nextPresence;
          this.renderTargets();
          this.syncUI();
        },
        (error) => {
          console.error("[teleconsulta] Presence listener error", error);
        },
      );

      this.unsubscribeCalls = this.firebase.listenCalls(
        (snapshotValue) => {
          const busy = {};

          if (snapshotValue && typeof snapshotValue === "object") {
            Object.values(snapshotValue).forEach((callCandidate) => {
              if (!callCandidate || typeof callCandidate !== "object") return;

              const call = /** @type {{status?: unknown, fromId?: unknown, toId?: unknown}} */ (
                callCandidate
              );

              const status = String(call.status || "").toLowerCase();
              if (!LIVE_CALL_STATUSES.has(status)) return;

              const fromId = normalizeStationId(call.fromId);
              const toId = normalizeStationId(call.toId);

              if (getStationById(fromId)) busy[fromId] = true;
              if (getStationById(toId)) busy[toId] = true;
            });
          }

          this.busyById = busy;
          this.renderTargets();
          this.syncUI();
        },
        (error) => {
          console.error("[teleconsulta] Calls listener error", error);
        },
      );
    }

    /**
     * @param {{id: string, name: string}} station
     * @returns {Promise<void>}
     */
    async bindStationRealtime(station) {
      this.clearInboxListener();
      await this.firebase.setPresence(station);

      this.unsubscribeInbox = this.firebase.listenInbox(
        station.id,
        (snapshotValue) => {
          this.handleOwnInboxSnapshot(snapshotValue).catch((error) => {
            console.error("[teleconsulta] Inbox handler error", error);
          });
        },
        (error) => {
          console.error("[teleconsulta] Inbox listener error", error);
        },
      );
    }

    clearGlobalRealtime() {
      if (this.unsubscribePresence) {
        this.unsubscribePresence();
        this.unsubscribePresence = null;
      }

      if (this.unsubscribeCalls) {
        this.unsubscribeCalls();
        this.unsubscribeCalls = null;
      }
    }

    clearInboxListener() {
      if (this.unsubscribeInbox) {
        this.unsubscribeInbox();
        this.unsubscribeInbox = null;
      }
    }

    clearOutgoingTimeout() {
      if (this.outgoingTimeoutId) {
        window.clearTimeout(this.outgoingTimeoutId);
        this.outgoingTimeoutId = 0;
      }
    }

    clearOutgoingWatch() {
      this.clearOutgoingTimeout();
      if (this.unsubscribeOutgoing) {
        this.unsubscribeOutgoing();
        this.unsubscribeOutgoing = null;
      }
    }

    /**
     * @param {string} stationId
     * @returns {{code: 'available'|'offline'|'busy', label: string}}
     */
    getTargetStatus(stationId) {
      if (!this.hasFirebaseConfig || !this.firebaseReady) {
        return { code: "offline", label: "Offline" };
      }

      const presence = this.presenceById[stationId];
      const isOnline = Boolean(presence && presence.online);

      if (!isOnline) {
        return { code: "offline", label: "Offline" };
      }

      if (this.busyById[stationId]) {
        return { code: "busy", label: "Ocupado" };
      }

      return { code: "available", label: "Disponible" };
    }

    renderTargets() {
      const { targets } = this.refs;
      targets.innerHTML = "";

      const activeStationId = this.currentStation?.id || "";

      STATIONS.filter((station) => station.id !== activeStationId).forEach((station) => {
        const status = this.getTargetStatus(station.id);
        const selected = station.id === this.selectedTargetId;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "telew-target";
        card.dataset.targetId = station.id;
        card.dataset.state = status.code;
        card.setAttribute("role", "listitem");
        card.setAttribute("aria-pressed", String(selected));

        if (selected) {
          card.classList.add("is-selected");
        }

        card.innerHTML = `
          <span class="telew-target__name">${station.name}</span>
          <span class="telew-target__status">
            <span class="telew-target__dot" aria-hidden="true"></span>
            <span>${status.label}</span>
          </span>
        `;

        targets.appendChild(card);
      });
    }

    /**
     * @param {string} message
     * @param {'info'|'ok'|'warn'|'error'} tone
     */
    setStatus(message, tone = "info") {
      this.refs.status.textContent = message;
      this.refs.status.dataset.tone = tone;
    }

    /**
     * @param {string} title
     * @param {string} description
     */
    setPlaceholder(title, description) {
      const titleEl = this.refs.placeholder.querySelector(".telew__placeholderTitle");
      const textEl = this.refs.placeholder.querySelector(".telew__placeholderText");

      if (titleEl) titleEl.textContent = title;
      if (textEl) textEl.textContent = description;
    }

    /**
     * @param {{audioMuted: boolean, videoMuted: boolean}} state
     */
    syncMuteButtons(state) {
      this.refs.toggleMic.setAttribute("aria-pressed", String(!state.audioMuted));
      this.refs.toggleCam.setAttribute("aria-pressed", String(!state.videoMuted));
    }

    syncUI() {
      const canCall = this.canCallSelectedTarget();

      this.refs.callBtn.hidden = this.state !== "idle";
      this.refs.callBtn.disabled = !canCall;

      this.refs.hangupBtn.hidden = !(
        this.state === "outgoing" ||
        this.state === "in-call" ||
        this.state === "ending"
      );

      this.refs.controls.hidden = !(this.state === "in-call" && this.jitsi.hasMeeting());
      this.refs.fullscreenBtn.disabled = !(this.state === "in-call" && this.jitsi.hasMeeting());

      const hasMeeting = this.jitsi.hasMeeting();
      this.refs.placeholder.hidden = hasMeeting;
      this.refs.widget.classList.toggle(
        "is-busy",
        this.state === "outgoing" || this.state === "ending",
      );

      if (!hasMeeting && this.fullscreenOpen) {
        this.closeFullscreen({ restoreFocus: false });
      }
    }

    /**
     * @returns {boolean}
     */
    canCallSelectedTarget() {
      if (this.state !== "idle") return false;
      if (!this.currentStation) return false;
      if (!this.hasFirebaseConfig || !this.firebaseReady) return false;

      const target = getStationById(this.selectedTargetId);
      if (!target) return false;
      if (target.id === this.currentStation.id) return false;

      const targetStatus = this.getTargetStatus(target.id);
      return targetStatus.code === "available";
    }

    /**
     * @returns {boolean}
     */
    hasOngoingCall() {
      return (
        this.state === "outgoing" ||
        this.state === "incoming" ||
        this.state === "in-call" ||
        this.state === "ending"
      );
    }

    openStationPicker() {
      if (window.PPCCR?.station && typeof window.PPCCR.station.openSwitcher === "function") {
        window.PPCCR.station.openSwitcher();
        return;
      }

      window.dispatchEvent(new CustomEvent("ppccr:open-station-picker"));

      const fallback = document.querySelector("#station-switch-trigger, #user-banner");
      if (fallback instanceof HTMLElement) fallback.click();
    }

    /**
     * @param {unknown} callCandidate
     * @returns {null | {
     *  callId: string,
     *  room: string,
     *  fromId: string,
     *  fromName: string,
     *  toId: string,
     *  toName: string,
     *  status: string,
     * }}
     */
    parseCall(callCandidate) {
      if (!callCandidate || typeof callCandidate !== "object") return null;

      const call = /** @type {{
       * callId?: unknown,
       * room?: unknown,
       * fromId?: unknown,
       * fromName?: unknown,
       * toId?: unknown,
       * toName?: unknown,
       * status?: unknown,
       * }} */ (callCandidate);

      const callId = String(call.callId || "").trim();
      const room = String(call.room || "").trim();
      const fromId = normalizeStationId(call.fromId);
      const toId = normalizeStationId(call.toId);

      if (!callId || !room || !fromId || !toId) return null;

      const fromStation = getStationById(fromId);
      const toStation = getStationById(toId);
      if (!fromStation || !toStation) return null;

      return {
        callId,
        room,
        fromId,
        fromName: String(call.fromName || "").trim() || fromStation.name,
        toId,
        toName: String(call.toName || "").trim() || toStation.name,
        status: String(call.status || "").trim().toLowerCase(),
      };
    }

    /**
     * @param {unknown} snapshotValue
     * @returns {Promise<void>}
     */
    async handleOwnInboxSnapshot(snapshotValue) {
      if (!this.currentStation) return;

      const parsed = this.parseCall(snapshotValue);

      if (!parsed) {
        if (this.state === "incoming" && this.activeCall?.direction === "incoming") {
          this.closeIncomingModal();
          this.ringtone.stop();
          this.activeCall = null;
          this.state = "idle";
          this.setStatus("Llamada entrante cancelada.", "warn");
          this.setPlaceholder(
            "Teleconsulta",
            "Iniciá una llamada o esperá una entrante.",
          );
          this.syncUI();
        }
        return;
      }

      if (parsed.toId !== this.currentStation.id) return;

      if (parsed.status === "ringing") {
        await this.handleIncomingRinging(parsed);
        return;
      }

      if (!this.activeCall || this.activeCall.callId !== parsed.callId) {
        return;
      }

      if (["ended", "declined", "missed"].includes(parsed.status)) {
        await this.handleRemoteTerminalStatus(parsed.status, parsed);
      }
    }

    /**
     * @param {{
     *  callId: string,
     *  room: string,
     *  fromId: string,
     *  fromName: string,
     *  toId: string,
     *  toName: string,
     *  status: string,
     * }} call
     * @returns {Promise<void>}
     */
    async handleIncomingRinging(call) {
      if (!this.currentStation || call.toId !== this.currentStation.id) return;
      if (call.fromId === this.currentStation.id) return;

      const existing = this.activeCall;
      const incomingCall = {
        ...call,
        peerId: call.fromId,
        peerName: call.fromName,
        direction: "incoming",
        inboxStationId: this.currentStation.id,
      };

      if (
        existing &&
        existing.callId !== incomingCall.callId &&
        (this.state === "outgoing" || this.state === "in-call" || this.state === "ending")
      ) {
        await this.rejectForeignIncoming(incomingCall);
        return;
      }

      this.activeCall = incomingCall;
      this.selectedTargetId = incomingCall.peerId;
      this.state = "incoming";

      this.setStatus(`Llamada entrante de ${incomingCall.peerName}.`, "warn");
      this.setPlaceholder("Llamada entrante", `Desde ${incomingCall.peerName}.`);
      this.openIncomingModal(incomingCall.peerName);
      await this.ringtone.start();

      this.renderTargets();
      this.syncUI();
    }

    /**
     * @param {{callId: string, inboxStationId: string}} call
     * @returns {Promise<void>}
     */
    async rejectForeignIncoming(call) {
      if (!this.firebaseReady) return;

      try {
        await this.firebase.patchCall(call.inboxStationId, { status: "declined" });
      } catch (error) {
        // no-op
      }

      try {
        await this.firebase.clearCallIfMatch(call.inboxStationId, call.callId);
      } catch (error) {
        // no-op
      }
    }

    /**
     * @returns {Promise<void>}
     */
    async startOutgoingCall() {
      if (!this.currentStation) {
        this.setStatus("Seleccioná una estación antes de llamar.", "warn");
        return;
      }

      if (!this.hasFirebaseConfig || !this.firebaseReady) {
        this.setStatus("Teleconsulta requiere Firebase activo para llamar.", "warn");
        return;
      }

      const target = getStationById(this.selectedTargetId);
      if (!target) {
        this.setStatus("Seleccioná una estación destino.", "warn");
        return;
      }

      if (target.id === this.currentStation.id) {
        this.setStatus("No podés llamarte a tu propia estación.", "warn");
        return;
      }

      const targetStatus = this.getTargetStatus(target.id);
      if (targetStatus.code !== "available") {
        this.setStatus("Estación no disponible para llamada.", "warn");
        return;
      }

      const op = this.beginOp();
      await this.hangup("", {
        notifyPeer: true,
        silent: true,
        op,
      });

      if (!this.isOpCurrent(op)) return;

      const callId = buildCallId();
      const room = buildRoomName({
        fromId: this.currentStation.id,
        toId: target.id,
        callId,
      });

      const callPayload = {
        callId,
        room,
        fromId: this.currentStation.id,
        fromName: this.currentStation.name,
        toId: target.id,
        toName: target.name,
        status: "ringing",
        createdAt: this.firebase.getServerTimestamp(),
        updatedAt: this.firebase.getServerTimestamp(),
      };

      this.activeCall = {
        ...callPayload,
        peerId: target.id,
        peerName: target.name,
        direction: "outgoing",
        inboxStationId: target.id,
      };

      this.state = "outgoing";
      this.setStatus(`Llamando a ${target.name}...`, "info");
      this.setPlaceholder("Llamada saliente", `Llamando a ${target.name}...`);
      this.closeIncomingModal();
      this.ringtone.stop();
      this.syncUI();

      try {
        await this.firebase.setCall(target.id, callPayload);
      } catch (error) {
        if (this.isOpCurrent(op)) {
          this.activeCall = null;
          this.state = "idle";
          this.setStatus("No se pudo iniciar la llamada.", "error");
          this.setPlaceholder(
            "Teleconsulta",
            "Iniciá una llamada o esperá una entrante.",
          );
          this.syncUI();
        }
        return;
      }

      if (!this.isOpCurrent(op)) {
        try {
          await this.firebase.patchCall(target.id, { status: "ended" });
          await this.firebase.clearCallIfMatch(target.id, callId);
        } catch (error) {
          // no-op
        }
        return;
      }

      this.bindOutgoingWatch(target.id, callId);
      this.armOutgoingTimeout(callId, target.id, target.name);
      this.syncUI();
    }

    /**
     * @param {string} targetId
     * @param {string} callId
     */
    bindOutgoingWatch(targetId, callId) {
      this.clearOutgoingWatch();

      this.unsubscribeOutgoing = this.firebase.listenInbox(
        targetId,
        (snapshotValue) => {
          this.handleOutgoingSnapshot(snapshotValue, callId).catch((error) => {
            console.error("[teleconsulta] Outgoing watcher error", error);
          });
        },
        (error) => {
          console.error("[teleconsulta] Outgoing listener error", error);
        },
      );
    }

    /**
     * @param {string} callId
     * @param {string} targetId
     * @param {string} targetName
     */
    armOutgoingTimeout(callId, targetId, targetName) {
      this.clearOutgoingTimeout();

      this.outgoingTimeoutId = window.setTimeout(async () => {
        if (!this.activeCall || this.activeCall.callId !== callId) return;
        if (this.state !== "outgoing") return;

        const op = this.beginOp();

        try {
          await this.firebase.patchCall(targetId, { status: "missed" });
        } catch (error) {
          // no-op
        }

        try {
          await this.firebase.clearCallIfMatch(targetId, callId);
        } catch (error) {
          // no-op
        }

        await this.jitsi.disposeMeeting();

        if (!this.isOpCurrent(op)) return;

        this.clearOutgoingWatch();
        this.activeCall = null;
        this.state = "idle";
        this.setStatus(`Sin respuesta de ${targetName}.`, "warn");
        this.setPlaceholder(
          "Teleconsulta",
          "Iniciá una llamada o esperá una entrante.",
        );
        this.syncUI();
      }, CALL_TIMEOUT_MS);
    }

    /**
     * @param {unknown} snapshotValue
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async handleOutgoingSnapshot(snapshotValue, callId) {
      const activeCall = this.activeCall;

      if (!activeCall || activeCall.callId !== callId || activeCall.direction !== "outgoing") {
        return;
      }

      const parsed = this.parseCall(snapshotValue);
      if (!parsed || parsed.callId !== callId) {
        if (this.state === "outgoing") {
          await this.handleRemoteTerminalStatus("ended", {
            ...activeCall,
            fromName: activeCall.fromName || "",
            toName: activeCall.toName || "",
          });
        }
        return;
      }

      if (parsed.status === "ringing") {
        this.setStatus(`Llamando a ${activeCall.peerName}...`, "info");
        return;
      }

      if (parsed.status === "accepted") {
        this.clearOutgoingTimeout();

        if (this.state !== "outgoing") return;

        const op = this.opSeq;
        this.setStatus(`Conectando con ${activeCall.peerName}...`, "info");
        await this.mountActiveMeeting(op);
        if (!this.isOpCurrent(op)) return;
        if (!this.activeCall || this.activeCall.callId !== callId) return;

        this.state = "in-call";
        this.refs.fsLabel.textContent = `En llamada con ${activeCall.peerName}`;
        this.setStatus(`En llamada con ${activeCall.peerName}.`, "ok");
        this.syncUI();
        return;
      }

      if (["declined", "missed", "ended"].includes(parsed.status)) {
        await this.handleRemoteTerminalStatus(parsed.status, {
          ...activeCall,
          fromName: activeCall.fromName || "",
          toName: activeCall.toName || "",
        });
      }
    }

    /**
     * @returns {Promise<void>}
     */
    async acceptIncomingCall() {
      if (!this.currentStation || !this.activeCall) return;
      if (this.state !== "incoming") return;
      if (!this.firebaseReady) return;

      const call = this.activeCall;
      const op = this.beginOp();

      this.ringtone.stop();
      this.closeIncomingModal();
      this.setStatus(`Conectando con ${call.peerName}...`, "info");

      try {
        await this.firebase.patchCall(this.currentStation.id, { status: "accepted" });
      } catch (error) {
        if (this.isOpCurrent(op)) {
          this.setStatus("No se pudo aceptar la llamada.", "error");
        }
        return;
      }

      if (!this.isOpCurrent(op) || !this.activeCall || this.activeCall.callId !== call.callId) {
        return;
      }

      await this.mountActiveMeeting(op);
      if (!this.isOpCurrent(op)) return;
      if (!this.activeCall || this.activeCall.callId !== call.callId) return;

      this.state = "in-call";
      this.refs.fsLabel.textContent = `En llamada con ${call.peerName}`;
      this.setStatus(`En llamada con ${call.peerName}.`, "ok");
      this.syncUI();
    }

    /**
     * @returns {Promise<void>}
     */
    async declineIncomingCall() {
      if (!this.currentStation || !this.activeCall) return;
      if (this.state !== "incoming") return;
      if (!this.firebaseReady) return;

      const call = this.activeCall;
      const op = this.beginOp();

      this.ringtone.stop();
      this.closeIncomingModal();

      try {
        await this.firebase.patchCall(this.currentStation.id, { status: "declined" });
      } catch (error) {
        // no-op
      }

      try {
        await this.firebase.clearCallIfMatch(this.currentStation.id, call.callId);
      } catch (error) {
        // no-op
      }

      if (!this.isOpCurrent(op)) return;

      this.activeCall = null;
      this.state = "idle";
      this.setStatus(`Llamada de ${call.peerName} rechazada.`, "warn");
      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );
      this.syncUI();
    }

    /**
     * @param {number} op
     * @returns {Promise<void>}
     */
    async mountActiveMeeting(op) {
      const call = this.activeCall;
      const station = this.currentStation;

      if (!call || !station) return;

      const parentNode = this.fullscreenOpen ? this.refs.fullscreenStage : this.refs.stage;
      this.jitsi.moveHost(parentNode);

      await this.jitsi.mountMeeting({
        roomName: call.room,
        displayName: station.name,
        parentNode,
        onReadyToClose: () => {
          this.hangup("Llamada finalizada.", {
            notifyPeer: true,
          }).catch(() => {
            // no-op
          });
        },
        onAudioMuteStatus: (muted) => {
          this.syncMuteButtons({
            audioMuted: muted,
            videoMuted: this.refs.toggleCam.getAttribute("aria-pressed") !== "true",
          });
        },
        onVideoMuteStatus: (muted) => {
          this.syncMuteButtons({
            audioMuted: this.refs.toggleMic.getAttribute("aria-pressed") !== "true",
            videoMuted: muted,
          });
        },
        onParticipantJoined: () => {
          if (this.state === "outgoing") {
            this.setStatus("Conectado. Estableciendo video...", "ok");
          }
        },
      });

      if (!this.isOpCurrent(op)) {
        await this.jitsi.disposeMeeting();
      }
    }

    /**
     * @param {string} reason
     * @param {{notifyPeer?: boolean, silent?: boolean, op?: number}} [options]
     * @returns {Promise<void>}
     */
    async hangup(reason = "Llamada finalizada.", options = {}) {
      const {
        notifyPeer = true,
        silent = false,
        op = this.beginOp(),
      } = options;

      const call = this.activeCall;

      this.state = "ending";
      this.syncUI();

      this.clearOutgoingWatch();
      this.ringtone.stop();
      this.closeIncomingModal();

      if (call && notifyPeer && this.firebaseReady) {
        try {
          await this.firebase.patchCall(call.inboxStationId, { status: "ended" });
        } catch (error) {
          // no-op
        }

        try {
          await this.firebase.clearCallIfMatch(call.inboxStationId, call.callId);
        } catch (error) {
          // no-op
        }
      }

      await this.jitsi.disposeMeeting();

      if (!this.isOpCurrent(op)) return;

      this.activeCall = null;
      this.state = "idle";
      this.refs.fsLabel.textContent = "En llamada";

      if (this.fullscreenOpen) {
        this.closeFullscreen({ restoreFocus: false });
      }

      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );

      if (!silent && reason) {
        this.setStatus(reason, "info");
      }

      this.syncMuteButtons({ audioMuted: false, videoMuted: true });
      this.syncUI();
    }

    /**
     * @param {string} status
     * @param {{peerName?: string, callId?: string, inboxStationId?: string}} call
     * @returns {Promise<void>}
     */
    async handleRemoteTerminalStatus(status, call) {
      const op = this.beginOp();

      this.clearOutgoingWatch();
      this.ringtone.stop();
      this.closeIncomingModal();
      await this.jitsi.disposeMeeting();

      if (call && call.inboxStationId && call.callId && this.firebaseReady) {
        try {
          await this.firebase.clearCallIfMatch(call.inboxStationId, call.callId);
        } catch (error) {
          // no-op
        }
      }

      if (!this.isOpCurrent(op)) return;

      this.activeCall = null;
      this.state = "idle";
      this.refs.fsLabel.textContent = "En llamada";

      if (this.fullscreenOpen) {
        this.closeFullscreen({ restoreFocus: false });
      }

      let message = "Llamada finalizada.";
      if (status === "declined") {
        message = `Llamada rechazada por ${call?.peerName || "la estación destino"}.`;
      } else if (status === "missed") {
        message = "Llamada perdida por timeout.";
      } else if (status === "ended") {
        message = "La otra estación finalizó la llamada.";
      }

      this.setStatus(message, status === "declined" ? "warn" : "info");
      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );
      this.syncMuteButtons({ audioMuted: false, videoMuted: true });
      this.syncUI();
    }

    /**
     * @param {string} fromName
     */
    openIncomingModal(fromName) {
      this.refs.incomingFrom.textContent = fromName;
      this.refs.incomingModal.classList.add("is-open");
      this.refs.incomingModal.setAttribute("aria-hidden", "false");
      this.refs.incomingAccept.focus();
    }

    closeIncomingModal() {
      this.refs.incomingModal.classList.remove("is-open");
      this.refs.incomingModal.setAttribute("aria-hidden", "true");
    }

    openFullscreen() {
      if (!this.jitsi.hasMeeting()) return;
      if (this.fullscreenOpen) return;

      this.fullscreenOpen = true;
      this.refs.fullscreenModal.classList.add("is-open");
      this.refs.fullscreenModal.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("telefs-open");
      document.body.classList.add("telefs-open");

      this.jitsi.moveHost(this.refs.fullscreenStage);
    }

    /**
     * @param {{restoreFocus?: boolean}} [options]
     */
    closeFullscreen(options = {}) {
      const { restoreFocus = true } = options;
      if (!this.fullscreenOpen) return;

      this.fullscreenOpen = false;
      this.refs.fullscreenModal.classList.remove("is-open");
      this.refs.fullscreenModal.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("telefs-open");
      document.body.classList.remove("telefs-open");

      if (this.jitsi.hasMeeting()) {
        this.jitsi.moveHost(this.refs.stage);
      }

      if (restoreFocus) {
        this.refs.fullscreenBtn.focus();
      }
    }

    /**
     * @returns {Promise<void>}
     */
    async destroy() {
      if (this.destroyed) return;
      this.destroyed = true;

      this.clearOutgoingWatch();
      this.clearInboxListener();
      this.clearGlobalRealtime();

      this.ringtone.stop();
      this.closeIncomingModal();
      this.closeFullscreen({ restoreFocus: false });

      await this.jitsi.disposeMeeting();

      if (this.firebaseReady) {
        await this.firebase.clearPresence();
      }

      this.cleanupFns.forEach((dispose) => {
        try {
          dispose();
        } catch (error) {
          // no-op
        }
      });

      this.cleanupFns = [];
    }
  }

  /**
   * Inicializa teleconsulta embebida si el widget está presente.
   */
  function initTeleconsultaEmbed() {
    const refs = {
      widget: document.getElementById("teleconsultaWidget"),
      stationPill: document.getElementById("telewStationPill"),
      stationName: document.getElementById("telewStationName"),
      targets: document.getElementById("telewTargets"),
      status: document.getElementById("telewStatus"),
      callBtn: document.getElementById("telewCallBtn"),
      hangupBtn: document.getElementById("telewHangupBtn"),
      stage: document.getElementById("telewStage"),
      placeholder: document.getElementById("telewStagePlaceholder"),
      controls: document.getElementById("telewControls"),
      toggleMic: document.getElementById("telewToggleMic"),
      toggleCam: document.getElementById("telewToggleCam"),
      fullscreenBtn: document.getElementById("telewFullscreen"),
      incomingModal: document.getElementById("telecallIncoming"),
      incomingFrom: document.getElementById("telecallIncomingFrom"),
      incomingAccept: document.getElementById("telecallAccept"),
      incomingDecline: document.getElementById("telecallDecline"),
      fullscreenModal: document.getElementById("telecallFullscreen"),
      fullscreenStage: document.getElementById("telefsStage"),
      fsLabel: document.getElementById("telefsLabel"),
      fsMinimize: document.getElementById("telefsMinimize"),
      fsHangup: document.getElementById("telefsHangup"),
    };

    const required = [
      refs.widget,
      refs.stationPill,
      refs.stationName,
      refs.targets,
      refs.status,
      refs.callBtn,
      refs.hangupBtn,
      refs.stage,
      refs.placeholder,
      refs.controls,
      refs.toggleMic,
      refs.toggleCam,
      refs.fullscreenBtn,
      refs.incomingModal,
      refs.incomingFrom,
      refs.incomingAccept,
      refs.incomingDecline,
      refs.fullscreenModal,
      refs.fullscreenStage,
      refs.fsLabel,
      refs.fsMinimize,
      refs.fsHangup,
    ];

    if (required.some((element) => !(element instanceof HTMLElement))) {
      return;
    }

    const controller = new TeleconsultaController(
      /** @type {any} */ (refs),
    );

    controller.init().catch((error) => {
      console.error("[teleconsulta] Error de inicialización", error);
      refs.status.textContent = "No se pudo iniciar Teleconsulta.";
      refs.status.dataset.tone = "error";
      refs.callBtn.disabled = true;
    });
  }

  document.addEventListener("DOMContentLoaded", initTeleconsultaEmbed);
})();
