"use strict";

const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const jwt = require("jsonwebtoken");

if (!admin.apps.length) {
  admin.initializeApp();
}

const STAGE1_MIN_AGE = 45;
const PARTICIPANT_SEQUENCE_PADDING = 6;
const FIRESTORE_COUNTERS_COLLECTION = "ppccr_stage1_counters";
const FIRESTORE_RECORDS_COLLECTION = "ppccr_stage1_records";
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEET_ROW_RANGE_REGEX = /![A-Z]+(\d+):[A-Z]+(\d+)$/;

const SHEETS_SERVICE_ACCOUNT_EMAIL_SECRET = defineSecret(
  "PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL",
);
const SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY_SECRET = defineSecret(
  "PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
);
const SHEETS_STAGE1_SHEET_ID_SECRET = defineSecret("PPCCR_STAGE1_SHEET_ID");
const SHEETS_STAGE1_SHEET_TAB_SECRET = defineSecret("PPCCR_STAGE1_SHEET_TAB");

const SHEET_HEADERS = Object.freeze([
  "Fecha",
  "Numero de participante",
  "Tipo de Estacion Saludable",
  "Sexo",
  "Edad",
]);

const SHEET_HEADERS_A_TO_G = Object.freeze([
  "Fecha",
  "Numero de participante",
  "Tipo de Estacion Saludable",
  "Sexo",
  "Edad",
  "Resultado",
  "Etapa alcanzada",
]);

const STATIONS = Object.freeze([
  Object.freeze({
    stationId: "saavedra",
    stationName: "Parque Saavedra",
    stationCode: "SA",
    aliases: Object.freeze(["saavedra", "parque saavedra"]),
  }),
  Object.freeze({
    stationId: "aristobulo",
    stationName: "Aristóbulo del Valle",
    stationCode: "AR",
    aliases: Object.freeze(["aristobulo", "aristobulo del valle", "aristóbulo del valle"]),
  }),
  Object.freeze({
    stationId: "rivadavia",
    stationName: "Parque Rivadavia",
    stationCode: "RI",
    aliases: Object.freeze(["rivadavia", "parque rivadavia"]),
  }),
  Object.freeze({
    stationId: "chacabuco",
    stationName: "Parque Chacabuco",
    stationCode: "CH",
    aliases: Object.freeze(["chacabuco", "parque chacabuco"]),
  }),
]);

function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const STATION_INDEX = (() => {
  const map = new Map();

  STATIONS.forEach((station) => {
    const keys = new Set([
      station.stationId,
      station.stationName,
      station.stationCode,
      ...station.aliases,
    ]);

    keys.forEach((key) => {
      const normalized = foldText(key);
      if (!normalized) return;
      map.set(normalized, station);
    });
  });

  return map;
})();

const ALLOWED_STATIONS_TEXT = STATIONS.map((station) => station.stationName).join(", ");

function normalizeStation(value) {
  const normalized = foldText(value);
  if (!normalized) return null;

  const station = STATION_INDEX.get(normalized);
  if (!station) return null;

  return {
    stationId: station.stationId,
    stationName: station.stationName,
    stationCode: station.stationCode,
  };
}

function normalizeStationById(stationId) {
  const normalized = foldText(stationId);
  if (!normalized) return null;
  return normalizeStation(normalized);
}

function normalizeSex(value) {
  const normalized = foldText(value);
  if (normalized === "m" || normalized === "masculino") return "M";
  if (normalized === "f" || normalized === "femenino") return "F";
  if (normalized === "o" || normalized === "otro" || normalized === "otros") return "OTROS";
  return "";
}

function formatDateForSheet(date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(",", "");
}

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function parseJsonBody(req) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return {};
}

function getSecretOrEnv(secretParam, fallbackEnvKey = "") {
  const fromSecret = String(secretParam?.value?.() || "").trim();
  if (fromSecret) return fromSecret;
  if (!fallbackEnvKey) return "";
  return String(process.env[fallbackEnvKey] || "").trim();
}

