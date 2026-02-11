"use strict";

(() => {
  const LOG_EL = document.getElementById("simLog");
  const RUN_BTN = document.getElementById("simRun");
  const CLEAR_BTN = document.getElementById("simClear");

  const DB_ROOT = "ppccr/teleconsulta";
  const PATHS = {
    calls: `${DB_ROOT}/calls`,
    chat: `${DB_ROOT}/chat/messages`,
    presence: `${DB_ROOT}/presence`,
  };

  const LIVE_CALL_STATUSES = new Set(["ringing", "accepted", "in-call"]);
  const STATIONS = {
    a: { id: "saavedra", name: "Parque Saavedra" },
    b: { id: "rivadavia", name: "Parque Rivadavia" },
    c: { id: "admin", name: "Administrador" },
  };

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function log(message) {
    const ts = new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    LOG_EL.textContent += `[${ts}] ${message}\n`;
    LOG_EL.scrollTop = LOG_EL.scrollHeight;
  }

  function getConfig() {
    return (
      window.PPCCR_FIREBASE_CONFIG ||
      window.firebaseConfig ||
      window.FIREBASE_CONFIG ||
      null
    );
  }

  async function createClient(appName, station) {
    const cfg = getConfig();
    if (!cfg) throw new Error("Falta window.PPCCR_FIREBASE_CONFIG para el simulador.");

    const app = firebase.apps.find((item) => item.name === appName)
      ? firebase.app(appName)
      : firebase.initializeApp(cfg, appName);

    const auth = firebase.auth(app);
    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }

    return {
      appName,
      station,
      app,
      auth,
      db: firebase.database(app),
    };
  }

  function buildCall(fromStation, toStation) {
    const callId = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    return {
      callId,
      fromId: fromStation.id,
      fromName: fromStation.name,
      toId: toStation.id,
      toName: toStation.name,
      room: `PPCCR_2026_P2P_${callId}_${fromStation.id}_${toStation.id}`,
      status: "ringing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      acceptedAt: 0,
      endedAt: 0,
      reason: "",
    };
  }

  async function setPresence(client, online, busy) {
    await client.db.ref(`${PATHS.presence}/${client.station.id}`).set({
      online,
      busy,
      name: client.station.name,
      ts: Date.now(),
    });
  }

  async function patchCallSlot(client, stationId, callId, patch) {
    const ref = client.db.ref(`${PATHS.calls}/${stationId}`);
    await ref.transaction((current) => {
      if (!current || typeof current !== "object") return current;
      if (String(current.callId || "") !== String(callId)) return current;
      return {
        ...current,
        ...patch,
        updatedAt: Date.now(),
      };
    });
  }

  async function trySetCallSlot(client, stationId, callPayload) {
    const ref = client.db.ref(`${PATHS.calls}/${stationId}`);
    return new Promise((resolve, reject) => {
      ref.transaction(
        (current) => {
          const status = String(current?.status || "").toLowerCase();
          if (current && LIVE_CALL_STATUSES.has(status)) {
            return;
          }
          return callPayload;
        },
        (error, committed, snapshot) => {
          if (error) {
            reject(error);
            return;
          }
          resolve({ committed, current: snapshot?.val() || null });
        },
        false,
      );
    });
  }

  async function pushCallRequest(client, fromStation, targetId) {
    const ref = client.db.ref(PATHS.chat).push();
    await ref.set({
      ts: Date.now(),
      stationId: fromStation.id,
      stationName: fromStation.name,
      authorName: fromStation.name,
      type: "call_request",
      text: "Solicito videollamada",
      targetId,
      requestStatus: "pending",
    });
    return ref.key || "";
  }

  async function runSimulation() {
    RUN_BTN.disabled = true;

    const clientA = await createClient("simA", STATIONS.a);
    const clientB = await createClient("simB", STATIONS.b);
    const clientC = await createClient("simC", STATIONS.c);

    try {
      log("Inicializando presencia de A/B/C...");
      await Promise.all([
        setPresence(clientA, true, false),
        setPresence(clientB, true, false),
        setPresence(clientC, true, false),
      ]);

      await clientA.db.ref(PATHS.chat).remove();
      await clientA.db.ref(`${PATHS.calls}/${STATIONS.b.id}`).remove();

      log("Paso 1: A intenta llamar a B...");
      const callAB = buildCall(STATIONS.a, STATIONS.b);
      const txAB = await trySetCallSlot(clientA, STATIONS.b.id, callAB);
      if (!txAB.committed) {
        throw new Error("A->B no pudo iniciar llamada; la prueba no puede continuar.");
      }
      log(`OK: A->B committed callId=${callAB.callId}`);

      await wait(2000);
      log("Paso 2: B acepta la llamada A->B...");
      await patchCallSlot(clientB, STATIONS.b.id, callAB.callId, {
        status: "accepted",
        acceptedAt: Date.now(),
      });
      await setPresence(clientB, true, true);
      log("OK: B en estado accepted/busy.");

      await wait(500);
      log("Paso 3: C intenta llamar a B mientras B está ocupado...");
      const callCB = buildCall(STATIONS.c, STATIONS.b);
      const txCB = await trySetCallSlot(clientC, STATIONS.b.id, callCB);

      if (txCB.committed) {
        throw new Error("ERROR: C->B no debía commitear mientras B está ocupado.");
      }
      log("OK: C->B commit=false por slot ocupado.");

      const reqId = await pushCallRequest(clientC, STATIONS.c, STATIONS.b.id);
      log(`OK: call_request publicado en chat messageId=${reqId}`);

      const chatSnap = await clientA.db
        .ref(PATHS.chat)
        .orderByChild("targetId")
        .equalTo(STATIONS.b.id)
        .once("value");
      const hasQueuedRequest = chatSnap.exists();
      log(
        hasQueuedRequest
          ? "VALIDACIÓN: Existe call_request con targetId='rivadavia' (B)."
          : "VALIDACIÓN FALLIDA: No se encontró call_request para B.",
      );

      if (!hasQueuedRequest) {
        throw new Error("No se detectó call_request de cola para B.");
      }

      log("Resultado final: SIM OK");
    } finally {
      await Promise.allSettled([
        setPresence(clientA, false, false),
        setPresence(clientB, false, false),
        setPresence(clientC, false, false),
      ]);
      RUN_BTN.disabled = false;
    }
  }

  RUN_BTN.addEventListener("click", () => {
    runSimulation().catch((error) => {
      log(`SIM ERROR: ${error.message || error}`);
      console.error(error);
      RUN_BTN.disabled = false;
    });
  });

  CLEAR_BTN.addEventListener("click", () => {
    LOG_EL.textContent = "";
  });

  log("Listo para simular. Presioná 'Ejecutar simulación'.");
})();
