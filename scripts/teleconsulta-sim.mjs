#!/usr/bin/env node

import process from "node:process";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ppccr-2026";
const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://ppccr-2026-default-rtdb.firebaseio.com";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Falta GOOGLE_APPLICATION_CREDENTIALS con la ruta al service account JSON.");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
});

const db = getDatabase();

const ROOT = "ppccr/teleconsulta";
const PATHS = {
  presence: `${ROOT}/presence`,
  calls: `${ROOT}/calls`,
  chatMessages: `${ROOT}/chat/global/messages`,
};

const STATIONS = {
  saavedra: { id: "saavedra", name: "Parque Saavedra" },
  rivadavia: { id: "rivadavia", name: "Parque Rivadavia" },
  admin: { id: "admin", name: "Administrador" },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildCall(fromStation, toStation) {
  const callId = `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
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
    acceptedAt: null,
    endedAt: null,
    reason: "",
  };
}

async function setPresence(station, online, busy = false) {
  await db.ref(`${PATHS.presence}/${station.id}`).set({
    online,
    busy,
    name: station.name,
    ts: Date.now(),
  });
}

async function patchPresence(station, patch) {
  await db.ref(`${PATHS.presence}/${station.id}`).update({
    ...patch,
    ts: Date.now(),
  });
}

async function createCall(call) {
  await db.ref(`${PATHS.calls}/${call.toId}/${call.callId}`).set(call);
}

async function patchCall(toStationId, callId, patch) {
  await db.ref(`${PATHS.calls}/${toStationId}/${callId}`).update({
    ...patch,
    updatedAt: Date.now(),
  });
}

async function removeCall(toStationId, callId) {
  await db.ref(`${PATHS.calls}/${toStationId}/${callId}`).remove();
}

async function publishCallQueueMessage(call) {
  await db.ref(PATHS.chatMessages).push({
    ts: Date.now(),
    stationId: call.toId,
    stationName: call.toName,
    authorName: "Bot Cola",
    type: "call_queue",
    text: `${call.fromName} quedó en cola para ${call.toName}.`,
    request: {
      fromStationId: call.fromId,
      fromStationName: call.fromName,
      toStationId: call.toId,
      toStationName: call.toName,
      status: "pending",
      calledByStationId: "",
      calledAt: 0,
      callId: call.callId,
    },
  });
}

async function runSimulation() {
  console.log("[SIM] Inicializando presencia de bots...");
  await Promise.all([
    setPresence(STATIONS.saavedra, true, false),
    setPresence(STATIONS.rivadavia, true, false),
    setPresence(STATIONS.admin, true, false),
  ]);

  console.log("[SIM] Host activo: admin");

  console.log("[SIM] Paso 1: saavedra llama a admin");
  const firstCall = buildCall(STATIONS.saavedra, STATIONS.admin);
  await createCall(firstCall);

  await wait(1200);
  console.log("[SIM] admin acepta llamada #1");
  await patchCall(STATIONS.admin.id, firstCall.callId, {
    status: "accepted",
    acceptedAt: Date.now(),
  });
  await wait(500);
  await patchCall(STATIONS.admin.id, firstCall.callId, {
    status: "in-call",
  });
  await patchPresence(STATIONS.admin, { busy: true });

  await wait(1800);
  console.log("[SIM] Paso 2: rivadavia llama a admin durante llamada activa");
  const secondCall = buildCall(STATIONS.rivadavia, STATIONS.admin);
  await createCall(secondCall);

  console.log("[SIM] admin ocupado -> llamada #2 pasa a queued + chat call_queue");
  await patchCall(STATIONS.admin.id, secondCall.callId, {
    status: "queued",
    reason: "receiver_busy",
  });
  await publishCallQueueMessage(secondCall);

  await wait(10_000);
  console.log("[SIM] Finaliza llamada #1");
  await patchCall(STATIONS.admin.id, firstCall.callId, {
    status: "ended",
    endedAt: Date.now(),
    reason: "sim_flow_finished",
  });
  await wait(1200);
  await removeCall(STATIONS.admin.id, firstCall.callId);

  await patchPresence(STATIONS.admin, { busy: false });

  await wait(1200);
  console.log("[SIM] Paso 3: admin atiende llamada en cola #2");
  await patchCall(STATIONS.admin.id, secondCall.callId, {
    status: "accepted",
    acceptedAt: Date.now(),
  });
  await wait(500);
  await patchCall(STATIONS.admin.id, secondCall.callId, {
    status: "in-call",
  });
  await patchPresence(STATIONS.admin, { busy: true });

  await wait(8_000);
  console.log("[SIM] Finaliza llamada #2");
  await patchCall(STATIONS.admin.id, secondCall.callId, {
    status: "ended",
    endedAt: Date.now(),
    reason: "sim_flow_finished",
  });
  await wait(1200);
  await removeCall(STATIONS.admin.id, secondCall.callId);
  await patchPresence(STATIONS.admin, { busy: false });

  await wait(800);
  console.log("[SIM] Cerrando presencia de bots");
  await Promise.all([
    setPresence(STATIONS.saavedra, false, false),
    setPresence(STATIONS.rivadavia, false, false),
    setPresence(STATIONS.admin, false, false),
  ]);

  console.log("[SIM] OK: flujo completado.");
}

runSimulation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[SIM] Error:", error);
    process.exit(1);
  });
