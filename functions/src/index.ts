import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import jwt from "jsonwebtoken";

if (!admin.apps.length) {
  admin.initializeApp();
}

const STAGE1_MIN_AGE = 45;
const PARTICIPANT_SEQUENCE_PADDING = 6;
const FIRESTORE_COUNTERS_COLLECTION = "ppccr_stage1_counters";
const FIRESTORE_RECORDS_COLLECTION = "ppccr_stage1_records";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
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

const SHEETS_SECRETS = [
  SHEETS_SERVICE_ACCOUNT_EMAIL_SECRET,
  SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY_SECRET,
  SHEETS_STAGE1_SHEET_ID_SECRET,
  SHEETS_STAGE1_SHEET_TAB_SECRET,
] as const;

const SHEET_HEADERS_A_TO_G = Object.freeze([
  "Fecha",
  "Numero de participante",
  "Tipo de Estacion Saludable",
  "Sexo",
  "Edad",
  "Resultado",
  "Etapa alcanzada",
]);

type StationDefinition = {
  stationId: string;
  stationName: string;
  stationCode: string;
  aliases: readonly string[];
};

type NormalizedStation = Pick<StationDefinition, "stationId" | "stationName" | "stationCode">;

type Stage1RecordBase = {
  fecha: string;
  submittedAtIso: string;
  sex: string;
  age: number;
  criterionAge: number;
  ageMeetsInclusion: boolean;
  outcome: string;
  stageReached: number;
  source: string;
};

type Stage1Record = Stage1RecordBase &
  NormalizedStation & {
    participantNumber: string;
    participantSequence: number;
  };

type ParticipantAllocation = {
  participantNumber: string;
  participantSequence: number;
  recordId: string;
};

type ParticipantReservation = {
  participantNumber: string;
  participantSequence: number;
  stationId: string;
  stationCode: string;
};

type SheetsConfig = {
  sheetId: string;
  sheetTab: string;
  serviceAccountEmail: string;
  serviceAccountKey: string;
};

type SheetsStatus = "saved" | "error" | "not_configured";

type SheetsResult = {
  status: SheetsStatus;
  message?: string;
  row?: number;
};