function getSheetsConfig() {
  const sheetId = getSecretOrEnv(SHEETS_STAGE1_SHEET_ID_SECRET, "PPCCR_STAGE1_SHEET_ID");
  const sheetTab =
    getSecretOrEnv(SHEETS_STAGE1_SHEET_TAB_SECRET, "PPCCR_STAGE1_SHEET_TAB") || "Etapa1";
  const serviceAccountEmail = getSecretOrEnv(
    SHEETS_SERVICE_ACCOUNT_EMAIL_SECRET,
    "PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL",
  );
  const serviceAccountKeyRaw = getSecretOrEnv(
    SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY_SECRET,
    "PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  );
  const serviceAccountKey = serviceAccountKeyRaw.replace(/\\n/g, "\n");

  return {
    sheetId,
    sheetTab,
    serviceAccountEmail,
    serviceAccountKey,
  };
}

function formatParticipantNumber(stationCode, participantSequence) {
  return `${stationCode}-${String(participantSequence).padStart(PARTICIPANT_SEQUENCE_PADDING, "0")}`;
}

async function allocateAndPersistStage1Tx(station, stage1RecordBase) {
  const db = admin.firestore();
  const countersRef = db.collection(FIRESTORE_COUNTERS_COLLECTION).doc(station.stationId);
  const recordRef = db.collection(FIRESTORE_RECORDS_COLLECTION).doc();

  let allocation = null;

  await db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(countersRef);
    const rawLastSequence = counterSnap.exists ? Number(counterSnap.get("lastSequence")) : 0;
    const lastSequence =
      Number.isFinite(rawLastSequence) && rawLastSequence > 0 ? Math.floor(rawLastSequence) : 0;

    const participantSequence = lastSequence + 1;
    const participantNumber = formatParticipantNumber(station.stationCode, participantSequence);

    transaction.set(
      countersRef,
      {
        stationId: station.stationId,
        stationName: station.stationName,
        stationCode: station.stationCode,
        lastSequence: participantSequence,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    transaction.set(recordRef, {
      ...stage1RecordBase,
      stationId: station.stationId,
      stationName: station.stationName,
      stationCode: station.stationCode,
      participantNumber,
      participantSequence,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    allocation = {
      participantNumber,
      participantSequence,
      recordId: recordRef.id,
    };
  });

  if (!allocation) {
    throw new Error("No se pudo asignar numero de participante en Firestore.");
  }

  return allocation;
}

async function reserveParticipantNumberTx(station) {
  const db = admin.firestore();
  const countersRef = db.collection(FIRESTORE_COUNTERS_COLLECTION).doc(station.stationId);

  let allocation = null;
  await db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(countersRef);
    const rawLastSequence = counterSnap.exists ? Number(counterSnap.get("lastSequence")) : 0;
    const lastSequence =
      Number.isFinite(rawLastSequence) && rawLastSequence > 0 ? Math.floor(rawLastSequence) : 0;

    const participantSequence = lastSequence + 1;
    const participantNumber = formatParticipantNumber(station.stationCode, participantSequence);

    transaction.set(
      countersRef,
      {
        stationId: station.stationId,
        stationName: station.stationName,
        stationCode: station.stationCode,
        lastSequence: participantSequence,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    allocation = {
      participantNumber,
      participantSequence,
      stationId: station.stationId,
      stationCode: station.stationCode,
    };
  });

  if (!allocation) {
    throw new Error("No se pudo reservar numero de participante.");
  }
  return allocation;
}

function parseSheetRowFromUpdatedRange(updatedRange) {
  const range = String(updatedRange || "").trim();
  if (!range) return null;
  const match = range.match(SHEET_ROW_RANGE_REGEX);
  if (!match) return null;
  const row = Number.parseInt(match[1], 10);
  if (!Number.isFinite(row) || row < 2) return null;
  return row;
}

function buildSheetRowAtoG(record) {
  return [
    record.fecha || "",
    record.participantNumber || "",
    record.stationName || "",
    record.sex || "",
    Number.isFinite(record.age) ? record.age : "",
    record.outcome || "",
    Number.isFinite(record.stageReached) ? record.stageReached : "",
  ];
}

async function getGoogleAccessToken(serviceAccountEmail, privateKey) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: issuedAt,
      exp: issuedAt + 3600,
    },
    privateKey,
    { algorithm: "RS256" },
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`No se pudo obtener token de Google: ${response.status} ${bodyText}`);
  }

  const tokenPayload = await response.json();
  if (!tokenPayload?.access_token) {
    throw new Error("Respuesta invalida al obtener token de Google.");
  }

  return tokenPayload.access_token;
}

