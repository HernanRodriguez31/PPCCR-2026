"use strict";

const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const jwt = require("jsonwebtoken");

if (!admin.apps.length) {
  admin.initializeApp();
}

const STAGE1_MIN_AGE = 45;
const SHEET_HEADERS = Object.freeze([
  "Fecha",
  "Numero de participante",
  "Tipo de Estacion Saludable",
  "Sexo",
  "Edad",
]);

function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeStationName(value) {
  const normalized = foldText(value);
  const byKey = {
    "parque saavedra": "Parque Saavedra",
    saavedra: "Parque Saavedra",
    "parque rivadavia": "Parque Rivadavia",
    rivadavia: "Parque Rivadavia",
    "parque chacabuco": "Parque Chacabuco",
    chacabuco: "Parque Chacabuco",
    "aristobulo del valle": "Aristóbulo del Valle",
    aristobulo: "Aristóbulo del Valle",
  };
  return byKey[normalized] || "";
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
    throw new Error("Respuesta inválida al obtener token de Google.");
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
  const sheetId = String(process.env.PPCCR_STAGE1_SHEET_ID || "").trim();
  const sheetTab = String(process.env.PPCCR_STAGE1_SHEET_TAB || "Etapa1").trim();
  const serviceAccountEmail = String(
    process.env.PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  ).trim();
  const serviceAccountKeyRaw = String(
    process.env.PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "",
  ).trim();
  const serviceAccountKey = serviceAccountKeyRaw.replace(/\\n/g, "\n");

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
      values: [
        [
          record.fecha,
          record.participantNumber,
          record.stationName,
          record.sex,
          record.age,
        ],
      ],
    },
  });

  return { status: "saved" };
}

async function saveStage1Backup(record) {
  const ref = admin.database().ref("algoritmo_toma_decision/etapa1").push();
  await ref.set({
    ...record,
    savedAt: admin.database.ServerValue.TIMESTAMP,
  });
  return {
    status: "saved",
    id: ref.key,
  };
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
      message: "Método no permitido. Usar POST.",
    });
    return;
  }

  let payload;
  try {
    payload = parseJsonBody(req);
  } catch (_error) {
    res.status(400).json({
      ok: false,
      message: "JSON inválido.",
    });
    return;
  }

  const participantNumber = String(payload.participantNumber || "")
    .replace(/\D+/g, "")
    .trim();
  if (!/^\d{1,24}$/.test(participantNumber)) {
    res.status(400).json({
      ok: false,
      message: "Número de participante inválido.",
    });
    return;
  }

  const sex = normalizeSex(payload.sex);
  if (!sex) {
    res.status(400).json({
      ok: false,
      message: "Sexo inválido. Valores permitidos: M, F, OTROS.",
    });
    return;
  }

  const stationName = normalizeStationName(payload.stationName);
  if (!stationName) {
    res.status(400).json({
      ok: false,
      message:
        "Estación inválida. Valores permitidos: Parque Saavedra, Parque Rivadavia, Parque Chacabuco, Aristóbulo del Valle.",
    });
    return;
  }

  const age = Number.parseInt(String(payload.age || "").trim(), 10);
  if (!Number.isFinite(age) || age < 0 || age > 120) {
    res.status(400).json({
      ok: false,
      message: "Edad inválida. Debe estar entre 0 y 120.",
    });
    return;
  }

  const now = new Date();
  const ageMeetsInclusion = age >= STAGE1_MIN_AGE;
  const outcome = ageMeetsInclusion
    ? "cumple_criterio_edad"
    : "sin_criterio_inclusion_edad";

  const stage1Record = {
    fecha: formatDateForSheet(now),
    submittedAtIso: now.toISOString(),
    participantNumber,
    stationName,
    sex,
    age,
    criterionAge: STAGE1_MIN_AGE,
    ageMeetsInclusion,
    outcome,
    stageReached: ageMeetsInclusion ? 2 : 1,
    source: String(payload.source || "home").trim() || "home",
  };

  let backup = { status: "error" };
  let sheets = { status: "error" };

  try {
    backup = await saveStage1Backup(stage1Record);
  } catch (error) {
    logger.error("No se pudo guardar respaldo Firebase de Etapa 1.", error);
    backup = {
      status: "error",
      message: "No se pudo guardar respaldo Firebase.",
    };
  }

  try {
    sheets = await appendToGoogleSheets(stage1Record);
  } catch (error) {
    logger.error("No se pudo guardar Etapa 1 en Google Sheets.", error);
    sheets = {
      status: "error",
      message: "No se pudo guardar en Google Sheets.",
    };
  }

  if (backup.status !== "saved" && sheets.status !== "saved") {
    res.status(500).json({
      ok: false,
      message:
        "No se pudo guardar la Etapa 1 en Google Sheets ni en Firebase. Reintentá.",
      backup,
      sheets,
    });
    return;
  }

  res.status(200).json({
    ok: true,
    outcome,
    nextStep: ageMeetsInclusion ? 2 : 1,
    backup,
    sheets,
  });
});