const STATIONS = Object.freeze<readonly StationDefinition[]>([
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

function foldText(value: unknown): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const STATION_INDEX = (() => {
  const map = new Map<string, StationDefinition>();

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

function normalizeStation(value: unknown): NormalizedStation | null {
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

function normalizeStationById(stationId: unknown): NormalizedStation | null {
  const normalized = foldText(stationId);
  if (!normalized) return null;
  return normalizeStation(normalized);
}

function normalizeSex(value: unknown): string {
  const normalized = foldText(value);
  if (normalized === "m" || normalized === "masculino") return "M";
  if (normalized === "f" || normalized === "femenino") return "F";
  if (normalized === "o" || normalized === "otro" || normalized === "otros") return "OTROS";
  return "";
}

function formatDateForSheet(date: Date): string {
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

function setCorsHeaders(res: { set: (key: string, value: string) => void }): void {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function parseJsonBody(req: { body?: unknown }): Record<string, unknown> {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }

  return {};
}

function getSecretOrEnv(secretParam: { value?: () => string } | null, fallbackEnvKey = ""): string {
  const fromSecret = String(secretParam?.value?.() || "").trim();
  if (fromSecret) return fromSecret;
  if (!fallbackEnvKey) return "";
  return String(process.env[fallbackEnvKey] || "").trim();
}

function getSheetsConfig(): SheetsConfig {
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

  return {
    sheetId,
    sheetTab,
    serviceAccountEmail,
    serviceAccountKey: serviceAccountKeyRaw.replace(/\\n/g, "\n"),
  };
}

function formatParticipantNumber(stationCode: string, participantSequence: number): string {
  return `${stationCode}-${String(participantSequence).padStart(PARTICIPANT_SEQUENCE_PADDING, "0")}`;
}

async function allocateAndPersistStage1Tx(
  station: NormalizedStation,
  stage1RecordBase: Stage1RecordBase,
): Promise<ParticipantAllocation> {
  const db = admin.firestore();
  const countersRef = db.collection(FIRESTORE_COUNTERS_COLLECTION).doc(station.stationId);
  const recordRef = db.collection(FIRESTORE_RECORDS_COLLECTION).doc();

  let allocation: ParticipantAllocation | null = null;

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

async function reserveParticipantNumberTx(station: NormalizedStation): Promise<ParticipantReservation> {
  const db = admin.firestore();
  const countersRef = db.collection(FIRESTORE_COUNTERS_COLLECTION).doc(station.stationId);

  let allocation: ParticipantReservation | null = null;

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

function parseSheetRowFromUpdatedRange(updatedRange: string | null | undefined): number | null {
  const range = String(updatedRange || "").trim();
  if (!range) return null;

  const match = range.match(SHEET_ROW_RANGE_REGEX);
  if (!match) return null;

  const row = Number.parseInt(match[1], 10);
  if (!Number.isFinite(row) || row < 2) return null;

  return row;
}

function asPositiveRow(value: unknown): number | null {
  const row = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(row) || row < 2) return null;
  return row;
}

function buildSheetRowAtoG(record: Partial<Stage1Record>): Array<string | number> {
  return [
    String(record.fecha || ""),
    String(record.participantNumber || ""),
    String(record.stationName || ""),
    String(record.sex || ""),
    Number.isFinite(record.age) ? (record.age as number) : "",
    String(record.outcome || ""),
    Number.isFinite(record.stageReached) ? (record.stageReached as number) : "",
  ];
}

async function getGoogleAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    },
    privateKey,
    { algorithm: "RS256" },
  );

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
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

  const tokenPayload = (await response.json()) as { access_token?: string };
  if (!tokenPayload?.access_token) {
    throw new Error("Respuesta invalida al obtener token de Google.");
  }

  return tokenPayload.access_token;
}

async function googleSheetsRequest<T = Record<string, unknown>>({
  method,
  url,
  accessToken,
  body,
}: {
  method: "GET" | "POST" | "PUT";
  url: string;
  accessToken: string;
  body?: unknown;
}): Promise<T | null> {
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
  return (await response.json()) as T;
}

async function ensureSheetHeadersAtoG(
  sheetId: string,
  sheetTab: string,
  accessToken: string,
): Promise<void> {
  const headerRange = `${sheetTab}!A1:G1`;
  const getUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(headerRange)}`;

  const getResponse = await googleSheetsRequest<{ values?: string[][] }>({
    method: "GET",
    url: getUrl,
    accessToken,
  });

  const current = Array.isArray(getResponse?.values?.[0]) ? getResponse?.values?.[0] || [] : [];
  const hasHeaders = SHEET_HEADERS_A_TO_G.every((header, index) => current[index] === header);
  if (hasHeaders) return;

  const putUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=RAW`;

  await googleSheetsRequest({
    method: "PUT",
    url: putUrl,
    accessToken,
    body: {
      range: headerRange,
      majorDimension: "ROWS",
      values: [SHEET_HEADERS_A_TO_G],
    },
  });
}

async function appendSheetRowAtoG({
  sheetId,
  sheetTab,
  accessToken,
  row,
}: {
  sheetId: string;
  sheetTab: string;
  accessToken: string;
  row: Array<string | number>;
}): Promise<number> {
  const appendRange = `${sheetTab}!A:G`;
  const appendUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendResponse = await googleSheetsRequest<{ updates?: { updatedRange?: string } }>({
    method: "POST",
    url: appendUrl,
    accessToken,
    body: {
      majorDimension: "ROWS",
      values: [row],
    },
  });

  const rowNumber = parseSheetRowFromUpdatedRange(appendResponse?.updates?.updatedRange || "");
  if (!rowNumber) {
    throw new Error("No se pudo inferir fila de Google Sheets despues del append.");
  }

  return rowNumber;
}

async function updateSheetRowAtoG({
  sheetId,
  sheetTab,
  accessToken,
  row,
  rowNumber,
}: {
  sheetId: string;
  sheetTab: string;
  accessToken: string;
  row: Array<string | number>;
  rowNumber: number;
}): Promise<void> {
  const range = `${sheetTab}!A${rowNumber}:G${rowNumber}`;
  const updateUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  await googleSheetsRequest({
    method: "PUT",
    url: updateUrl,
    accessToken,
    body: {
      range,
      majorDimension: "ROWS",
      values: [row],
    },
  });
}

async function appendToGoogleSheets(record: Stage1Record): Promise<SheetsResult> {
  const { sheetId, sheetTab, serviceAccountEmail, serviceAccountKey } = getSheetsConfig();

  if (!sheetId || !serviceAccountEmail || !serviceAccountKey) {
    return { status: "not_configured" };
  }

  const accessToken = await getGoogleAccessToken(serviceAccountEmail, serviceAccountKey);
  await ensureSheetHeadersAtoG(sheetId, sheetTab, accessToken);

  const row = await appendSheetRowAtoG({
    sheetId,
    sheetTab,
    accessToken,
    row: buildSheetRowAtoG(record),
  });

  return { status: "saved", row };
}

async function persistSheetIntegrationRow({
  recordId,
  row,
  sheetId,
  sheetTab,
}: {
  recordId: string;
  row: number;
  sheetId: string;
  sheetTab: string;
}): Promise<void> {
  await admin
    .firestore()
    .collection(FIRESTORE_RECORDS_COLLECTION)
    .doc(recordId)
    .set(
      {
        integrations: {
          sheets: {
            row,
            spreadsheetId: sheetId,
            tab: sheetTab,
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
      },
      { merge: true },
    );
}

function buildRecordForSheet(
  participantId: string,
  data: FirebaseFirestore.DocumentData,
): Stage1Record {
  const participantNumber = String(data.participantNumber || "").trim();
  if (!participantNumber) {
    throw new HttpsError(
      "failed-precondition",
      "El registro no tiene participantNumber asignado en Firestore.",
    );
  }

  const station =
    normalizeStation(data.stationId) || normalizeStation(data.stationName) || normalizeStation(data.stationCode);

  const stationId = String(data.stationId || station?.stationId || "").trim();
  const stationName = String(data.stationName || station?.stationName || "").trim();
  const stationCode = String(data.stationCode || station?.stationCode || "").trim();

  if (!stationId || !stationName || !stationCode) {
    throw new HttpsError(
      "failed-precondition",
      `El registro ${participantId} no contiene estacion valida para sincronizar.`,
    );
  }

  const ageRaw = Number.parseInt(String(data.age ?? "").trim(), 10);
  const age = Number.isFinite(ageRaw) ? ageRaw : Number.NaN;

  const criterionRaw = Number.parseInt(String(data.criterionAge ?? STAGE1_MIN_AGE).trim(), 10);
  const criterionAge = Number.isFinite(criterionRaw) ? criterionRaw : STAGE1_MIN_AGE;

  const sex = normalizeSex(data.sex) || String(data.sex || "").trim().toUpperCase();
  if (!sex) {
    throw new HttpsError("failed-precondition", `El registro ${participantId} no contiene sexo valido.`);
  }

  const ageMeetsInclusion =
    typeof data.ageMeetsInclusion === "boolean"
      ? data.ageMeetsInclusion
      : Number.isFinite(age)
        ? age >= criterionAge
        : false;

  const outcome =
    String(data.outcome || "").trim() ||
    (ageMeetsInclusion ? "cumple_criterio_edad" : "sin_criterio_inclusion_edad");

  const stageReachedRaw = Number.parseInt(String(data.stageReached ?? "").trim(), 10);
  const stageReached =
    Number.isFinite(stageReachedRaw) && stageReachedRaw > 0
      ? stageReachedRaw
      : ageMeetsInclusion
        ? 2
        : 1;

  const source = String(data.source || "home").trim() || "home";

  const submittedAtIso = String(data.submittedAtIso || "").trim();
  const dateFromSubmittedAt = submittedAtIso ? new Date(submittedAtIso) : null;
  const fecha =
    String(data.fecha || "").trim() ||
    (dateFromSubmittedAt && !Number.isNaN(dateFromSubmittedAt.getTime())
      ? formatDateForSheet(dateFromSubmittedAt)
      : formatDateForSheet(new Date()));

  const participantSequenceRaw = Number.parseInt(String(data.participantSequence ?? "").trim(), 10);
  const participantSequence =
    Number.isFinite(participantSequenceRaw) && participantSequenceRaw > 0 ? participantSequenceRaw : 0;

  return {
    participantNumber,
    participantSequence,
    stationId,
    stationName,
    stationCode,
    sex,
    age,
    criterionAge,
    ageMeetsInclusion,
    outcome,
    stageReached,
    source,
    submittedAtIso,
    fecha,
  };
}

function getSheetRowFromRecord(data: FirebaseFirestore.DocumentData): number | null {
  const integrations = data.integrations;
  if (!integrations || typeof integrations !== "object") return null;

  const sheets = (integrations as { sheets?: { row?: unknown } }).sheets;
  if (!sheets || typeof sheets !== "object") return null;

  return asPositiveRow(sheets.row);
}

export const submitAlgorithmStage1 = onRequest(
  {
    region: "us-central1",
    secrets: [...SHEETS_SECRETS],
  },
  async (req, res) => {
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

    let payload: Record<string, unknown>;
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

    const age = Number.parseInt(String(payload.age ?? "").trim(), 10);
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

    const stage1RecordBase: Stage1RecordBase = {
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

    let allocation: ParticipantAllocation;
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

    const stage1Record: Stage1Record = {
      ...stage1RecordBase,
      stationId: station.stationId,
      stationName: station.stationName,
      stationCode: station.stationCode,
      participantNumber: allocation.participantNumber,
      participantSequence: allocation.participantSequence,
    };

    let sheets: SheetsResult = { status: "error" };
    try {
      sheets = await appendToGoogleSheets(stage1Record);

      if (sheets.status === "saved" && typeof sheets.row === "number") {
        const { sheetId, sheetTab } = getSheetsConfig();
        await persistSheetIntegrationRow({
          recordId: allocation.recordId,
          row: sheets.row,
          sheetId,
          sheetTab,
        });
      }
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
  },
);

export const reserveParticipantNumber = onCall({ region: "us-central1" }, async (request) => {
  const payload = (request.data || {}) as Record<string, unknown>;
  const stationId = String(payload.stationId || "").trim();

  if (!stationId) {
    throw new HttpsError("invalid-argument", "stationId es obligatorio.");
  }

  const station = normalizeStationById(stationId);
  if (!station) {
    throw new HttpsError("invalid-argument", `stationId invalido. Permitidos: ${ALLOWED_STATIONS_TEXT}.`);
  }

  try {
    const allocation = await reserveParticipantNumberTx(station);
    return {
      participantNumber: allocation.participantNumber,
      participantSequence: allocation.participantSequence,
      stationId: allocation.stationId,
      stationCode: allocation.stationCode,
    };
  } catch (error) {
    logger.error("No se pudo reservar numero de participante.", {
      stationId: station.stationId,
      error,
    });
    throw new HttpsError("internal", "No se pudo reservar numero de participante. Reintenta.");
  }
});

export const syncStage1ToSheet = onCall(
  {
    region: "us-central1",
    secrets: [...SHEETS_SECRETS],
  },
  async (request) => {
    const payload = (request.data || {}) as Record<string, unknown>;
    const participantId = String(payload.participantId || "").trim();

    if (!participantId) {
      throw new HttpsError("invalid-argument", "participantId es obligatorio.");
    }

    const { sheetId, sheetTab, serviceAccountEmail, serviceAccountKey } = getSheetsConfig();
    if (!sheetId || !serviceAccountEmail || !serviceAccountKey) {
      throw new HttpsError(
        "failed-precondition",
        "Google Sheets no esta configurado en secrets/env para Functions.",
      );
    }

    try {
      const db = admin.firestore();
      const recordRef = db.collection(FIRESTORE_RECORDS_COLLECTION).doc(participantId);
      const recordSnap = await recordRef.get();

      if (!recordSnap.exists) {
        throw new HttpsError("not-found", `No existe ppccr_stage1_records/${participantId}.`);
      }

      const recordData = recordSnap.data() || {};
      const record = buildRecordForSheet(participantId, recordData);

      const accessToken = await getGoogleAccessToken(serviceAccountEmail, serviceAccountKey);
      await ensureSheetHeadersAtoG(sheetId, sheetTab, accessToken);

      const rowValues = buildSheetRowAtoG(record);
      const existingRow = getSheetRowFromRecord(recordData);

      let row = existingRow;
      let action: "updated" | "appended" = "updated";

      if (row) {
        await updateSheetRowAtoG({
          sheetId,
          sheetTab,
          accessToken,
          row: rowValues,
          rowNumber: row,
        });
      } else {
        row = await appendSheetRowAtoG({
          sheetId,
          sheetTab,
          accessToken,
          row: rowValues,
        });
        action = "appended";
      }

      await persistSheetIntegrationRow({
        recordId: participantId,
        row,
        sheetId,
        sheetTab,
      });

      return {
        ok: true,
        participantId,
        participantNumber: record.participantNumber,
        row,
        action,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("No se pudo sincronizar Etapa 1 a Google Sheets.", {
        participantId,
        error,
      });

      throw new HttpsError("internal", "No se pudo sincronizar Etapa 1 a Google Sheets.");
    }
  },
);