async function googleSheetsRequest({ method, url, accessToken, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Google Sheets API ${response.status}: ${bodyText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function ensureSheetHeaders(sheetId, sheetTab, accessToken) {
  const headerRange = `${sheetTab}!A1:E1`;
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(headerRange)}`;

  const getResponse = await googleSheetsRequest({
    method: "GET",
    url: getUrl,
    accessToken,
  });

  const current = Array.isArray(getResponse?.values?.[0]) ? getResponse.values[0] : [];
  const hasHeaders = SHEET_HEADERS.every((header, index) => current[index] === header);
  if (hasHeaders) return;

  const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=RAW`;
  await googleSheetsRequest({
    method: "PUT",
    url: putUrl,
    accessToken,
    body: {
      range: headerRange,
      majorDimension: "ROWS",
      values: [SHEET_HEADERS],
    },
  });
}

async function appendToGoogleSheets(record) {
  const { sheetId, sheetTab, serviceAccountEmail, serviceAccountKey } = getSheetsConfig();

  if (!sheetId || !serviceAccountEmail || !serviceAccountKey) {
    return { status: "not_configured" };
  }

  const accessToken = await getGoogleAccessToken(serviceAccountEmail, serviceAccountKey);
  await ensureSheetHeaders(sheetId, sheetTab, accessToken);

  const appendRange = `${sheetTab}!A:E`;
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  await googleSheetsRequest({
    method: "POST",
    url: appendUrl,
    accessToken,
    body: {
      majorDimension: "ROWS",
      values: [[record.fecha, record.participantNumber, record.stationName, record.sex, record.age]],
    },
  });

  return { status: "saved" };
}

exports.submitAlgorithmStage1 = onRequest({ region: "us-central1" }, async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      ok: false,
      message: "Metodo no permitido. Usar POST.",
    });
    return;
  }

  let payload;
  try {
    payload = parseJsonBody(req);
  } catch (_error) {
    res.status(400).json({
      ok: false,
      message: "JSON invalido.",
    });
    return;
  }

  const sex = normalizeSex(payload.sex);
  if (!sex) {
    res.status(400).json({
      ok: false,
      message: "Sexo invalido. Valores permitidos: M, F, OTROS.",
    });
    return;
  }

  const station = normalizeStation(payload.stationName);
  if (!station) {
    res.status(400).json({
      ok: false,
      message: `Estacion invalida. Valores permitidos: ${ALLOWED_STATIONS_TEXT}.`,
    });
    return;
  }

  const age = Number.parseInt(String(payload.age || "").trim(), 10);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    res.status(400).json({
      ok: false,
      message: "Edad invalida. Debe estar entre 0 y 120.",
    });
    return;
  }

  const now = new Date();
  const ageMeetsInclusion = age >= STAGE1_MIN_AGE;
  const outcome = ageMeetsInclusion ? "cumple_criterio_edad" : "sin_criterio_inclusion_edad";

  const stage1RecordBase = {
    fecha: formatDateForSheet(now),
    submittedAtIso: now.toISOString(),
    sex,
    age,
    criterionAge: STAGE1_MIN_AGE,
    ageMeetsInclusion,
    outcome,
    stageReached: ageMeetsInclusion ? 2 : 1,
    source: String(payload.source || "home").trim() || "home",
  };

  let allocation;
  try {
    allocation = await allocateAndPersistStage1Tx(station, stage1RecordBase);
  } catch (error) {
    logger.error("No se pudo guardar Etapa 1 en Firestore.", error);
    res.status(500).json({
      ok: false,
      message: "No se pudo guardar la Etapa 1 en Firestore. Reintenta.",
      firestore: {
        status: "error",
        message: "No se pudo guardar en Firestore.",
      },
      backup: {
        status: "error",
        message: "No se pudo guardar en Firestore.",
      },
      sheets: { status: "error" },
    });
    return;
  }

  const stage1Record = {
    ...stage1RecordBase,
    stationId: station.stationId,
    stationName: station.stationName,
    stationCode: station.stationCode,
    participantNumber: allocation.participantNumber,
    participantSequence: allocation.participantSequence,
  };

  let sheets = { status: "error" };
  try {
    sheets = await appendToGoogleSheets(stage1Record);
  } catch (error) {
    logger.error("No se pudo guardar Etapa 1 en Google Sheets.", error);
    sheets = {
      status: "error",
      message: "No se pudo guardar en Google Sheets.",
    };
  }

  const firestore = {
    status: "saved",
    id: allocation.recordId,
  };

  logger.info("Etapa 1 guardada.", {
    stationId: station.stationId,
    participantNumber: allocation.participantNumber,
    recordId: allocation.recordId,
    sheetsStatus: sheets.status,
  });

  res.status(200).json({
    ok: true,
    participantNumber: allocation.participantNumber,
    participantSequence: allocation.participantSequence,
    stationId: station.stationId,
    stationCode: station.stationCode,
    outcome,
    nextStep: ageMeetsInclusion ? 2 : 1,
    firestore,
    backup: firestore,
    sheets,
  });
});
