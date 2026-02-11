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

  function getFirebaseConfigNow() {
    return (
      window.PPCCR_FIREBASE_CONFIG ||
      window.firebaseConfig ||
      window.FIREBASE_CONFIG ||
      null
    );
  }

  /**
   * @param {number} [ms]
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async function waitForFirebaseConfig(ms = 1500) {
    const timeout = Math.max(0, Number(ms) || 0);
    const start = Date.now();

    while (Date.now() - start <= timeout) {
      const cfg = getFirebaseConfigNow();
      if (cfg && typeof cfg === "object") {
        return cfg;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    return null;
  }

  const STORAGE_KEYS = Object.freeze({
    station: "ppccr_station",
    stationId: "ppccr_station_id",
    stationName: "ppccr_station_name",
    stationLegacy: "ppccr_auth_user",
    chatAuthorPrefix: "ppccr_teleconsulta_chat_author_",
  });

  const DB_PATHS = Object.freeze({
    presence: "ppccr/teleconsulta/presence",
    calls: "ppccr/teleconsulta/calls",
    chatMessages: "ppccr/teleconsulta/chat/global/messages",
  });

  const HOST_STATION_IDS = new Set(["admin"]);

  const CALL_TIMEOUT_MS = 35_000;
  const CALL_CLEANUP_DELAY_MS = 6_000;
  const CHAT_MAX_MESSAGES = 150;
  const CHAT_SEND_DEBOUNCE_MS = 1_000;
  const BUSY_CALL_STATUSES = new Set(["accepted", "in-call", "ringing"]);
  const PENDING_CALL_STATUSES = new Set(["ringing", "queued"]);

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
   * @param {string} key
   * @returns {string}
   */
  function safeLocalGet(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function safeLocalSet(key, value) {
    try {
      localStorage.setItem(key, value);
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
   * Genera un sufijo hexadecimal seguro para ids.
   * Prioriza `crypto.getRandomValues` y usa fallback con Math.random.
   * @param {number} [bytes]
   * @returns {string}
   */
  function randomHex(bytes = 10) {
    const size = Math.max(1, Math.floor(bytes));
    const cryptoApi = window.crypto;

    if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
      const values = new Uint8Array(size);
      cryptoApi.getRandomValues(values);
      return Array.from(values)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    }

    let output = "";
    for (let index = 0; index < size; index += 1) {
      const value = Math.floor(Math.random() * 256);
      output += value.toString(16).padStart(2, "0");
    }
    return output;
  }

  /**
   * @returns {string}
   */
  function buildCallId() {
    return `${Date.now()}_${randomHex(10)}`;
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

  /**
   * @param {string} stationId
   * @param {string} callId
   * @returns {string}
   */
  function getCallPath(stationId, callId) {
    return `${getCallsPath(stationId)}/${callId}`;
  }

  /**
   * @returns {string}
   */
  function getChatMessagesPath() {
    return DB_PATHS.chatMessages;
  }

  /**
   * @param {string} stationId
   * @returns {string}
   */
  function getChatAuthorStorageKey(stationId) {
    return `${STORAGE_KEYS.chatAuthorPrefix}${normalizeStationId(stationId)}`;
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
      if (this.initPromise) return this.initPromise;

      this.initPromise = (async () => {
        if (!window.firebase || typeof window.firebase.initializeApp !== "function") {
          console.warn(
            "[teleconsulta] Firebase SDK no disponible (CSP). Revisá firebase.json: script-src debe permitir https://www.gstatic.com",
          );
          throw new Error(
            "Firebase SDK no disponible (CSP). Revisá firebase.json: script-src debe permitir https://www.gstatic.com",
          );
        }

        const cfg =
          this.config && typeof this.config === "object"
            ? this.config
            : await waitForFirebaseConfig();

        if (!cfg) {
          throw new Error("Falta window.PPCCR_FIREBASE_CONFIG (ver firebase-config.js / CSP).");
        }

        this.config = cfg;
        const apps = Array.isArray(window.firebase.apps) ? window.firebase.apps : [];
        this.app = apps.length > 0 ? apps[0] : window.firebase.initializeApp(cfg);
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
            busy: false,
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
        busy: false,
        name: nextStation.name,
        ts: this.getServerTimestamp(),
      });

      const disconnectOp = this.presenceRef.onDisconnect();
      await disconnectOp.set({
        online: false,
        busy: false,
        name: nextStation.name,
        ts: this.getServerTimestamp(),
      });

      this.presenceOnDisconnect = disconnectOp;
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
          busy: false,
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
     * @param {string} stationId
     * @param {Record<string, unknown>} patch
     * @returns {Promise<void>}
     */
    async patchPresence(stationId, patch) {
      await this.init();
      const normalizedId = normalizeStationId(stationId);
      if (!normalizedId) return;
      await this.ref(getPresencePath(normalizedId)).update({
        ...patch,
        ts: this.getServerTimestamp(),
      });
    }

    /**
     * @param {string} path
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listen(path, handler, onError) {
      const refValue = this.ref(path);
      const handleSnapshot = (snapshot) => {
        handler(snapshot.val());
      };

      const onListenError = (error) => {
        const message = String(error?.message || "");
        if (message.toLowerCase().includes("websocket")) {
          console.warn(
            "[teleconsulta] RTDB websocket bloqueado. Revisá CSP connect-src con wss: en firebase.json.",
            error,
          );
        }
        if (typeof onError === "function") {
          onError(error);
          return;
        }
        console.error("[teleconsulta] Listener error", error);
      };

      refValue.on("value", handleSnapshot, onListenError);
      return () => {
        refValue.off("value", handleSnapshot);
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
     * @param {string} stationId
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenStationCalls(stationId, handler, onError) {
      return this.listen(getCallsPath(stationId), handler, onError);
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenCall(stationId, callId, handler, onError) {
      const normalizedCallId = String(callId || "").trim();
      if (!normalizedCallId) return () => {};
      return this.listen(getCallPath(stationId, normalizedCallId), handler, onError);
    }

    /**
     * @param {string} toStationId
     * @param {string} callId
     * @param {Record<string, unknown>} payload
     * @returns {Promise<void>}
     */
    async createCall(toStationId, callId, payload) {
      await this.init();
      const normalizedCallId = String(callId || "").trim();
      if (!normalizedCallId) {
        throw new Error("callId requerido");
      }
      await this.ref(getCallPath(toStationId, normalizedCallId)).set({
        ...payload,
        callId: normalizedCallId,
        updatedAt: this.getServerTimestamp(),
      });
    }

    /**
     * @param {string} toStationId
     * @param {string} callId
     * @param {Record<string, unknown>} patch
     * @returns {Promise<void>}
     */
    async patchCall(toStationId, callId, patch) {
      await this.init();
      const normalizedCallId = String(callId || "").trim();
      if (!normalizedCallId) return;

      await this.ref(getCallPath(toStationId, normalizedCallId)).update({
        ...patch,
        updatedAt: this.getServerTimestamp(),
      });
    }

    /**
     * @param {string} toStationId
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async deleteCall(toStationId, callId) {
      await this.init();
      const normalizedCallId = String(callId || "").trim();
      if (!normalizedCallId) return;
      await this.ref(getCallPath(toStationId, normalizedCallId)).remove();
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async clearCallIfMatch(stationId, callId) {
      await this.init();
      const normalizedCallId = String(callId || "").trim();
      if (!normalizedCallId) return;
      const refValue = this.ref(getCallPath(stationId, normalizedCallId));
      const snapshot = await refValue.once("value");
      const value = snapshot.val();

      if (value && String(value.callId || "") === normalizedCallId) {
        await refValue.remove();
      }
    }

    /**
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {() => void}
     */
    listenChatMessages(handler, onError) {
      return this.listen(getChatMessagesPath(), handler, onError);
    }

    /**
     * @param {Record<string, unknown>} payload
     * @returns {Promise<string>}
     */
    async createChatMessage(payload) {
      await this.init();
      const messageRef = this.ref(getChatMessagesPath()).push();
      await messageRef.set({
        ...payload,
        ts: this.getServerTimestamp(),
      });
      return messageRef.key || "";
    }

    /**
     * @param {string} messageId
     * @param {Record<string, unknown>} patch
     * @returns {Promise<void>}
     */
    async patchChatMessage(messageId, patch) {
      await this.init();
      const normalizedId = String(messageId || "").trim();
      if (!normalizedId) return;
      await this.ref(`${getChatMessagesPath()}/${normalizedId}`).update({
        ...patch,
      });
    }

    /**
     * @param {string} stationId
     * @param {(value: any) => void} handler
     * @param {(error: Error) => void} [onError]
     * @returns {Promise<void>}
     */
    listenInbox(stationId, handler, onError) {
      return this.listenStationCalls(stationId, handler, onError);
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @param {Record<string, unknown>} payload
     * @returns {Promise<void>}
     */
    async setCall(stationId, callId, payload) {
      return this.createCall(stationId, callId, payload);
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async clearCall(stationId, callId) {
      return this.deleteCall(stationId, callId);
    }
  }

  class ToneService {
    constructor() {
      this.audioContext = null;
      this.intervalId = 0;
      this.running = false;
      this.currentMode = "";
    }

    /**
     * @returns {Promise<void>}
     */
    async unlock() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }

    /**
     * @returns {Promise<void>}
     */
    async start() {
      await this.startIncoming();
    }

    /**
     * @param {{frequency: number, duration: number, gain: number}} options
     * @returns {void}
     */
    playTone(options) {
      if (!this.audioContext || this.audioContext.state === "closed") return;
      const now = this.audioContext.currentTime;
      const frequency = Math.max(120, Number(options.frequency) || 440);
      const duration = Math.max(0.05, Number(options.duration) || 0.2);
      const gainValue = Math.max(0.0001, Number(options.gain) || 0.05);

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    stop() {
      this.running = false;
      this.currentMode = "";
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = 0;
      }
    }

    /**
     * @returns {Promise<void>}
     */
    async startIncoming() {
      if (this.running && this.currentMode === "incoming") return;
      this.stop();
      try {
        await this.unlock();
      } catch (error) {
        return;
      }
      this.running = true;
      this.currentMode = "incoming";
      const pulse = () => {
        this.playTone({ frequency: 880, duration: 0.22, gain: 0.08 });
        window.setTimeout(() => {
          this.playTone({ frequency: 720, duration: 0.2, gain: 0.065 });
        }, 180);
      };
      pulse();
      this.intervalId = window.setInterval(pulse, 1400);
    }

    /**
     * @returns {Promise<void>}
     */
    async startOutgoing() {
      if (this.running && this.currentMode === "outgoing") return;
      this.stop();
      try {
        await this.unlock();
      } catch (error) {
        return;
      }
      this.running = true;
      this.currentMode = "outgoing";
      const pulse = () => {
        this.playTone({ frequency: 440, duration: 0.24, gain: 0.055 });
      };
      pulse();
      this.intervalId = window.setInterval(pulse, 1650);
    }

    /**
     * @returns {Promise<void>}
     */
    async notifyOnce() {
      try {
        await this.unlock();
      } catch (error) {
        return;
      }
      this.playTone({ frequency: 620, duration: 0.18, gain: 0.06 });
    }

    async dispose() {
      this.stop();
      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch (error) {
          // no-op
        }
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
          console.warn("[teleconsulta] Jitsi cargó pero no expuso JitsiMeetExternalAPI.");
          finish(reject, new Error("Jitsi cargó sin exponer JitsiMeetExternalAPI"));
        };

        const onError = () => {
          console.warn(
            "[teleconsulta] No se pudo cargar Jitsi IFrame API. Revisá CSP (script-src/frame-src para https://meet.jit.si).",
          );
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
     *   onParticipantJoined?: () => void,
     *   onConferenceJoined?: () => void
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
        onConferenceJoined,
      } = options;

      if (!roomName) throw new Error("Room inválida");
      if (!(parentNode instanceof HTMLElement)) {
        throw new Error("Parent node inválido para Jitsi");
      }

      await this.loadJitsiScriptOnce();
      this.moveHost(parentNode);
      await this.disposeMeeting();

      const jitsiOptions = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: this.hostNode,
        configOverwrite: {
          prejoinConfig: {
            enabled: false,
          },
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          requireDisplayName: false,
          enableWelcomePage: false,
          disableInviteFunctions: true,
          disableProfile: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone", "camera", "hangup", "tileview", "fullscreen"],
          SHOW_JITSI_WATERMARK: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
        userInfo: {
          displayName,
        },
      };

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, jitsiOptions);
      if (typeof api.getIFrame === "function") {
        const iframe = api.getIFrame();
        if (iframe instanceof HTMLIFrameElement) {
          iframe.setAttribute(
            "allow",
            "camera; microphone; autoplay; fullscreen; display-capture",
          );
          iframe.setAttribute("allowfullscreen", "true");
        }
      }

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

      this.bind(api, "videoConferenceJoined", () => {
        if (typeof onConferenceJoined === "function") onConferenceJoined();
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
     *  chatMessages: HTMLElement,
     *  chatAuthorInput: HTMLInputElement,
     *  chatTextInput: HTMLInputElement,
     *  chatSendBtn: HTMLButtonElement,
     *  chatRequestBtn: HTMLButtonElement,
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

      this.firebase = new FirebaseTeleconsultaService(getFirebaseConfigNow());
      this.jitsi = JitsiSingleton.getInstance();
      this.incomingTone = new ToneService();
      this.outgoingTone = new ToneService();

      this.state = "idle";
      this.activeCall = null;
      this.currentStation = null;
      this.selectedTargetId = null;
      this.callInboxCache = [];
      this.waitingIncomingCount = 0;
      this.statusMessage = "Listo.";
      this.statusTone = "info";
      this.opSeq = 0;
      this.firebaseReady = false;
      this.fullscreenOpen = false;
      this.destroyed = false;
      this.stationRollbackInProgress = false;

      this.presenceById = {};
      this.ownPresenceBusy = null;
      this.presencePatchInFlight = false;
      this.lastQueuedNotifyAt = 0;
      this.queuePublishedCallIds = new Set();
      this.hostReadyHintTimer = 0;
      this.chatMessages = [];
      this.lastChatSendAt = 0;
      this.chatAuthorName = "";
      this.chatMessageMap = new Map();

      this.outgoingTimeoutId = 0;
      this.unsubscribePresence = null;
      this.unsubscribeInbox = null;
      this.unsubscribeOutgoing = null;
      this.unsubscribeChat = null;
      this.cleanupFns = [];
    }

    /**
     * @returns {boolean}
     */
    get hasFirebaseConfig() {
      return Boolean(getFirebaseConfigNow());
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

      this.on(this.refs.chatSendBtn, "click", () => {
        this.sendChatTextMessage().catch((error) => {
          console.error("[teleconsulta] Error enviando mensaje de chat", error);
        });
      });

      this.on(this.refs.chatRequestBtn, "click", () => {
        this.sendChatCallRequest().catch((error) => {
          console.error("[teleconsulta] Error enviando solicitud de llamada", error);
        });
      });

      this.on(this.refs.chatTextInput, "keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.sendChatTextMessage().catch((error) => {
          console.error("[teleconsulta] Error enviando mensaje por Enter", error);
        });
      });

      this.on(this.refs.chatAuthorInput, "change", () => {
        this.persistChatAuthorInput();
      });

      this.on(this.refs.chatAuthorInput, "blur", () => {
        this.persistChatAuthorInput();
      });

      this.on(this.refs.chatMessages, "click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const actionBtn = target.closest("[data-chat-action]");
        if (!(actionBtn instanceof HTMLButtonElement)) return;
        this.handleChatAction(actionBtn).catch((error) => {
          console.error("[teleconsulta] Error ejecutando acción de chat", error);
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

      const unlockAudio = () => {
        this.incomingTone.unlock().catch(() => {
          // no-op
        });
        this.outgoingTone.unlock().catch(() => {
          // no-op
        });
      };
      this.on(window, "pointerdown", unlockAudio, { once: true, passive: true });
      this.on(window, "keydown", unlockAudio, { once: true });

      this.syncMuteButtons({ audioMuted: false, videoMuted: true });
      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );
      this.renderChatMessages();

      await this.handleStationChange(getActiveStation(), {
        force: true,
        skipConfirm: true,
      });

      const cfg = await waitForFirebaseConfig();
      if (!cfg || !this.hasFirebaseConfig) {
        console.error(
          "[teleconsulta] Error de Config: window.PPCCR_FIREBASE_CONFIG no esta definido o es invalido.",
        );
        this.setStatus("Error de Config: Firebase no esta configurado.", "error");
        this.setPlaceholder(
          "Error de Config",
          "Falta cargar firebase-config.js antes de teleconsulta-embed.js.",
        );
        this.renderTargets();
        this.syncUI();
        return;
      }

      try {
        await this.firebase.init();
        this.firebaseReady = true;
      } catch (error) {
        this.firebaseReady = false;
        console.error("[teleconsulta] Error de Config durante init", error);
        const message = String(error?.message || "");
        if (message.includes("Firebase SDK no disponible (CSP)")) {
          this.setStatus(
            "Firebase SDK no disponible (CSP). Revisá firebase.json: script-src debe permitir https://www.gstatic.com",
            "error",
          );
          this.setPlaceholder(
            "Error de Config",
            "CSP bloquea Firebase SDK. Revisá script-src/connect-src en firebase.json.",
          );
        } else {
          this.setStatus("Error de Config: no se pudo inicializar Firebase.", "error");
          this.setPlaceholder(
            "Error de Config",
            "Revisa credenciales de Firebase y carga de SDK compat.",
          );
        }
        this.renderTargets();
        this.syncUI();
        return;
      }

      this.subscribeGlobalRealtime();
      this.subscribeChatRealtime();

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
        this.ownPresenceBusy = null;
        this.refs.stationName.textContent = "Sin estación";
        this.setChatAuthorName("", { persist: false });

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
      this.loadChatAuthorForCurrentStation();
      this.queuePublishedCallIds.clear();
      this.callInboxCache = [];

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
                  ? /** @type {{online?: unknown, busy?: unknown, name?: unknown}} */ (value)
                  : {};

              nextPresence[normalizedId] = {
                online: Boolean(payload.online),
                busy: Boolean(payload.busy),
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
    }

    subscribeChatRealtime() {
      this.clearChatRealtime();
      this.unsubscribeChat = this.firebase.listenChatMessages(
        (snapshotValue) => {
          this.handleChatSnapshot(snapshotValue);
        },
        (error) => {
          console.error("[teleconsulta] Chat listener error", error);
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
      this.ownPresenceBusy = false;

      this.unsubscribeInbox = this.firebase.listenStationCalls(
        station.id,
        (snapshotValue) => {
          this.handleOwnCallsSnapshot(snapshotValue).catch((error) => {
            console.error("[teleconsulta] Calls handler error", error);
          });
        },
        (error) => {
          console.error("[teleconsulta] Calls listener error", error);
        },
      );
    }

    clearGlobalRealtime() {
      if (this.unsubscribePresence) {
        this.unsubscribePresence();
        this.unsubscribePresence = null;
      }
    }

    clearChatRealtime() {
      if (this.unsubscribeChat) {
        this.unsubscribeChat();
        this.unsubscribeChat = null;
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
      this.clearHostHintTimer();
      if (this.unsubscribeOutgoing) {
        this.unsubscribeOutgoing();
        this.unsubscribeOutgoing = null;
      }
    }

    clearHostHintTimer() {
      if (this.hostReadyHintTimer) {
        window.clearTimeout(this.hostReadyHintTimer);
        this.hostReadyHintTimer = 0;
      }
    }

    /**
     * @param {string} targetName
     */
    armHostHintTimer(targetName) {
      this.clearHostHintTimer();
      this.hostReadyHintTimer = window.setTimeout(() => {
        if (this.state !== "outgoing") return;
        this.setStatus(
          `Esperando a ${targetName}. Esta instancia de Jitsi puede requerir que el Administrador inicie sesión una vez para crear salas.`,
          "warn",
        );
      }, 9000);
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     */
    deferCallCleanup(stationId, callId) {
      const targetStationId = normalizeStationId(stationId);
      const normalizedCallId = String(callId || "").trim();
      if (!targetStationId || !normalizedCallId || !this.firebaseReady) return;

      window.setTimeout(() => {
        this.firebase.clearCallIfMatch(targetStationId, normalizedCallId).catch(() => {
          // no-op
        });
      }, CALL_CLEANUP_DELAY_MS);
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

      if (presence && presence.busy) {
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
      this.statusMessage = String(message || "");
      this.statusTone = tone;
      this.renderStatus();
    }

    renderStatus() {
      const baseMessage = this.statusMessage || "Listo.";
      if (!this.waitingIncomingCount || !this.hasOngoingCall()) {
        this.refs.status.textContent = baseMessage;
      } else {
        const suffix =
          this.waitingIncomingCount === 1
            ? "Tienes 1 llamada en espera."
            : `Tienes ${this.waitingIncomingCount} llamadas en espera.`;
        this.refs.status.textContent = `${baseMessage} ${suffix}`.trim();
      }
      this.refs.status.dataset.tone = this.statusTone;
    }

    loadChatAuthorForCurrentStation() {
      if (!this.currentStation) {
        this.setChatAuthorName("", { persist: false });
        return;
      }
      const storageKey = getChatAuthorStorageKey(this.currentStation.id);
      const saved = safeLocalGet(storageKey).trim();
      this.setChatAuthorName(saved || this.currentStation.name, { persist: false });
    }

    /**
     * @param {string} nextName
     * @param {{persist?: boolean}} [options]
     */
    setChatAuthorName(nextName, options = {}) {
      const { persist = true } = options;
      const normalized = String(nextName || "").trim().slice(0, 40);
      this.chatAuthorName = normalized;
      this.refs.chatAuthorInput.value = normalized;
      if (persist && this.currentStation) {
        safeLocalSet(getChatAuthorStorageKey(this.currentStation.id), normalized);
      }
    }

    persistChatAuthorInput() {
      this.setChatAuthorName(this.refs.chatAuthorInput.value, { persist: true });
    }

    /**
     * @returns {string}
     */
    getValidChatAuthorName() {
      const currentValue = String(this.refs.chatAuthorInput.value || "").trim().slice(0, 40);
      if (!currentValue) return "";
      if (currentValue !== this.chatAuthorName) {
        this.setChatAuthorName(currentValue, { persist: true });
      }
      return currentValue;
    }

    /**
     * @param {unknown} snapshotValue
     */
    handleChatSnapshot(snapshotValue) {
      this.chatMessageMap.clear();
      const parsed = [];

      if (snapshotValue && typeof snapshotValue === "object") {
        Object.entries(snapshotValue).forEach(([messageId, value]) => {
          if (!value || typeof value !== "object") return;
          const payload = /** @type {any} */ (value);
          const type = String(payload.type || "").trim().toLowerCase();
          if (!["text", "call_request", "call_queue", "system"].includes(type)) return;

          const ts = Number(payload.ts || 0);
          const message = {
            messageId: String(messageId || ""),
            ts: Number.isFinite(ts) ? ts : 0,
            stationId: normalizeStationId(payload.stationId),
            stationName: String(payload.stationName || "").trim(),
            authorName: String(payload.authorName || "").trim(),
            type,
            text: String(payload.text || "").trim(),
            request:
              payload.request && typeof payload.request === "object"
                ? {
                    fromStationId: normalizeStationId(payload.request.fromStationId),
                    fromStationName: String(payload.request.fromStationName || "").trim(),
                    toStationId: normalizeStationId(payload.request.toStationId),
                    toStationName: String(payload.request.toStationName || "").trim(),
                    status: String(payload.request.status || "pending")
                      .trim()
                      .toLowerCase(),
                    calledByStationId: normalizeStationId(payload.request.calledByStationId),
                    calledAt: Number(payload.request.calledAt || 0),
                    callId: String(payload.request.callId || "").trim(),
                  }
                : null,
          };
          this.chatMessageMap.set(message.messageId, message);
          parsed.push(message);
        });
      }

      parsed.sort((a, b) => a.ts - b.ts);
      this.chatMessages = parsed.slice(-CHAT_MAX_MESSAGES);
      this.renderChatMessages();
    }

    /**
     * @param {number} ts
     * @returns {string}
     */
    formatChatTime(ts) {
      if (!Number.isFinite(ts) || ts <= 0) return "--:--";
      try {
        return new Date(ts).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "--:--";
      }
    }

    renderChatMessages() {
      const container = this.refs.chatMessages;
      if (!(container instanceof HTMLElement)) return;
      const wasNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 36;
      container.innerHTML = "";

      if (!this.chatMessages.length) {
        const empty = document.createElement("p");
        empty.className = "telew__chatEmpty";
        empty.textContent = "Sin mensajes todavía.";
        container.appendChild(empty);
        return;
      }

      this.chatMessages.forEach((message) => {
        const item = document.createElement("article");
        item.className = "telew__chatItem";
        item.dataset.type = message.type;

        const meta = document.createElement("div");
        meta.className = "telew__chatMeta";
        const author = document.createElement("span");
        author.className = "telew__chatAuthor";
        const stationLabel =
          message.stationName || getStationById(message.stationId)?.name || "Estación";
        author.textContent = `${stationLabel} — ${message.authorName || "Operador"}`;
        const time = document.createElement("span");
        time.className = "telew__chatTime";
        time.textContent = this.formatChatTime(message.ts);
        meta.append(author, time);
        item.appendChild(meta);

        const body = document.createElement("p");
        body.className = "telew__chatBody";
        body.textContent =
          message.text ||
          (message.type === "call_request"
            ? "Solicitud de llamada."
            : message.type === "call_queue"
              ? "Llamada en cola."
              : "Mensaje del sistema.");
        item.appendChild(body);

        if (message.type === "call_request" || message.type === "call_queue") {
          const actions = document.createElement("div");
          actions.className = "telew__chatActionsInline";
          const req = message.request || null;

          if (req && req.status === "called") {
            const tag = document.createElement("span");
            tag.className = "telew__chatTag";
            tag.dataset.state = "called";
            tag.textContent = "LLAMADO";
            actions.appendChild(tag);
          }

          if (req && req.status !== "called") {
            if (
              message.type === "call_request" &&
              this.currentStation &&
              req.fromStationId &&
              req.fromStationId !== this.currentStation.id
            ) {
              const callBtn = document.createElement("button");
              callBtn.type = "button";
              callBtn.className = "telew__chatBtn";
              callBtn.dataset.chatAction = "call-request";
              callBtn.dataset.messageId = message.messageId;
              callBtn.dataset.targetId = req.fromStationId;
              callBtn.textContent = "Llamar";
              actions.appendChild(callBtn);
            }

            if (
              message.type === "call_queue" &&
              this.currentStation &&
              req.callId &&
              req.toStationId === this.currentStation.id
            ) {
              const attendBtn = document.createElement("button");
              attendBtn.type = "button";
              attendBtn.className = "telew__chatBtn";
              attendBtn.dataset.chatAction = "accept-queued";
              attendBtn.dataset.messageId = message.messageId;
              attendBtn.dataset.callId = req.callId;
              attendBtn.textContent = "Atender";
              actions.appendChild(attendBtn);
            }
          }

          if (actions.childElementCount > 0) {
            item.appendChild(actions);
          }
        }

        container.appendChild(item);
      });

      if (wasNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    /**
     * @param {HTMLButtonElement} actionBtn
     * @returns {Promise<void>}
     */
    async handleChatAction(actionBtn) {
      const action = String(actionBtn.dataset.chatAction || "").trim();
      const messageId = String(actionBtn.dataset.messageId || "").trim();
      if (!action || !messageId || !this.currentStation || !this.firebaseReady) return;

      if (action === "call-request") {
        const targetId = normalizeStationId(actionBtn.dataset.targetId);
        if (!targetId) return;
        const callId = await this.startOutgoingCallTo(targetId);
        if (!callId) return;
        await this.firebase.patchChatMessage(messageId, {
          request: {
            fromStationId: targetId,
            fromStationName: getStationById(targetId)?.name || targetId,
            status: "called",
            calledByStationId: this.currentStation.id,
            calledAt: Date.now(),
            callId,
          },
        });
        return;
      }

      if (action === "accept-queued") {
        const callId = String(actionBtn.dataset.callId || "").trim();
        if (!callId) return;
        await this.acceptQueuedCall(callId, messageId);
      }
    }

    /**
     * @param {string} callId
     * @param {string} messageId
     * @returns {Promise<void>}
     */
    async acceptQueuedCall(callId, messageId) {
      if (!this.currentStation || !this.firebaseReady) return;
      if (this.state !== "idle") {
        this.setStatus("Terminá la llamada actual para atender la cola.", "warn");
        return;
      }

      const myStationId = this.currentStation.id;
      const queuedCall =
        this.callInboxCache.find(
          (call) =>
            call.callId === callId &&
            call.toId === myStationId &&
            (call.status === "queued" || call.status === "ringing"),
        ) || null;

      if (!queuedCall) {
        this.setStatus("La llamada en cola ya no está disponible.", "warn");
        return;
      }

      this.activeCall = {
        ...queuedCall,
        peerId: queuedCall.fromId,
        peerName: queuedCall.fromName,
        direction: "incoming",
        inboxStationId: myStationId,
      };
      this.state = "incoming";
      await this.acceptIncomingCall();

      await this.firebase.patchChatMessage(messageId, {
        request: {
          fromStationId: queuedCall.fromId,
          fromStationName: queuedCall.fromName,
          toStationId: queuedCall.toId,
          toStationName: queuedCall.toName,
          status: "called",
          calledByStationId: myStationId,
          calledAt: Date.now(),
          callId: queuedCall.callId,
        },
      });
    }

    async sendChatTextMessage() {
      if (!this.currentStation || !this.firebaseReady) return;
      const now = Date.now();
      if (now - this.lastChatSendAt < CHAT_SEND_DEBOUNCE_MS) return;

      const authorName = this.getValidChatAuthorName();
      if (!authorName) {
        this.setStatus("Completá 'Tu nombre' para usar el chat.", "warn");
        this.refs.chatAuthorInput.focus();
        return;
      }

      const text = String(this.refs.chatTextInput.value || "").trim().slice(0, 300);
      if (!text) {
        this.setStatus("Escribí un mensaje para enviar.", "warn");
        this.refs.chatTextInput.focus();
        return;
      }

      this.lastChatSendAt = now;
      await this.firebase.createChatMessage({
        stationId: this.currentStation.id,
        stationName: this.currentStation.name,
        authorName,
        type: "text",
        text,
      });
      this.refs.chatTextInput.value = "";
      this.setStatus("Mensaje enviado.", "ok");
    }

    async sendChatCallRequest() {
      if (!this.currentStation || !this.firebaseReady) return;
      const now = Date.now();
      if (now - this.lastChatSendAt < CHAT_SEND_DEBOUNCE_MS) return;

      const authorName = this.getValidChatAuthorName();
      if (!authorName) {
        this.setStatus("Completá 'Tu nombre' para solicitar llamada.", "warn");
        this.refs.chatAuthorInput.focus();
        return;
      }

      this.lastChatSendAt = now;
      await this.firebase.createChatMessage({
        stationId: this.currentStation.id,
        stationName: this.currentStation.name,
        authorName,
        type: "call_request",
        text: `${this.currentStation.name} solicita una llamada.`,
        request: {
          fromStationId: this.currentStation.id,
          fromStationName: this.currentStation.name,
          status: "pending",
          calledByStationId: "",
          calledAt: 0,
          callId: "",
        },
      });
      this.setStatus("Solicitud de llamada publicada en chat.", "ok");
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

      const canUseChat = Boolean(this.currentStation && this.firebaseReady);
      this.refs.chatAuthorInput.disabled = !this.currentStation;
      this.refs.chatTextInput.disabled = !canUseChat;
      this.refs.chatSendBtn.disabled = !canUseChat;
      this.refs.chatRequestBtn.disabled = !canUseChat;

      this.syncOwnPresenceBusy();
      this.renderStatus();
    }

    syncOwnPresenceBusy() {
      if (!this.firebaseReady || !this.currentStation || this.presencePatchInFlight) return;

      const isBusy = this.state !== "idle";
      if (this.ownPresenceBusy === isBusy) return;

      this.presencePatchInFlight = true;
      this.firebase
        .patchPresence(this.currentStation.id, { busy: isBusy })
        .then(() => {
          this.ownPresenceBusy = isBusy;
        })
        .catch((error) => {
          const message = String(error?.message || "");
          if (message.toLowerCase().includes("websocket")) {
            console.warn(
              "[teleconsulta] Posible bloqueo CSP/connect-src para RTDB websocket. Verificá connect-src con wss: en firebase.json.",
              error,
            );
          } else {
            console.warn("[teleconsulta] No se pudo actualizar busy en presence.", error);
          }
        })
        .finally(() => {
          this.presencePatchInFlight = false;
        });
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
      return targetStatus.code === "available" || targetStatus.code === "busy";
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
     *  createdAt: number,
     *  updatedAt: number,
     *  acceptedAt: number,
     *  endedAt: number,
     *  reason: string,
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
       * createdAt?: unknown,
       * updatedAt?: unknown,
       * acceptedAt?: unknown,
       * endedAt?: unknown,
       * reason?: unknown,
       * }} */ (callCandidate);

      const callId = String(call.callId || "").trim();
      const room = String(call.room || "").trim();
      const fromId = normalizeStationId(call.fromId);
      const toId = normalizeStationId(call.toId);

      if (!callId || !room || !fromId || !toId) return null;

      const fromStation = getStationById(fromId);
      const toStation = getStationById(toId);
      if (!fromStation || !toStation) return null;

      const createdAtRaw = Number(call.createdAt || 0);
      const createdAt = Number.isFinite(createdAtRaw) ? createdAtRaw : 0;
      const updatedAtRaw = Number(call.updatedAt || 0);
      const updatedAt = Number.isFinite(updatedAtRaw) ? updatedAtRaw : 0;
      const acceptedAtRaw = Number(call.acceptedAt || 0);
      const acceptedAt = Number.isFinite(acceptedAtRaw) ? acceptedAtRaw : 0;
      const endedAtRaw = Number(call.endedAt || 0);
      const endedAt = Number.isFinite(endedAtRaw) ? endedAtRaw : 0;

      return {
        callId,
        room,
        fromId,
        fromName: String(call.fromName || "").trim() || fromStation.name,
        toId,
        toName: String(call.toName || "").trim() || toStation.name,
        status: String(call.status || "").trim().toLowerCase(),
        createdAt,
        updatedAt,
        acceptedAt,
        endedAt,
        reason: String(call.reason || "").trim(),
      };
    }

    /**
     * @param {unknown} snapshotValue
     * @returns {Array<{
     *  callId: string,
     *  room: string,
     *  fromId: string,
     *  fromName: string,
     *  toId: string,
     *  toName: string,
     *  status: string,
     *  createdAt: number,
     *  updatedAt: number,
     *  acceptedAt: number,
     *  endedAt: number,
     *  reason: string,
     * }>}
     */
    parseStationCalls(snapshotValue) {
      if (!snapshotValue || typeof snapshotValue !== "object") return [];

      const directCall = this.parseCall(snapshotValue);
      if (directCall) return [directCall];

      const parsedCalls = [];
      Object.entries(snapshotValue).forEach(([entryCallId, entryValue]) => {
        if (!entryValue || typeof entryValue !== "object") return;

        const withCallId = Object.assign({}, entryValue, {
          callId: String(
            /** @type {{callId?: unknown}} */ (entryValue).callId || entryCallId || "",
          ),
        });

        const parsed = this.parseCall(withCallId);
        if (!parsed) return;
        parsedCalls.push(parsed);
      });

      parsedCalls.sort((a, b) => this.getCallQueueOrder(a) - this.getCallQueueOrder(b));
      return parsedCalls;
    }

    /**
     * @param {{callId: string, createdAt?: number}} call
     * @returns {number}
     */
    getCallQueueOrder(call) {
      const prefix = Number(String(call?.callId || "").split("_")[0]);
      if (Number.isFinite(prefix) && prefix > 0) return prefix;
      const createdAt = Number(call?.createdAt || 0);
      if (Number.isFinite(createdAt) && createdAt > 0) return createdAt;
      return Number.MAX_SAFE_INTEGER;
    }

    /**
     * @param {unknown} snapshotValue
     * @param {string} callId
     * @returns {null | {
     *  callId: string,
     *  room: string,
     *  fromId: string,
     *  fromName: string,
     *  toId: string,
     *  toName: string,
     *  status: string,
     *  createdAt: number,
     *  updatedAt: number,
     *  acceptedAt: number,
     *  endedAt: number,
     *  reason: string,
     * }}
     */
    getCallFromSnapshot(snapshotValue, callId) {
      const targetCallId = String(callId || "").trim();
      if (!targetCallId) return null;
      return (
        this.parseStationCalls(snapshotValue).find((entry) => entry.callId === targetCallId) || null
      );
    }

    /**
     * @param {Array<{callId: string, status: string}>} calls
     * @param {string} [excludeCallId]
     * @returns {boolean}
     */
    isBusyByCalls(calls, excludeCallId = "") {
      return calls.some((call) => {
        if (!call) return false;
        if (excludeCallId && call.callId === excludeCallId) return false;
        return BUSY_CALL_STATUSES.has(String(call.status || "").toLowerCase());
      });
    }

    /**
     * @param {number} count
     */
    updateQueueVisual(count) {
      this.waitingIncomingCount = Math.max(0, Number(count || 0));
      this.renderStatus();
    }

    /**
     * @param {unknown} snapshotValue
     * @returns {Promise<void>}
     */
    async handleOwnCallsSnapshot(snapshotValue) {
      if (!this.currentStation) return;
      const myStationId = this.currentStation.id;

      const ownCalls = this.parseStationCalls(snapshotValue).filter(
        (call) => call.toId === myStationId,
      );
      this.callInboxCache = ownCalls;

      const activeCallId = this.activeCall ? String(this.activeCall.callId || "") : "";
      const activeSnapshot =
        this.activeCall && activeCallId
          ? ownCalls.find((call) => call.callId === activeCallId) || null
          : null;

      if (!activeSnapshot && this.state === "incoming" && this.activeCall?.direction === "incoming") {
        this.closeIncomingModal();
        this.incomingTone.stop();
        this.activeCall = null;
        this.state = "idle";
        this.setStatus("Llamada entrante cancelada.", "warn");
        this.setPlaceholder(
          "Teleconsulta",
          "Iniciá una llamada o esperá una entrante.",
        );
        this.syncUI();
      }

      if (
        activeSnapshot &&
        ["ended", "declined", "missed", "timeout", "cancelled"].includes(activeSnapshot.status)
      ) {
        await this.handleRemoteTerminalStatus(activeSnapshot.status, {
          ...activeSnapshot,
          inboxStationId: myStationId,
          peerId: activeSnapshot.fromId,
          peerName: activeSnapshot.fromName,
        });
        return;
      }

      const pendingCalls = ownCalls.filter(
        (call) => PENDING_CALL_STATUSES.has(call.status) && call.fromId !== myStationId,
      );
      const queuedCount = pendingCalls.filter((call) => call.callId !== activeCallId).length;
      this.updateQueueVisual(queuedCount);

      const busyByState = this.state !== "idle";
      const busyByCalls = ownCalls.some(
        (call) =>
          call.callId !== activeCallId &&
          (call.status === "accepted" || call.status === "in-call"),
      );
      const shouldQueueIncoming = busyByState || busyByCalls;

      if (shouldQueueIncoming) {
        for (const pendingCall of pendingCalls) {
          if (pendingCall.callId === activeCallId) continue;
          if (pendingCall.status !== "ringing") continue;
          this.firebase
            .patchCall(myStationId, pendingCall.callId, {
              status: "queued",
              reason: "receiver_busy",
            })
            .then(() => this.publishQueuedCallToChat(pendingCall))
            .catch(() => {
              // no-op
            });

          const now = Date.now();
          if (now - this.lastQueuedNotifyAt > 500) {
            this.lastQueuedNotifyAt = now;
            this.outgoingTone.stop();
            this.incomingTone.notifyOnce().catch(() => {
              // no-op
            });
          }
        }

        if (queuedCount > 0) {
          const suffix = queuedCount === 1 ? "llamada" : "llamadas";
          this.setStatus(`En llamada. ${queuedCount} ${suffix} en espera.`, "warn");
        }
        return;
      }

      const nextPending = pendingCalls[0] || null;
      if (!nextPending) return;

      if (nextPending.status === "queued") {
        try {
          await this.firebase.patchCall(myStationId, nextPending.callId, { status: "ringing" });
        } catch (error) {
          // no-op
        }
      }

      this.updateQueueVisual(Math.max(0, pendingCalls.length - 1));
      await this.handleIncomingRinging({
        ...nextPending,
        status: "ringing",
      });
    }

    /**
     * @param {{callId: string, fromId: string, fromName: string, toId: string, toName: string}} call
     * @returns {Promise<void>}
     */
    async publishQueuedCallToChat(call) {
      const callId = String(call?.callId || "").trim();
      if (!callId || this.queuePublishedCallIds.has(callId)) return;
      this.queuePublishedCallIds.add(callId);

      if (!this.currentStation || !this.firebaseReady) return;
      const current = this.currentStation;
      await this.firebase.createChatMessage({
        stationId: current.id,
        stationName: current.name,
        authorName: "Sistema",
        type: "call_queue",
        text: `${call.fromName} quedó en cola para ${call.toName}.`,
        request: {
          fromStationId: call.fromId,
          fromStationName: call.fromName,
          toStationId: call.toId,
          toStationName: call.toName,
          status: "pending",
          callId,
        },
      });
    }

    /**
     * @returns {Promise<void>}
     */
    async promoteNextQueuedIncoming() {
      if (!this.currentStation || this.state !== "idle") return;
      const myStationId = this.currentStation.id;
      const nextQueued =
        this.callInboxCache.find(
          (call) =>
            call.toId === myStationId &&
            call.status === "queued" &&
            call.fromId !== myStationId,
        ) || null;
      if (!nextQueued) return;

      try {
        await this.firebase.patchCall(myStationId, nextQueued.callId, { status: "ringing" });
      } catch (error) {
        // no-op
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
     *  createdAt: number,
     * }} call
     * @returns {Promise<void>}
     */
    async handleIncomingRinging(call) {
      if (!this.currentStation || call.toId !== this.currentStation.id) return;
      if (call.fromId === this.currentStation.id) return;

      if (this.state !== "idle" && this.activeCall?.callId !== call.callId) {
        return;
      }

      if (this.activeCall && this.activeCall.callId === call.callId && this.state === "incoming") {
        return;
      }

      const incomingCall = {
        ...call,
        peerId: call.fromId,
        peerName: call.fromName,
        direction: "incoming",
        inboxStationId: this.currentStation.id,
      };

      this.activeCall = incomingCall;
      this.selectedTargetId = incomingCall.peerId;
      this.state = "incoming";

      this.setStatus(`Llamada entrante de ${incomingCall.peerName}.`, "warn");
      this.setPlaceholder("Llamada entrante", `Desde ${incomingCall.peerName}.`);
      this.openIncomingModal(incomingCall.peerName);
      this.outgoingTone.stop();
      await this.incomingTone.startIncoming();

      this.renderTargets();
      this.syncUI();
    }

    /**
     * @returns {Promise<void>}
     */
    async startOutgoingCall() {
      await this.startOutgoingCallTo(this.selectedTargetId);
    }

    /**
     * @returns {boolean}
     */
    isCurrentStationHost() {
      return Boolean(this.currentStation && HOST_STATION_IDS.has(this.currentStation.id));
    }

    /**
     * @param {string | null | undefined} targetStationId
     * @returns {Promise<string|null>}
     */
    async startOutgoingCallTo(targetStationId) {
      if (!this.currentStation) {
        this.setStatus("Seleccioná una estación antes de llamar.", "warn");
        return null;
      }

      if (!this.hasFirebaseConfig || !this.firebaseReady) {
        this.setStatus("Teleconsulta requiere Firebase activo para llamar.", "warn");
        return null;
      }

      const target = getStationById(targetStationId);
      if (!target) {
        this.setStatus("Seleccioná una estación destino.", "warn");
        return null;
      }

      if (target.id === this.currentStation.id) {
        this.setStatus("No podés llamarte a tu propia estación.", "warn");
        return null;
      }

      this.selectedTargetId = target.id;
      const targetStatus = this.getTargetStatus(target.id);
      if (targetStatus.code === "offline") {
        this.setStatus("Estación offline. No se puede encolar la llamada.", "warn");
        return null;
      }
      const targetIsBusy = targetStatus.code === "busy";

      const op = this.beginOp();
      await this.hangup("", {
        notifyPeer: true,
        silent: true,
        op,
      });

      if (!this.isOpCurrent(op)) return null;

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
        acceptedAt: null,
        endedAt: null,
        reason: "",
      };

      this.activeCall = {
        ...callPayload,
        peerId: target.id,
        peerName: target.name,
        direction: "outgoing",
        inboxStationId: target.id,
      };

      this.state = "outgoing";
      this.setStatus(
        targetIsBusy
          ? `Estación ocupada, tu llamada queda en cola (${target.name}).`
          : `Llamando a ${target.name}...`,
        targetIsBusy ? "warn" : "info",
      );
      this.setPlaceholder("Llamada saliente", `Llamando a ${target.name}...`);
      this.closeIncomingModal();
      this.incomingTone.stop();
      await this.outgoingTone.startOutgoing();
      this.syncUI();

      try {
        await this.firebase.createCall(target.id, callId, callPayload);
      } catch (error) {
        if (this.isOpCurrent(op)) {
          this.activeCall = null;
          this.state = "idle";
          this.outgoingTone.stop();
          this.setStatus("No se pudo iniciar la llamada.", "error");
          this.setPlaceholder(
            "Teleconsulta",
            "Iniciá una llamada o esperá una entrante.",
          );
          this.syncUI();
        }
        return null;
      }

      if (!this.isOpCurrent(op)) {
        try {
          await this.firebase.patchCall(target.id, callId, {
            status: "cancelled",
            reason: "superseded",
            endedAt: this.firebase.getServerTimestamp(),
          });
          this.deferCallCleanup(target.id, callId);
        } catch (error) {
          // no-op
        }
        this.outgoingTone.stop();
        return null;
      }

      this.bindOutgoingWatch(target.id, callId);
      this.armOutgoingTimeout(callId, target.id, target.name);

      if (this.isCurrentStationHost()) {
        try {
          await this.mountActiveMeeting(op);
        } catch (error) {
          console.warn("[teleconsulta] No se pudo montar Jitsi en modo host.", error);
        }
        if (this.isOpCurrent(op) && this.state === "outgoing") {
          this.setStatus(`Sala creada. Esperando a ${target.name}...`, "info");
          this.armHostHintTimer(target.name);
          this.syncUI();
        }
      }

      this.syncUI();
      return callId;
    }

    /**
     * @param {string} targetId
     * @param {string} callId
     */
    bindOutgoingWatch(targetId, callId) {
      this.clearOutgoingWatch();

      this.unsubscribeOutgoing = this.firebase.listenCall(
        targetId,
        callId,
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
          await this.firebase.patchCall(targetId, callId, {
            status: "missed",
            reason: "timeout",
            endedAt: this.firebase.getServerTimestamp(),
          });
        } catch (error) {
          // no-op
        }
        this.deferCallCleanup(targetId, callId);

        this.outgoingTone.stop();
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

      const parsed = this.getCallFromSnapshot(snapshotValue, callId);
      if (!parsed) {
        if (this.state === "outgoing") {
          this.outgoingTone.stop();
          await this.handleRemoteTerminalStatus("ended", {
            ...activeCall,
            fromName: activeCall.fromName || "",
            toName: activeCall.toName || "",
          });
        }
        return;
      }

      if (parsed.status === "ringing") {
        if (!this.outgoingTimeoutId) {
          this.armOutgoingTimeout(callId, activeCall.peerId, activeCall.peerName);
        }
        this.setStatus(`Llamando a ${activeCall.peerName}...`, "info");
        return;
      }

      if (parsed.status === "queued") {
        this.clearOutgoingTimeout();
        this.outgoingTone.stop();
        await this.incomingTone.notifyOnce();
        this.setStatus("Destino ocupado, quedaste en cola.", "warn");
        return;
      }

      if (parsed.status === "accepted" || parsed.status === "in-call") {
        this.clearOutgoingTimeout();
        this.outgoingTone.stop();
        this.clearHostHintTimer();

        if (this.state !== "outgoing") return;

        const op = this.opSeq;
        this.setStatus(`Conectando con ${activeCall.peerName}...`, "info");
        if (!this.jitsi.hasMeeting()) {
          await this.mountActiveMeeting(op);
        }
        if (!this.isOpCurrent(op)) return;
        if (!this.activeCall || this.activeCall.callId !== callId) return;

        this.state = "in-call";
        this.refs.fsLabel.textContent = `En llamada con ${activeCall.peerName}`;
        this.setStatus(`En llamada con ${activeCall.peerName}.`, "ok");
        this.syncUI();
        return;
      }

      if (["declined", "missed", "ended", "cancelled", "timeout"].includes(parsed.status)) {
        this.outgoingTone.stop();
        this.clearHostHintTimer();
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

      this.incomingTone.stop();
      this.outgoingTone.stop();
      this.closeIncomingModal();
      this.setStatus(`Conectando con ${call.peerName}...`, "info");

      try {
        await this.firebase.patchCall(this.currentStation.id, call.callId, {
          status: "accepted",
          acceptedAt: this.firebase.getServerTimestamp(),
        });
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
      this.firebase
        .patchCall(this.currentStation.id, call.callId, {
          status: "in-call",
          acceptedAt: this.firebase.getServerTimestamp(),
        })
        .catch(() => {
          // no-op
        });
      this.updateQueueVisual(this.waitingIncomingCount);
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

      this.incomingTone.stop();
      this.outgoingTone.stop();
      this.closeIncomingModal();

      try {
        await this.firebase.patchCall(this.currentStation.id, call.callId, {
          status: "declined",
          endedAt: this.firebase.getServerTimestamp(),
          reason: "receiver_declined",
        });
      } catch (error) {
        // no-op
      }
      this.deferCallCleanup(this.currentStation.id, call.callId);

      if (!this.isOpCurrent(op)) return;

      this.activeCall = null;
      this.state = "idle";
      this.setStatus(`Llamada de ${call.peerName} rechazada.`, "warn");
      this.setPlaceholder(
        "Teleconsulta",
        "Iniciá una llamada o esperá una entrante.",
      );
      this.syncUI();
      await this.promoteNextQueuedIncoming();
    }

    /**
     * @param {{callId?: unknown, room?: unknown, fromId?: unknown, toId?: unknown, peerName?: unknown}} call
     * @returns {Promise<boolean>}
     */
    async lockActiveCall(call) {
      return Boolean(call);
    }

    /**
     * @param {{callId?: unknown, fromId?: unknown, toId?: unknown, peerId?: unknown} | null} call
     * @returns {Promise<void>}
     */
    async releaseActiveCall(call) {
      return;
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
        onConferenceJoined: () => {
          this.clearHostHintTimer();
          const currentCall = this.activeCall;
          if (!currentCall || !this.firebaseReady) return;
          if (currentCall.callId !== call.callId) return;
          const shouldPatchInCall =
            this.state === "in-call" || currentCall.direction === "incoming";
          if (!shouldPatchInCall) return;
          this.firebase
            .patchCall(currentCall.inboxStationId, currentCall.callId, {
              status: "in-call",
              acceptedAt: this.firebase.getServerTimestamp(),
            })
            .catch(() => {
              // no-op
            });
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
      this.incomingTone.stop();
      this.outgoingTone.stop();
      this.closeIncomingModal();

      if (call && notifyPeer && this.firebaseReady) {
        try {
          await this.firebase.patchCall(call.inboxStationId, call.callId, {
            status: "ended",
            endedAt: this.firebase.getServerTimestamp(),
            reason: String(reason || "").trim() || "local_hangup",
          });
        } catch (error) {
          // no-op
        }
        this.deferCallCleanup(call.inboxStationId, call.callId);
      }

      await this.releaseActiveCall(call);

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
      await this.promoteNextQueuedIncoming();
    }

    /**
     * @param {string} status
     * @param {{peerName?: string, callId?: string, inboxStationId?: string, fromId?: string, toId?: string, peerId?: string}} call
     * @returns {Promise<void>}
     */
    async handleRemoteTerminalStatus(status, call) {
      const op = this.beginOp();

      this.clearOutgoingWatch();
      this.incomingTone.stop();
      this.outgoingTone.stop();
      this.closeIncomingModal();
      await this.jitsi.disposeMeeting();

      if (call && call.inboxStationId && call.callId && this.firebaseReady) {
        this.deferCallCleanup(call.inboxStationId, call.callId);
      }

      await this.releaseActiveCall(call || null);

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
      } else if (status === "timeout") {
        message = "La llamada venció por timeout.";
      } else if (status === "cancelled") {
        message = "La llamada fue cancelada.";
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
      await this.promoteNextQueuedIncoming();
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
      const call = this.activeCall;

      this.clearOutgoingWatch();
      this.clearInboxListener();
      this.clearGlobalRealtime();
      this.clearChatRealtime();

      this.incomingTone.stop();
      this.outgoingTone.stop();
      this.closeIncomingModal();
      this.closeFullscreen({ restoreFocus: false });

      await this.jitsi.disposeMeeting();
      await this.incomingTone.dispose();
      await this.outgoingTone.dispose();

      if (this.firebaseReady) {
        await this.releaseActiveCall(call);
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
      chatMessages: document.getElementById("telewChatMessages"),
      chatAuthorInput: document.getElementById("telewChatAuthor"),
      chatTextInput: document.getElementById("telewChatText"),
      chatSendBtn: document.getElementById("telewChatSend"),
      chatRequestBtn: document.getElementById("telewChatRequestCall"),
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
      refs.chatMessages,
      refs.chatAuthorInput,
      refs.chatTextInput,
      refs.chatSendBtn,
      refs.chatRequestBtn,
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
