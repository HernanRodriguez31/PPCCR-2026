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

  const JITSI_DOMAIN =
    String(window.PPCCR_JITSI_DOMAIN || "").trim() || "meet.jit.si";
  const JITSI_SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;
  const CHAT_ENABLED = Boolean(window.PPCCR_CHAT_ENABLED !== false);

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
    chatAuthor: "ppccr_chat_author",
    role: "ppccr_tele_role",
    openNewTab: "ppccr_tele_open_newtab",
  });

  const DB_PATHS = Object.freeze({
    presence: "ppccr/teleconsulta/presence",
    calls: "ppccr/teleconsulta/calls",
    chatMessages: "ppccr/teleconsulta/chat/messages",
  });

  const ROLE_STATION = "station";
  const ROLE_MEDIC = "medic";
  const VALID_ROLES = new Set([ROLE_STATION, ROLE_MEDIC]);

  const CALL_TIMEOUT_MS = 35_000;
  const CALL_CLEANUP_DELAY_MS = 6_000;
  const CHAT_MAX_MESSAGES = 150;
  const CHAT_SEND_DEBOUNCE_MS = 1_000;
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
   * @param {string | null | undefined} value
   * @returns {'station'|'medic'}
   */
  function normalizeRole(value) {
    const role = String(value || "")
      .trim()
      .toLowerCase();
    return VALID_ROLES.has(role) ? role : ROLE_STATION;
  }

  /**
   * @returns {'station'|'medic'}
   */
  function getStoredRole() {
    return normalizeRole(safeLocalGet(STORAGE_KEYS.role));
  }

  /**
   * @returns {boolean}
   */
  function isIosLikeDevice() {
    const ua = String(window.navigator?.userAgent || "");
    const platform = String(window.navigator?.platform || "");
    const touchPoints = Number(window.navigator?.maxTouchPoints || 0);
    return (
      /iPad|iPhone|iPod/i.test(ua) ||
      (platform === "MacIntel" && touchPoints > 1)
    );
  }

  /**
   * @param {string | null | undefined} value
   * @returns {boolean}
   */
  function parseBooleanLike(value) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return ["1", "true", "yes", "on"].includes(normalized);
  }

  /**
   * @returns {boolean}
   */
  function getStoredOpenNewTab() {
    const raw = safeLocalGet(STORAGE_KEYS.openNewTab);
    if (!raw) {
      const defaultValue = isIosLikeDevice();
      safeLocalSet(STORAGE_KEYS.openNewTab, defaultValue ? "1" : "0");
      return defaultValue;
    }
    return parseBooleanLike(raw);
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
   * Soporta override por URL para pruebas:
   * ?station=rivadavia&role=medic&name=Hernan
   * @returns {boolean} true cuando aplica cambios y dispara recarga.
   */
  function applyUrlOverridesIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const stationParam = String(params.get("station") || "").trim();
    const roleParam = String(params.get("role") || "").trim();
    const nameParam = String(params.get("name") || "").trim();

    let changed = false;

    if (stationParam) {
      const station = resolveStation(stationParam);
      if (station) {
        persistStationState(station);
        safeLocalSet(STORAGE_KEYS.stationId, station.id);
        safeLocalSet(STORAGE_KEYS.stationName, station.name);
        changed = true;
      }
    }

    if (roleParam) {
      safeLocalSet(STORAGE_KEYS.role, normalizeRole(roleParam));
      changed = true;
    }

    if (nameParam) {
      safeSessionSet(STORAGE_KEYS.chatAuthor, nameParam.slice(0, 40));
      safeLocalSet(STORAGE_KEYS.chatAuthor, nameParam.slice(0, 40));
      changed = true;
    }

    if (!changed) return false;

    params.delete("station");
    params.delete("role");
    params.delete("name");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${
      nextQuery ? `?${nextQuery}` : ""
    }${window.location.hash}`;
    window.location.replace(nextUrl);
    return true;
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
    return STORAGE_KEYS.chatAuthor;
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
      this.presenceRole = ROLE_STATION;
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

        const apps = Array.isArray(window.firebase.apps) ? window.firebase.apps : [];
        const hasApp = apps && apps.length > 0;

        if (hasApp) {
          this.app = apps[0];
        } else {
          const cfg =
            this.config && typeof this.config === "object"
              ? this.config
              : await waitForFirebaseConfig();

          if (!cfg) {
            throw new Error(
              "Error de Config: no existe app Firebase inicializada y falta window.PPCCR_FIREBASE_CONFIG.",
            );
          }

          this.config = cfg;
          this.app = window.firebase.initializeApp(cfg);
        }

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
     * @param {'station'|'medic'} role
     * @returns {Promise<void>}
     */
    async setPresence(station, role = ROLE_STATION) {
      await this.init();

      const nextStation = resolveStation(station);
      if (!nextStation) return;
      const nextRole = normalizeRole(role);

      const previous = this.presenceStation;
      if (previous && previous.id !== nextStation.id) {
        try {
          await this.ref(getPresencePath(previous.id)).set({
            online: false,
            busy: false,
            stationName: previous.name,
            role: nextRole,
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
        stationName: nextStation.name,
        role: nextRole,
        ts: this.getServerTimestamp(),
      });

      const disconnectOp = this.presenceRef.onDisconnect();
      await disconnectOp.set({
        online: false,
        busy: false,
        stationName: nextStation.name,
        role: nextRole,
        ts: this.getServerTimestamp(),
      });

      this.presenceOnDisconnect = disconnectOp;
      this.presenceStation = nextStation;
      this.presenceRole = nextRole;
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
          stationName: station.name,
          role: this.presenceRole || ROLE_STATION,
          ts: this.getServerTimestamp(),
        });
      } catch (error) {
        console.warn("[teleconsulta] No se pudo limpiar presence", error);
      }

      this.presenceOnDisconnect = null;
      this.presenceRef = null;
      this.presenceStation = null;
      this.presenceRole = ROLE_STATION;
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
      const targetId = normalizeStationId(toStationId);
      const normalizedCallId = String(callId || "").trim();
      if (!targetId || !normalizedCallId) return;

      const slotSnapshot = await this.ref(getCallsPath(targetId)).once("value");
      const slotValue = slotSnapshot.val();
      if (
        slotValue &&
        typeof slotValue === "object" &&
        String(slotValue.callId || "").trim() === normalizedCallId
      ) {
        await this.ref(getCallsPath(targetId)).update({
          ...patch,
          updatedAt: this.getServerTimestamp(),
        });
        return;
      }

      await this.ref(getCallPath(targetId, normalizedCallId)).update({
        ...patch,
        updatedAt: this.getServerTimestamp(),
      });
    }

    /**
     * @param {string} stationId
     * @param {string} callId
     * @returns {Promise<void>}
     */
    async clearCallIfMatch(stationId, callId) {
      await this.init();
      const targetId = normalizeStationId(stationId);
      const normalizedCallId = String(callId || "").trim();
      if (!targetId || !normalizedCallId) return;

      const slotRef = this.ref(getCallsPath(targetId));
      const slotSnapshot = await slotRef.once("value");
      const slotValue = slotSnapshot.val();
      if (
        slotValue &&
        typeof slotValue === "object" &&
        String(slotValue.callId || "").trim() === normalizedCallId
      ) {
        await slotRef.remove();
        return;
      }

      const callRef = this.ref(getCallPath(targetId, normalizedCallId));
      const callSnapshot = await callRef.once("value");
      const callValue = callSnapshot.val();
      if (callValue && String(callValue.callId || "").trim() === normalizedCallId) {
        await callRef.remove();
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
     * @param {string} callId
     * @param {Record<string, unknown>} payload
     * @returns {Promise<void>}
     */
    async setCall(stationId, callId, payload) {
      return this.createCall(stationId, callId, payload);
    }
  }

  class AudioService {
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
    async startRingback() {
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

  class ChatService {
    /**
     * @param {FirebaseTeleconsultaService} firebaseService
     */
    constructor(firebaseService) {
      this.firebase = firebaseService;
      this.refValue = null;
      this.boundAdded = null;
      this.boundChanged = null;
      this.boundError = null;
    }

    /**
     * @param {{
     *  messageId: string,
     *  type: 'added' | 'changed',
     *  payload: any,
     * }} event
     * @returns {any}
     */
    normalizeEvent(event) {
      const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
      const rawType = String(payload.type || "").trim().toLowerCase();
      const normalizedType = rawType === "call-request" ? "call_request" : rawType;

      return {
        type: event.type,
        messageId: String(event.messageId || ""),
        ts: Number(payload.ts || 0),
        stationId: normalizeStationId(payload.stationId),
        stationName: String(payload.stationName || "").trim(),
        authorName: String(payload.authorName || "").trim(),
        messageType: normalizedType,
        text: String(payload.text || "").trim(),
        targetId: normalizeStationId(payload.targetId),
        requestStatus: String(payload.requestStatus || payload.status || "")
          .trim()
          .toLowerCase(),
        handledBy: normalizeStationId(payload.handledBy),
        handledByName: String(payload.handledByName || "").trim(),
        handledAt: Number(payload.handledAt || 0),
        callId: String(payload.callId || "").trim(),
      };
    }

    /**
     * @param {(event: any) => void} onEvent
     * @param {(error: Error) => void} [onError]
     * @returns {Promise<() => void>}
     */
    async listen(onEvent, onError) {
      await this.firebase.init();
      const query = this.firebase
        .ref(getChatMessagesPath())
        .orderByChild("ts")
        .limitToLast(120);

      this.refValue = query;
      this.boundAdded = (snapshot) => {
        const event = this.normalizeEvent({
          type: "added",
          messageId: snapshot.key || "",
          payload: snapshot.val(),
        });
        onEvent(event);
      };
      this.boundChanged = (snapshot) => {
        const event = this.normalizeEvent({
          type: "changed",
          messageId: snapshot.key || "",
          payload: snapshot.val(),
        });
        onEvent(event);
      };
      this.boundError = (error) => {
        if (typeof onError === "function") {
          onError(error);
          return;
        }
        console.error("[teleconsulta] Chat listener error", error);
      };

      query.on("child_added", this.boundAdded, this.boundError);
      query.on("child_changed", this.boundChanged, this.boundError);

      return () => {
        this.stop();
      };
    }

    stop() {
      if (!this.refValue) return;
      if (this.boundAdded) {
        this.refValue.off("child_added", this.boundAdded);
      }
      if (this.boundChanged) {
        this.refValue.off("child_changed", this.boundChanged);
      }
      this.refValue = null;
      this.boundAdded = null;
      this.boundChanged = null;
      this.boundError = null;
    }

    /**
     * @param {{fromStation: {id: string, name: string}, author: string, text: string}} payload
     * @returns {Promise<string>}
     */
    async sendText(payload) {
      const { fromStation, author, text } = payload;
      return this.firebase.createChatMessage({
        stationId: fromStation.id,
        stationName: fromStation.name,
        authorName: String(author || "").trim().slice(0, 40),
        type: "text",
        text: String(text || "").trim().slice(0, 500),
      });
    }

    /**
     * @param {{fromStation: {id: string, name: string}, author: string, targetId: string, reason?: string}} payload
     * @returns {Promise<string>}
     */
    async sendCallRequest(payload) {
      const { fromStation, author, targetId, reason = "" } = payload;
      const targetStation = getStationById(targetId);
      const reasonText = String(reason || "").trim().slice(0, 240);
      const messageText = reasonText
        ? `Solicito videollamada (${reasonText})`
        : "Solicito videollamada";

      return this.firebase.createChatMessage({
        stationId: fromStation.id,
        stationName: fromStation.name,
        authorName: String(author || "").trim().slice(0, 40),
        type: "call_request",
        text: messageText,
        targetId: targetStation ? targetStation.id : "",
        requestStatus: "pending",
      });
    }

    /**
     * @param {string} messageId
     * @param {{id: string, name: string}} handlerStation
     * @returns {Promise<void>}
     */
    async markHandled(messageId, handlerStation) {
      await this.firebase.patchChatMessage(messageId, {
        requestStatus: "called",
        handledBy: handlerStation.id,
        handledByName: handlerStation.name,
        handledAt: Date.now(),
      });
    }

    /**
     * @param {{station: {id: string, name: string}, text: string, requestStatus?: string, targetId?: string, callId?: string}} payload
     * @returns {Promise<string>}
     */
    async sendSystem(payload) {
      const {
        station,
        text,
        requestStatus = "",
        targetId = "",
        callId = "",
      } = payload;
      return this.firebase.createChatMessage({
        stationId: station.id,
        stationName: station.name,
        authorName: "Sistema",
        type: "system",
        text: String(text || "").trim().slice(0, 500),
        requestStatus: String(requestStatus || "").trim().toLowerCase(),
        targetId: normalizeStationId(targetId),
        callId: String(callId || "").trim().slice(0, 80),
      });
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
     *  soundUnlockBtn: HTMLButtonElement,
     *  roleStationBtn: HTMLButtonElement,
     *  roleMedicBtn: HTMLButtonElement,
     *  openNewTabToggle: HTMLInputElement,
     *  externalHint: HTMLElement,
     *  chatRoot: HTMLElement,
     *  chatLog: HTMLElement,
     *  chatForm: HTMLFormElement,
     *  chatAuthorInput: HTMLInputElement,
     *  chatTextInput: HTMLTextAreaElement,
     *  chatSendBtn: HTMLButtonElement,
     *  chatRequestBtn: HTMLButtonElement,
     *  debugTools: HTMLElement,
     *  debugRequestBtn: HTMLButtonElement,
     *  debugBusyBtn: HTMLButtonElement,
     *  debugClearChatBtn: HTMLButtonElement,
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
      this.chatService = new ChatService(this.firebase);
      this.jitsi = JitsiSingleton.getInstance();
      this.audioService = new AudioService();
      this.chatEnabled = CHAT_ENABLED;

      this.state = "idle";
      this.activeCall = null;
      this.currentStation = null;
      this.currentRole = getStoredRole();
      this.openInNewTab = getStoredOpenNewTab();
      this.teleDebugEnabled =
        parseBooleanLike(new URLSearchParams(window.location.search).get("teleDebug")) ||
        false;
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
      this.chatMessages = [];
      this.lastChatSendAt = 0;
      this.chatAuthorName = "";
      this.chatMessageMap = new Map();
      this.debugBusyTimeoutId = 0;
      this.debugForceBusyUntil = 0;

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
      const apps = Array.isArray(window.firebase?.apps) ? window.firebase.apps : [];
      return Boolean(getFirebaseConfigNow()) || apps.length > 0;
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

      this.on(this.refs.soundUnlockBtn, "click", () => {
        this.unlockAudioTones().then((ok) => {
          if (ok) {
            this.setStatus("Sonido activado para tonos.", "ok");
          } else {
            this.setStatus("No se pudo activar el audio del navegador.", "warn");
          }
        });
      });

      this.on(this.refs.roleStationBtn, "click", () => {
        this.setRole(ROLE_STATION);
      });

      this.on(this.refs.roleMedicBtn, "click", () => {
        this.setRole(ROLE_MEDIC);
      });

      this.on(this.refs.openNewTabToggle, "change", () => {
        this.openInNewTab = Boolean(this.refs.openNewTabToggle.checked);
        safeLocalSet(STORAGE_KEYS.openNewTab, this.openInNewTab ? "1" : "0");
        this.renderRoleAndPrefs();
      });

      this.on(this.refs.chatRequestBtn, "click", () => {
        this.sendChatCallRequest().catch((error) => {
          console.error("[teleconsulta] Error enviando solicitud de llamada", error);
        });
      });

      this.on(this.refs.chatForm, "submit", (event) => {
        event.preventDefault();
        this.sendChatTextMessage().catch((error) => {
          console.error("[teleconsulta] Error enviando mensaje de chat", error);
        });
      });

      this.on(this.refs.chatTextInput, "keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key !== "Enter") return;
        if (event.shiftKey) return;
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

      this.on(this.refs.chatLog, "click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const actionBtn = target.closest("[data-chat-action]");
        if (!(actionBtn instanceof HTMLButtonElement)) return;
        this.handleChatAction(actionBtn).catch((error) => {
          console.error("[teleconsulta] Error ejecutando acción de chat", error);
        });
      });

      this.on(this.refs.debugRequestBtn, "click", () => {
        this.debugSimulateCallRequest().catch((error) => {
          console.error("[teleconsulta] Error en debug solicitud", error);
        });
      });

      this.on(this.refs.debugBusyBtn, "click", () => {
        this.debugSimulateBusy().catch((error) => {
          console.error("[teleconsulta] Error en debug busy", error);
        });
      });

      this.on(this.refs.debugClearChatBtn, "click", () => {
        this.debugClearChat().catch((error) => {
          console.error("[teleconsulta] Error en debug clear chat", error);
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
      this.renderRoleAndPrefs();
      this.renderDebugTools();

      const unlockAudio = () => {
        this.unlockAudioTones().catch(() => {
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
      const apps = Array.isArray(window.firebase?.apps) ? window.firebase.apps : [];
      const hasApp = apps.length > 0;
      if (!hasApp && (!cfg || !this.hasFirebaseConfig)) {
        console.error(
          "[teleconsulta] Error de Config: no existe app Firebase inicializada ni window.PPCCR_FIREBASE_CONFIG.",
        );
        this.setStatus("Error de Config: Firebase no esta configurado.", "error");
        this.setPlaceholder(
          "Error de Config",
          "Cargá /__/firebase/init.js (Hosting) o firebase-config.local.js.",
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
      if (this.chatEnabled) {
        this.subscribeChatRealtime();
      } else if (this.refs.chatRoot) {
        this.refs.chatRoot.hidden = true;
      }

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
                  ? /** @type {{online?: unknown, busy?: unknown, stationName?: unknown, name?: unknown, role?: unknown}} */ (value)
                  : {};

              nextPresence[normalizedId] = {
                online: Boolean(payload.online),
                busy: Boolean(payload.busy),
                stationName: String(payload.stationName || payload.name || "").trim(),
                role: normalizeRole(payload.role),
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
      if (!this.chatEnabled) return;
      this.clearChatRealtime();
      this.chatService
        .listen(
          (event) => {
            this.handleChatEvent(event);
          },
          (error) => {
            console.error("[teleconsulta] Chat listener error", error);
          },
        )
        .then((unsubscribe) => {
          this.unsubscribeChat = unsubscribe;
        })
        .catch((error) => {
          console.error("[teleconsulta] No se pudo iniciar chat.", error);
        });
    }

    /**
     * @param {{id: string, name: string}} station
     * @returns {Promise<void>}
     */
    async bindStationRealtime(station) {
      this.clearInboxListener();
      await this.firebase.setPresence(station, this.currentRole);
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
      this.chatService.stop();
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
        const role = this.getRoleForStation(station.id);
        const roleLabel = role === ROLE_MEDIC ? "Médico" : "Estación";
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
          <span class="telew-target__meta">${roleLabel}</span>
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

    /**
     * @returns {Promise<boolean>}
     */
    async unlockAudioTones() {
      try {
        await this.audioService.unlock();
        return true;
      } catch (error) {
        return false;
      }
    }

    loadChatAuthorForCurrentStation() {
      if (!this.currentStation) {
        this.setChatAuthorName("", { persist: false });
        return;
      }
      const storageKey = getChatAuthorStorageKey(this.currentStation.id);
      const saved = safeSessionGet(storageKey).trim() || safeLocalGet(storageKey).trim();
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
        safeSessionSet(getChatAuthorStorageKey(this.currentStation.id), normalized);
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
     * @param {any} event
     */
    handleChatEvent(event) {
      if (!event || !event.messageId) return;
      if (!["text", "call_request", "system"].includes(event.messageType)) return;
      this.chatMessageMap.set(event.messageId, event);
      const sorted = Array.from(this.chatMessageMap.values())
        .sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0))
        .slice(-CHAT_MAX_MESSAGES);
      this.chatMessages = sorted;
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
      const container = this.refs.chatLog;
      if (!(container instanceof HTMLElement)) return;
      const wasNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 36;
      container.innerHTML = "";

      if (!this.chatMessages.length) {
        const empty = document.createElement("p");
        empty.className = "telemsg__text";
        empty.textContent = "Sin mensajes todavía.";
        container.appendChild(empty);
        return;
      }

      this.chatMessages.forEach((message) => {
        const item = document.createElement("article");
        item.className = "telemsg";
        item.dataset.type = message.messageType;

        const meta = document.createElement("div");
        meta.className = "telemsg__meta";
        const author = document.createElement("span");
        author.className = "telemsg__author";
        const stationLabel =
          message.stationName || getStationById(message.stationId)?.name || "Estación";
        author.textContent = `${stationLabel} — ${message.authorName || "Operador"}`;
        const time = document.createElement("span");
        time.className = "telemsg__time";
        time.textContent = this.formatChatTime(message.ts);
        meta.append(author, time);
        item.appendChild(meta);

        const body = document.createElement("p");
        body.className = "telemsg__text";
        body.textContent =
          message.text ||
          (message.messageType === "call_request"
            ? "Solicitud de llamada."
            : "Mensaje del sistema.");
        item.appendChild(body);

        if (message.messageType === "call_request") {
          const actions = document.createElement("div");
          actions.className = "telemsg__actions";

          const badge = document.createElement("span");
          badge.className = "telemsg__badge";
          const currentRequestStatus = message.requestStatus || "pending";
          const isCalled = currentRequestStatus === "called";
          badge.dataset.state = isCalled ? "called" : "pending";
          badge.textContent = isCalled ? "Llamado" : "Pendiente";
          actions.appendChild(badge);

          const canCall =
            this.currentStation &&
            this.currentRole === ROLE_MEDIC &&
            message.stationId &&
            message.stationId !== this.currentStation.id &&
            (!message.targetId || message.targetId === this.currentStation.id) &&
            !isCalled;

          if (canCall) {
            const callBtn = document.createElement("button");
            callBtn.type = "button";
            callBtn.className = "telemsg__btn";
            callBtn.dataset.chatAction = "call-request";
            callBtn.dataset.messageId = message.messageId;
            callBtn.dataset.targetId = message.stationId;
            callBtn.textContent = "Llamar";
            actions.appendChild(callBtn);
          }

          if (isCalled) {
            const handledBy =
              message.handledByName ||
              getStationById(message.handledBy)?.name ||
              message.handledBy ||
              "otra estación";
            const handledAt = this.formatChatTime(message.handledAt);
            const calledInfo = document.createElement("span");
            calledInfo.className = "telemsg__badge";
            calledInfo.dataset.state = "called";
            calledInfo.textContent = `Llamado por ${handledBy} a ${handledAt}`;
            actions.appendChild(calledInfo);
          }

          item.appendChild(actions);
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
      if (!this.chatEnabled) return;
      const action = String(actionBtn.dataset.chatAction || "").trim();
      const messageId = String(actionBtn.dataset.messageId || "").trim();
      if (!action || !messageId || !this.currentStation || !this.firebaseReady) return;

      if (action === "call-request") {
        if (this.currentRole !== ROLE_MEDIC) return;
        const targetId = normalizeStationId(actionBtn.dataset.targetId);
        if (!targetId) return;
        const callId = await this.startOutgoingCallTo(targetId);
        if (!callId) return;
        await this.chatService.markHandled(messageId, this.currentStation);
        return;
      }
    }

    async sendChatTextMessage() {
      if (!this.chatEnabled) return;
      if (!this.currentStation || !this.firebaseReady) return;
      const now = Date.now();
      if (now - this.lastChatSendAt < CHAT_SEND_DEBOUNCE_MS) return;

      const authorName = this.getValidChatAuthorName();
      if (!authorName) {
        this.setStatus("Completá 'Tu nombre' para usar el chat.", "warn");
        this.refs.chatAuthorInput.focus();
        return;
      }

      const text = String(this.refs.chatTextInput.value || "").trim().slice(0, 500);
      if (!text) {
        this.setStatus("Escribí un mensaje para enviar.", "warn");
        this.refs.chatTextInput.focus();
        return;
      }

      this.lastChatSendAt = now;
      await this.chatService.sendText({
        fromStation: this.currentStation,
        author: authorName,
        text,
      });
      this.refs.chatTextInput.value = "";
      this.setStatus("Mensaje enviado.", "ok");
    }

    async sendChatCallRequest() {
      if (!this.chatEnabled) return;
      if (!this.currentStation || !this.firebaseReady) return;
      const now = Date.now();
      if (now - this.lastChatSendAt < CHAT_SEND_DEBOUNCE_MS) return;

      const authorName = this.getValidChatAuthorName();
      if (!authorName) {
        this.setStatus("Completá 'Tu nombre' para solicitar llamada.", "warn");
        this.refs.chatAuthorInput.focus();
        return;
      }

      const target = getStationById(this.selectedTargetId);
      this.lastChatSendAt = now;
      await this.chatService.sendCallRequest({
        fromStation: this.currentStation,
        author: authorName,
        targetId: target ? target.id : "",
      });
      this.setStatus("Solicitud de llamada publicada en chat.", "ok");
    }

    /**
     * @returns {Promise<void>}
     */
    async debugSimulateCallRequest() {
      if (!this.teleDebugEnabled || !this.currentStation || !this.firebaseReady) return;
      const source =
        STATIONS.find((station) => station.id !== this.currentStation.id) || null;
      if (!source) return;
      await this.firebase.createChatMessage({
        stationId: source.id,
        stationName: source.name,
        authorName: "Debug Bot",
        type: "call_request",
        text: "Solicito videollamada",
        targetId: this.currentStation.id,
        requestStatus: "pending",
      });
      this.setStatus("Debug: solicitud de llamada simulada.", "info");
    }

    /**
     * @returns {Promise<void>}
     */
    async debugSimulateBusy() {
      if (!this.teleDebugEnabled || !this.currentStation || !this.firebaseReady) return;
      if (this.debugBusyTimeoutId) {
        window.clearTimeout(this.debugBusyTimeoutId);
        this.debugBusyTimeoutId = 0;
      }
      this.debugForceBusyUntil = Date.now() + 30_000;
      this.setStatus("Debug: estado ocupado simulado por 30s.", "warn");
      this.syncOwnPresenceBusy();
      this.syncUI();
      this.debugBusyTimeoutId = window.setTimeout(() => {
        this.debugForceBusyUntil = 0;
        this.syncOwnPresenceBusy();
        this.syncUI();
      }, 30_000);
    }

    /**
     * @returns {Promise<void>}
     */
    async debugClearChat() {
      if (!this.teleDebugEnabled || !this.currentStation || !this.firebaseReady) return;
      await this.firebase.ref(getChatMessagesPath()).remove();
      this.chatMessageMap.clear();
      this.chatMessages = [];
      this.renderChatMessages();
      this.setStatus("Debug: chat vaciado.", "info");
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

    renderRoleAndPrefs() {
      const isStation = this.currentRole === ROLE_STATION;
      this.refs.roleStationBtn.setAttribute("aria-pressed", String(isStation));
      this.refs.roleMedicBtn.setAttribute("aria-pressed", String(!isStation));
      this.refs.openNewTabToggle.checked = Boolean(this.openInNewTab);
      this.refs.externalHint.hidden = !(
        this.openInNewTab &&
        (this.state === "outgoing" || this.state === "in-call")
      );
    }

    renderDebugTools() {
      if (!(this.refs.debugTools instanceof HTMLElement)) return;
      this.refs.debugTools.hidden = !this.teleDebugEnabled;
    }

    /**
     * @param {'station'|'medic'} role
     */
    setRole(role) {
      const nextRole = normalizeRole(role);
      if (nextRole === this.currentRole) {
        this.renderRoleAndPrefs();
        return;
      }
      this.currentRole = nextRole;
      safeLocalSet(STORAGE_KEYS.role, this.currentRole);
      this.renderRoleAndPrefs();
      if (this.firebaseReady && this.currentStation) {
        this.firebase
          .patchPresence(this.currentStation.id, {
            role: this.currentRole,
            stationName: this.currentStation.name,
          })
          .catch(() => {
            // no-op
          });
      }
      this.setStatus(
        this.currentRole === ROLE_MEDIC
          ? "Rol actual: Médico."
          : "Rol actual: Estación.",
        "info",
      );
      this.renderChatMessages();
      this.renderTargets();
      this.syncUI();
    }

    /**
     * @param {string | null | undefined} stationId
     * @returns {'station'|'medic'}
     */
    getRoleForStation(stationId) {
      const normalizedStationId = normalizeStationId(stationId);
      if (!normalizedStationId) return ROLE_STATION;
      if (this.currentStation && normalizedStationId === this.currentStation.id) {
        return this.currentRole;
      }
      const roleFromPresence = this.presenceById[normalizedStationId]?.role;
      return normalizeRole(roleFromPresence);
    }

    /**
     * @param {string} fromId
     * @param {string} toId
     * @param {'station'|'medic'} callerRole
     * @param {'station'|'medic'} targetRole
     * @returns {string}
     */
    computeHostId(fromId, toId, callerRole, targetRole) {
      if (callerRole === ROLE_MEDIC) return fromId;
      if (targetRole === ROLE_MEDIC) return toId;
      return fromId;
    }

    /**
     * @param {any} [call]
     * @returns {boolean}
     */
    isCurrentStationHost(call = this.activeCall) {
      if (!call || !this.currentStation) return false;
      const hostId = normalizeStationId(call.hostId);
      return Boolean(hostId && hostId === this.currentStation.id);
    }

    syncUI() {
      const canCall = this.canCallSelectedTarget();
      this.renderRoleAndPrefs();

      this.refs.callBtn.hidden = this.state !== "idle";
      this.refs.callBtn.disabled = !canCall;

      this.refs.hangupBtn.hidden = !(
        this.state === "outgoing" ||
        this.state === "in-call" ||
        this.state === "ending"
      );

      this.refs.controls.hidden = !(
        this.state === "in-call" &&
        this.jitsi.hasMeeting() &&
        !this.openInNewTab
      );
      this.refs.fullscreenBtn.disabled = !(
        this.state === "in-call" &&
        this.jitsi.hasMeeting() &&
        !this.openInNewTab
      );

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
      if (this.chatEnabled) {
        this.refs.chatAuthorInput.disabled = !this.currentStation;
        this.refs.chatTextInput.disabled = !canUseChat;
        this.refs.chatSendBtn.disabled = !canUseChat;
        this.refs.chatRequestBtn.disabled = !canUseChat;
        this.refs.debugRequestBtn.disabled = !canUseChat;
        this.refs.debugBusyBtn.disabled = !canUseChat;
        this.refs.debugClearChatBtn.disabled = !canUseChat;
      }

      this.syncOwnPresenceBusy();
      this.renderStatus();
    }

    syncOwnPresenceBusy() {
      if (!this.firebaseReady || !this.currentStation || this.presencePatchInFlight) return;

      const isBusy =
        this.state !== "idle" || Date.now() < Number(this.debugForceBusyUntil || 0);
      if (this.ownPresenceBusy === isBusy) return;

      this.presencePatchInFlight = true;
      this.firebase
        .patchPresence(this.currentStation.id, {
          busy: isBusy,
          role: this.currentRole,
          stationName: this.currentStation.name,
        })
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
     *  hostId: string,
     *  callerRole: 'station'|'medic',
     *  targetRole: 'station'|'medic',
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
       * hostId?: unknown,
       * callerRole?: unknown,
       * targetRole?: unknown,
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
      const hostId = normalizeStationId(call.hostId) || fromId;

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
        hostId,
        callerRole: normalizeRole(call.callerRole),
        targetRole: normalizeRole(call.targetRole),
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
        this.audioService.stop();
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

      if (activeSnapshot && activeSnapshot.status === "accepted") {
        if (!this.activeCall || this.activeCall.callId !== activeSnapshot.callId) {
          this.activeCall = {
            ...activeSnapshot,
            peerId: activeSnapshot.fromId,
            peerName: activeSnapshot.fromName,
            direction: "incoming",
            inboxStationId: myStationId,
          };
        }

        if (this.isCurrentStationHost(this.activeCall)) {
          if (!this.jitsi.hasMeeting()) {
            await this.mountActiveMeeting(this.opSeq, { signalInCallOnJoin: true });
          }
          if (this.state !== "in-call") {
            this.setStatus(`Conectando con ${this.activeCall.peerName}...`, "info");
          }
        } else {
          this.setStatus("Esperando al médico...", "info");
          this.setPlaceholder(
            "Esperando al médico",
            "El médico debe ingresar primero para habilitar la sala.",
          );
        }
        this.syncUI();
      }

      if (activeSnapshot && activeSnapshot.status === "in-call") {
        const op = this.opSeq;
        this.activeCall = {
          ...(this.activeCall || {}),
          ...activeSnapshot,
          peerId: activeSnapshot.fromId,
          peerName: activeSnapshot.fromName,
          direction: "incoming",
          inboxStationId: myStationId,
        };
        if (!this.jitsi.hasMeeting()) {
          await this.mountActiveMeeting(op, { signalInCallOnJoin: false });
        }
        if (!this.isOpCurrent(op)) return;
        this.state = "in-call";
        this.refs.fsLabel.textContent = `En llamada con ${this.activeCall.peerName}`;
        this.setStatus(`En llamada con ${this.activeCall.peerName}.`, "ok");
        this.syncUI();
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
            this.audioService.stop();
            this.audioService.notifyOnce().catch(() => {
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

      if (!this.chatEnabled || !this.currentStation || !this.firebaseReady) return;
      await Promise.allSettled([
        this.firebase.createChatMessage({
          stationId: call.fromId,
          stationName: call.fromName,
          authorName: call.fromName,
          type: "call_request",
          text: "Solicito videollamada",
          targetId: call.toId,
          requestStatus: "queued",
          callId,
        }),
        this.chatService.sendSystem({
          station: this.currentStation,
          text: `${call.fromName} llamó, quedó en cola.`,
          requestStatus: "queued",
          targetId: call.fromId,
          callId,
        }),
      ]);
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
      this.audioService.stop();
      await this.audioService.startIncoming();

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
        this.setStatus("Estación offline. No se puede iniciar la llamada.", "warn");
        return null;
      }
      await this.unlockAudioTones();

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
      const callerRole = this.currentRole;
      const targetRole = this.getRoleForStation(target.id);
      const hostId = this.computeHostId(
        this.currentStation.id,
        target.id,
        callerRole,
        targetRole,
      );

      const callPayload = {
        callId,
        room,
        fromId: this.currentStation.id,
        fromName: this.currentStation.name,
        toId: target.id,
        toName: target.name,
        hostId,
        callerRole,
        targetRole,
        status: "ringing",
        createdAt: this.firebase.getServerTimestamp(),
        updatedAt: this.firebase.getServerTimestamp(),
        acceptedAt: null,
        endedAt: null,
        reason: "",
      };

      await this.audioService.startRingback();
      this.state = "outgoing";
      this.setStatus(`Llamando a ${target.name}...`, "info");
      this.setPlaceholder("Llamada saliente", `Llamando a ${target.name}...`);
      this.closeIncomingModal();
      this.syncUI();

      try {
        await this.firebase.setCall(target.id, callId, callPayload);
      } catch (error) {
        if (!this.isOpCurrent(op)) return null;
        this.audioService.stop();
        this.activeCall = null;
        this.state = "idle";
        this.setStatus("No se pudo iniciar la llamada.", "error");
        this.setPlaceholder(
          "Teleconsulta",
          "Iniciá una llamada o esperá una entrante.",
        );
        this.syncUI();
        return null;
      }

      this.activeCall = {
        ...callPayload,
        peerId: target.id,
        peerName: target.name,
        direction: "outgoing",
        inboxStationId: target.id,
        hostId,
        callerRole,
        targetRole,
        hasJoinedConference: false,
        wasQueued: false,
      };

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
        this.audioService.stop();
        return null;
      }

      this.bindOutgoingWatch(target.id, callId);
      this.armOutgoingTimeout(callId, target.id, target.name);
      this.syncUI();
      return callId;
    }

    /**
     * @param {string} targetId
     * @param {string} callId
     */
    bindOutgoingWatch(targetId, callId) {
      this.clearOutgoingWatch();

      this.unsubscribeOutgoing = this.firebase.listenStationCalls(
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
        if (this.activeCall.wasQueued) return;

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

        this.audioService.stop();
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
          this.audioService.stop();
          await this.handleRemoteTerminalStatus("ended", {
            ...activeCall,
            fromName: activeCall.fromName || "",
            toName: activeCall.toName || "",
          });
        }
        return;
      }

      this.activeCall = {
        ...activeCall,
        ...parsed,
        peerId: parsed.toId,
        peerName: parsed.toName,
        direction: "outgoing",
        inboxStationId: parsed.toId,
        hasJoinedConference: Boolean(activeCall.hasJoinedConference),
        wasQueued: Boolean(activeCall.wasQueued),
      };

      if (parsed.status === "ringing") {
        if (!this.outgoingTimeoutId && !this.activeCall.wasQueued) {
          this.armOutgoingTimeout(callId, activeCall.peerId, activeCall.peerName);
        }
        this.setStatus(`Llamando a ${activeCall.peerName}...`, "info");
        return;
      }

      if (parsed.status === "queued") {
        this.clearOutgoingTimeout();
        this.activeCall.wasQueued = true;
        this.audioService.stop();
        await this.audioService.notifyOnce();
        this.setStatus("Destino ocupado, quedaste en cola.", "warn");
        this.setPlaceholder(
          "En cola",
          "Tu llamada sigue pendiente hasta que el médico pueda atender.",
        );
        return;
      }

      if (parsed.status === "accepted") {
        this.clearOutgoingTimeout();
        this.audioService.stop();

        if (this.state !== "outgoing") return;

        const op = this.opSeq;
        if (this.isCurrentStationHost(this.activeCall)) {
          this.setStatus(`Llamada aceptada. Ingresando a sala con ${activeCall.peerName}...`, "info");
          if (!this.jitsi.hasMeeting()) {
            await this.mountActiveMeeting(op, { signalInCallOnJoin: true });
          }
        } else {
          this.setStatus("Esperando al médico...", "info");
          this.setPlaceholder(
            "Esperando al médico",
            "El médico debe ingresar primero para habilitar la sala.",
          );
        }
        this.syncUI();
        return;
      }

      if (parsed.status === "in-call") {
        this.clearOutgoingTimeout();
        this.audioService.stop();

        const op = this.opSeq;
        if (!this.jitsi.hasMeeting()) {
          await this.mountActiveMeeting(op, { signalInCallOnJoin: false });
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
        this.audioService.stop();
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

      await this.unlockAudioTones();
      const call = this.activeCall;
      const op = this.beginOp();

      this.audioService.stop();
      this.closeIncomingModal();
      this.state = "outgoing";
      this.setStatus(`Aceptando llamada de ${call.peerName}...`, "info");

      try {
        await this.firebase.patchCall(this.currentStation.id, call.callId, {
          status: "accepted",
          acceptedAt: this.firebase.getServerTimestamp(),
        });
      } catch (error) {
        if (this.isOpCurrent(op)) {
          this.state = "incoming";
          this.openIncomingModal(call.peerName);
          this.setStatus("No se pudo aceptar la llamada.", "error");
          this.syncUI();
        }
        return;
      }

      if (!this.isOpCurrent(op) || !this.activeCall || this.activeCall.callId !== call.callId) {
        return;
      }

      if (this.isCurrentStationHost(call)) {
        await this.mountActiveMeeting(op, { signalInCallOnJoin: true });
        if (!this.isOpCurrent(op)) return;
        if (!this.activeCall || this.activeCall.callId !== call.callId) return;
        if (this.state !== "in-call") {
          this.setStatus(`Conectando con ${call.peerName}...`, "info");
        }
      } else {
        this.setStatus("Esperando al médico...", "info");
        this.setPlaceholder(
          "Esperando al médico",
          "El médico debe ingresar primero para habilitar la sala.",
        );
      }

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

      await this.unlockAudioTones();
      const call = this.activeCall;
      const op = this.beginOp();

      this.audioService.stop();
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
     * @returns {string}
     */
    getDisplayNameForMeeting() {
      const stationName = this.currentStation?.name || "Estación";
      const operatorName = String(this.chatAuthorName || "").trim();
      if (!operatorName) return stationName;
      if (operatorName.toLowerCase() === stationName.toLowerCase()) return stationName;
      return `${stationName} - ${operatorName}`;
    }

    /**
     * @param {string} roomName
     * @returns {string}
     */
    buildJitsiOpenUrl(roomName) {
      const safeRoom = encodeURIComponent(String(roomName || "").trim());
      return `https://${JITSI_DOMAIN}/${safeRoom}#config.prejoinPageEnabled=false&config.requireDisplayName=false`;
    }

    /**
     * @param {{inboxStationId?: string, callId?: string}} [call]
     * @returns {Promise<void>}
     */
    async patchCallInCall(call = this.activeCall) {
      if (!call || !this.firebaseReady) return;
      await this.firebase.patchCall(call.inboxStationId, call.callId, {
        status: "in-call",
        acceptedAt: this.firebase.getServerTimestamp(),
      });
    }

    /**
     * @param {number} op
     * @param {{signalInCallOnJoin?: boolean}} [options]
     * @returns {Promise<void>}
     */
    async mountActiveMeeting(op, options = {}) {
      const { signalInCallOnJoin = false } = options;
      const call = this.activeCall;
      const station = this.currentStation;

      if (!call || !station) return;

      if (this.openInNewTab) {
        const opened = window.open(this.buildJitsiOpenUrl(call.room), "_blank", "noopener,noreferrer");
        if (!opened) {
          throw new Error("No se pudo abrir la pestaña de Jitsi.");
        }
        this.refs.externalHint.hidden = false;
        this.setPlaceholder(
          "Llamada en pestaña",
          "La llamada se abrió en una pestaña. Volvé acá para colgar.",
        );
        if (signalInCallOnJoin && this.isCurrentStationHost(call)) {
          await this.patchCallInCall(call);
          this.state = "in-call";
          this.refs.fsLabel.textContent = `En llamada con ${call.peerName || "la estación destino"}`;
          this.setStatus(`En llamada con ${call.peerName || "la estación destino"}.`, "ok");
          this.syncUI();
        }
        return;
      }

      const parentNode = this.fullscreenOpen ? this.refs.fullscreenStage : this.refs.stage;
      this.jitsi.moveHost(parentNode);

      await this.jitsi.mountMeeting({
        roomName: call.room,
        displayName: this.getDisplayNameForMeeting(),
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
          const currentCall = this.activeCall;
          if (!currentCall || !this.firebaseReady) return;
          if (currentCall.callId !== call.callId) return;
          currentCall.hasJoinedConference = true;
          if (!signalInCallOnJoin) return;
          if (!this.isCurrentStationHost(currentCall)) return;
          this.patchCallInCall(currentCall).catch(() => {
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
      this.audioService.stop();
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
      this.audioService.stop();
      this.closeIncomingModal();
      await this.jitsi.disposeMeeting();

      if (call && call.inboxStationId && call.callId && this.firebaseReady) {
        this.deferCallCleanup(call.inboxStationId, call.callId);
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

      this.clearOutgoingWatch();
      this.clearInboxListener();
      this.clearGlobalRealtime();
      this.clearChatRealtime();
      if (this.debugBusyTimeoutId) {
        window.clearTimeout(this.debugBusyTimeoutId);
        this.debugBusyTimeoutId = 0;
      }
      this.debugForceBusyUntil = 0;

      this.audioService.stop();
      this.closeIncomingModal();
      this.closeFullscreen({ restoreFocus: false });

      await this.jitsi.disposeMeeting();
      await this.audioService.dispose();

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

  /*
   * Reglas RTDB recomendadas (ejemplo base):
   * {
   *   "rules": {
   *     "ppccr": {
   *       "teleconsulta": {
   *         ".read": "auth != null",
   *         ".write": "auth != null",
   *         "chat": {
   *           "messages": {
   *             "$id": {
   *               "text": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
   *               "authorName": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 40" }
   *             }
   *           }
   *         }
   *       }
   *     }
   *   }
   * }
   */

  /**
   * Inicializa teleconsulta embebida si el widget está presente.
   */
  function initTeleconsultaEmbed() {
    if (applyUrlOverridesIfNeeded()) {
      return;
    }

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
      soundUnlockBtn: document.getElementById("telewSoundUnlock"),
      roleStationBtn: document.getElementById("telewRoleStation"),
      roleMedicBtn: document.getElementById("telewRoleMedic"),
      openNewTabToggle: document.getElementById("telewOpenNewTab"),
      externalHint: document.getElementById("telewExternalHint"),
      chatRoot: document.getElementById("telewChat"),
      chatLog: document.getElementById("telewChatLog"),
      chatForm: document.getElementById("telewChatForm"),
      chatAuthorInput: document.getElementById("telewChatAuthor"),
      chatTextInput: document.getElementById("telewChatInput"),
      chatSendBtn: document.getElementById("telewChatSend"),
      chatRequestBtn: document.getElementById("telewChatRequestCall"),
      debugTools: document.getElementById("telewDebugTools"),
      debugRequestBtn: document.getElementById("telewDebugRequest"),
      debugBusyBtn: document.getElementById("telewDebugBusy"),
      debugClearChatBtn: document.getElementById("telewDebugClearChat"),
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
      refs.soundUnlockBtn,
      refs.roleStationBtn,
      refs.roleMedicBtn,
      refs.openNewTabToggle,
      refs.externalHint,
      refs.chatRoot,
      refs.chatLog,
      refs.chatForm,
      refs.chatAuthorInput,
      refs.chatTextInput,
      refs.chatSendBtn,
      refs.chatRequestBtn,
      refs.debugTools,
      refs.debugRequestBtn,
      refs.debugBusyBtn,
      refs.debugClearChatBtn,
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
