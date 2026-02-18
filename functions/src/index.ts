import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import jwt from "jsonwebtoken";

if (!admin.apps.length) {
  admin.initializeApp();
}

const STAGE1_MIN_AGE_DEFAULT = 45;
const STAGE1_MIN_AGE_PARAM = defineString("PPCCR_STAGE1_MIN_AGE", {
  default: String(STAGE1_MIN_AGE_DEFAULT),
});
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
  "ID Participante",
  "Numero de participante",
  "Tipo de Estacion Saludable",
  "Sexo",
  "Edad",
  "Resultado Paso 1",
  "Exclusion Paso 2",
]);

const SHEET_HEADERS_A_TO_N = Object.freeze([
  "ID Participante",
  "Fecha/Hora",
  "Station ID",
  "Sexo",
  "Edad",
  "Resultado Paso 1",
  "Exclusion Paso 2",
  "Riesgo Paso 3",
  "Resultado Final",
  "Nombre",
  "DNI",
  "Email",
  "Celular",
  "Nro Kit FIT",
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
  clientTimestampIso?: string;
  clientParticipantId?: string;
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
let lastLoggedStage1MinAgeSignature = "";

function getStage1MinAge(): number {
  const raw = String(STAGE1_MIN_AGE_PARAM.value() || "").trim();
  const parsed = Number.parseInt(raw, 10);
  const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 120;
  const effective = valid ? parsed : STAGE1_MIN_AGE_DEFAULT;
  const signature = `${raw}|${effective}|${valid ? "ok" : "fallback"}`;

  if (signature !== lastLoggedStage1MinAgeSignature) {
    if (valid) {
      logger.info("PPCCR_STAGE1_MIN_AGE efectivo.", { minAge: effective });
    } else {
      logger.warn("PPCCR_STAGE1_MIN_AGE inválido. Se usa default.", {
        provided: raw || null,
        fallback: STAGE1_MIN_AGE_DEFAULT,
      });
    }
    lastLoggedStage1MinAgeSignature = signature;
  }

  return effective;
}

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

function normalizeStationLenient(stationId: unknown, participantId: unknown): NormalizedStation | null {
  const fromStationId = normalizeStation(stationId) || normalizeStationById(stationId);
  if (fromStationId) return fromStationId;

  const participantPrefix = String(participantId || "").split("-")[0] || "";
  const fromParticipant = normalizeStation(participantPrefix);
  if (fromParticipant) return fromParticipant;

  return null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
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

    const lastSequence = counterSnap.exists && typeof counterSnap.get("lastSequence") === "number"
      ? counterSnap.get("lastSequence")
      : 0;

    const participantSequence = lastSequence + 1;

    const participantNumber = `${station.stationCode}-${participantSequence}`;

    transaction.set(countersRef, {
      lastSequence: participantSequence,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    allocation = {
      participantNumber,
      participantSequence,
      stationId: station.stationId,
      stationCode: station.stationCode,
    };
  });

  if (!allocation) {
    throw new Error("Fallo allocation en transaccion.");
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
    String(record.clientParticipantId || record.participantNumber || ""),
    String(record.participantNumber || ""),
    String(record.stationName || ""),
    String(record.sex || ""),
    Number.isFinite(record.age) ? (record.age as number) : "",
    String(record.outcome || ""),
    "",
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

async function ensureSheetHeadersAtoN(
  sheetId: string,
  sheetTab: string,
  accessToken: string,
): Promise<void> {
  const headerRange = `${sheetTab}!A1:N1`;
  const getUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(headerRange)}`;

  const getResponse = await googleSheetsRequest<{ values?: string[][] }>({
    method: "GET",
    url: getUrl,
    accessToken,
  });

  const current = Array.isArray(getResponse?.values?.[0]) ? getResponse?.values?.[0] || [] : [];
  const hasHeaders = SHEET_HEADERS_A_TO_N.every((header, index) => current[index] === header);
  if (hasHeaders) return;

  const putUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=RAW`;

  await googleSheetsRequest({
    method: "PUT",
    url: putUrl,
    accessToken,
    body: {
      range: headerRange,
      majorDimension: "ROWS",
      values: [SHEET_HEADERS_A_TO_N],
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

async function appendSheetRowAtoN({
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
  if (row.length !== 14) {
    throw new Error(`appendSheetRowAtoN requiere 14 columnas. Recibidas: ${row.length}.`);
  }

  const appendRange = `${sheetTab}!A:N`;
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

async function updateSheetRange({
  sheetId,
  range,
  accessToken,
  values,
}: {
  sheetId: string;
  range: string;
  accessToken: string;
  values: Array<Array<string | number>>;
}): Promise<void> {
  const updateUrl =
    `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  await googleSheetsRequest({
    method: "PUT",
    url: updateUrl,
    accessToken,
    body: {
      range,
      majorDimension: "ROWS",
      values,
    },
  });
}

async function findParticipantRowInColumnA({
  sheetId,
  sheetTab,
  accessToken,
  participantId,
}: {
  sheetId: string;
  sheetTab: string;
  accessToken: string;
  participantId: string;
}): Promise<number | null> {
  const range = `${sheetTab}!A2:A`;
  const getUrl = `${GOOGLE_SHEETS_API_BASE}/${sheetId}/values/${encodeURIComponent(range)}`;

  const response = await googleSheetsRequest<{ values?: string[][] }>({
    method: "GET",
    url: getUrl,
    accessToken,
  });

  const target = String(participantId || "").trim();
  if (!target) return null;

  const rows = Array.isArray(response?.values) ? response.values : [];
  for (let idx = 0; idx < rows.length; idx += 1) {
    const value = String(rows[idx]?.[0] || "").trim();
    if (value === target) {
      return idx + 2;
    }
  }

  return null;
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

  const stage1MinAge = getStage1MinAge();
  const criterionRaw = Number.parseInt(String(data.criterionAge ?? stage1MinAge).trim(), 10);
  const criterionAge = Number.isFinite(criterionRaw) ? criterionRaw : stage1MinAge;

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

    console.log("📥 Payload recibido:", req.body);

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

    const participantId = String(payload.participantId || "").trim();
    const stationIdInput = String(payload.stationId || "").trim();
    const timestampInput = String(payload.timestamp || "").trim();
    const finalResult = String(payload.finalResult || "").trim();

    const step1Data = asRecord(payload.step1Data);
    const step2Data = asRecord(payload.step2Data);
    const step3Data = asRecord(payload.step3Data);
    const step4Data = asRecord(payload.step4Data);

    const sexInput = String(step1Data?.sex ?? "").trim().toUpperCase();
    const ageInput = step1Data?.age;
    const step1ResultInput = String(step1Data?.result ?? "").trim();

    if (
      !participantId ||
      !stationIdInput ||
      !timestampInput ||
      !finalResult ||
      ageInput === undefined ||
      ageInput === null ||
      !sexInput
    ) {
      res.status(400).json({ error: "Faltan datos", recibidos: req.body });
      return;
    }

    const sex = normalizeSex(sexInput);
    if (!sex) {
      res.status(400).json({
        ok: false,
        message: "Sexo invalido. Valores permitidos: M, F, OTROS.",
      });
      return;
    }

    // Lenient station validation to avoid temporary case/format mismatch issues.
    const station = normalizeStationLenient(stationIdInput, participantId);
    if (!station) {
      res.status(400).json({
        ok: false,
        message: `stationId invalido. Permitidos: ${ALLOWED_STATIONS_TEXT}.`,
      });
      return;
    }

    const age = Number.parseInt(String(ageInput ?? "").trim(), 10);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      res.status(400).json({
        ok: false,
        message: "Edad invalida. Debe estar entre 0 y 120.",
      });
      return;
    }

    const clientTimestamp = new Date(timestampInput);
    if (Number.isNaN(clientTimestamp.getTime())) {
      res.status(400).json({
        ok: false,
        message: "timestamp invalido. Debe ser fecha ISO valida.",
      });
      return;
    }

    const now = clientTimestamp;
    const timestamp = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(",", "");
    const stage1MinAge = getStage1MinAge();
    const ageMeetsInclusion = age >= stage1MinAge;
    const outcome = finalResult || (ageMeetsInclusion ? "cumple_criterio_edad" : "sin_criterio_inclusion_edad");

    const step1Result = step1ResultInput || (ageMeetsInclusion ? "Cumple criterio por edad" : "No incluye por edad");

    const step2Details = step2Data ? String(step2Data.details || "").trim() : "";
    const step3Details = step3Data ? String(step3Data.details || "").trim() : "";
    const step4Name = step4Data ? String(step4Data.name || "").trim() : "";
    const step4Dni = step4Data ? String(step4Data.dni || "").trim() : "";
    const step4Email = step4Data ? String(step4Data.email || "").trim() : "";
    const step4Phone = step4Data ? String(step4Data.phone || "").trim() : "";
    const stage4KitNumber = String(step4Data?.kitNumber || "").trim();

    const rowValues: Array<string | number> = [
      participantId,
      timestamp,
      stationIdInput,
      sexInput,
      age,
      step1Result,
      step2Details,
      step3Details,
      finalResult,
      step4Name,
      step4Dni,
      step4Email,
      step4Phone,
      stage4KitNumber,
    ];

    const stageReached =
      step4Data ? 4 :
        step3Data ? 3 :
          step2Data ? 2 :
            ageMeetsInclusion ? 2 : 1;

    const stage1RecordBase: Stage1RecordBase = {
      fecha: formatDateForSheet(now),
      submittedAtIso: now.toISOString(),
      clientTimestampIso: timestampInput,
      clientParticipantId: participantId,
      sex,
      age,
      criterionAge: stage1MinAge,
      ageMeetsInclusion,
      outcome,
      stageReached,
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

    let sheets: SheetsResult = { status: "error" };
    try {
      const { sheetId, sheetTab, serviceAccountEmail, serviceAccountKey } = getSheetsConfig();
      if (!sheetId || !serviceAccountEmail || !serviceAccountKey) {
        throw new Error(
          "Sheets no configurado. Revisar secrets: PPCCR_STAGE1_SHEET_ID / PPCCR_STAGE1_SHEET_TAB / PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL / PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
        );
      }

      const accessToken = await getGoogleAccessToken(serviceAccountEmail, serviceAccountKey);
      await ensureSheetHeadersAtoN(sheetId, sheetTab, accessToken);
      const row = await appendSheetRowAtoN({
        sheetId,
        sheetTab,
        accessToken,
        row: rowValues,
      });
      sheets = { status: "saved", row };

      // Persistimos el row para poder actualizarlo en pasos 2/3/4.
      await persistSheetIntegrationRow({
        recordId: allocation.recordId,
        row,
        sheetId,
        sheetTab,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      logger.error("Etapa 1: fallo escritura en Google Sheets.", {
        recordId: allocation.recordId,
        participantNumber: allocation.participantNumber,
        stationId: station.stationId,
        error: errMsg,
      });

      // 500 REAL (Firestore ya quedó guardado, pero Sheets es obligatorio)
      res.status(500).json({
        ok: false,
        message: "Etapa 1 guardada en Firestore, pero falló Google Sheets.",
        participantNumber: allocation.participantNumber,
        participantSequence: allocation.participantSequence,
        stationId: station.stationId,
        stationCode: station.stationCode,
        outcome,
        nextStep: ageMeetsInclusion ? 2 : 1,
        firestore: {
          status: "saved",
          id: allocation.recordId,
        },
        sheets: {
          status: "error",
          message: errMsg,
        },
      });
      return;
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

export const updateParticipantStage = onRequest(
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

    console.log("📥 updateParticipantStage payload:", req.body);

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

    const participantId = String(payload.participantId || "").trim();
    const stage = Number.parseInt(String(payload.stage ?? "").trim(), 10);
    const data = payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;

    if (!participantId || !Number.isFinite(stage) || stage < 2 || stage > 4 || !data) {
      res.status(400).json({
        ok: false,
        message: "Payload invalido. Requiere { participantId, stage, data }.",
      });
      return;
    }

    const { sheetId, sheetTab, serviceAccountEmail, serviceAccountKey } = getSheetsConfig();
    if (!sheetId || !serviceAccountEmail || !serviceAccountKey) {
      res.status(500).json({
        ok: false,
        message: "Google Sheets no esta configurado en secrets/env para Functions.",
      });
      return;
    }

    try {
      const accessToken = await getGoogleAccessToken(serviceAccountEmail, serviceAccountKey);
      await ensureSheetHeadersAtoN(sheetId, sheetTab, accessToken);

      const row = await findParticipantRowInColumnA({
        sheetId,
        sheetTab,
        accessToken,
        participantId,
      });

      if (!row) {
        res.status(404).json({
          ok: false,
          message: `No se encontro participantId "${participantId}" en la columna A.`,
        });
        return;
      }

      if (stage === 2) {
        const hasExclusion = Boolean(data.hasExclusion);
        const exclusions = Array.isArray(data.exclusions)
          ? data.exclusions.map((item) => String(item || "").trim()).filter(Boolean)
          : [];

        const exclusionText =
          String(data.exclusionText || "").trim() ||
          (exclusions.length > 0
            ? exclusions.join(" | ")
            : hasExclusion
              ? "Exclusion detectada en Paso 2"
              : "Sin exclusion en Paso 2");

        await updateSheetRange({
          sheetId,
          range: `${sheetTab}!G${row}`,
          accessToken,
          values: [[exclusionText]],
        });

        if (hasExclusion || exclusions.length > 0) {
          await updateSheetRange({
            sheetId,
            range: `${sheetTab}!I${row}`,
            accessToken,
            values: [["Excluido"]],
          });
        }

        res.status(200).json({
          ok: true,
          participantId,
          stage,
          row,
          updated: hasExclusion || exclusions.length > 0 ? ["G", "I"] : ["G"],
        });
        return;
      }

      if (stage === 3) {
        const hasHighRisk = Boolean(data.hasHighRisk);
        const riskFlags = Array.isArray(data.riskFlags)
          ? data.riskFlags.map((item) => String(item || "").trim()).filter(Boolean)
          : [];

        const riskText =
          String(data.riskText || "").trim() ||
          (riskFlags.length > 0
            ? riskFlags.join(" | ")
            : hasHighRisk
              ? "Riesgo detectado en Paso 3"
              : "Sin riesgo en Paso 3");

        await updateSheetRange({
          sheetId,
          range: `${sheetTab}!H${row}`,
          accessToken,
          values: [[riskText]],
        });

        if (hasHighRisk || riskFlags.length > 0) {
          await updateSheetRange({
            sheetId,
            range: `${sheetTab}!I${row}`,
            accessToken,
            values: [["Excluido"]],
          });
        }

        res.status(200).json({
          ok: true,
          participantId,
          stage,
          row,
          updated: hasHighRisk || riskFlags.length > 0 ? ["H", "I"] : ["H"],
        });
        return;
      }

      const finalResult = String(data.finalResult || data.result || "Candidato FIT").trim() || "Candidato FIT";
      const fullName = String(data.fullName || "").trim();
      const documentId = String(data.documentId || "").trim();
      const email = String(data.email || "").trim();
      const phone = String(data.phone || "").trim();
      const kitNumber = String(data.kitNumber || "").trim();

      await updateSheetRange({
        sheetId,
        range: `${sheetTab}!I${row}:N${row}`,
        accessToken,
        values: [[finalResult, fullName, documentId, email, phone, kitNumber]],
      });

      res.status(200).json({
        ok: true,
        participantId,
        stage,
        row,
        updated: ["I", "J", "K", "L", "M", "N"],
      });
    } catch (error) {
      logger.error("No se pudo actualizar etapa del participante en Google Sheets.", {
        participantId,
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        ok: false,
        message: "No se pudo actualizar Google Sheets.",
      });
    }
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
    console.error("ERROR REAL reserveParticipantNumber:", error);
    throw error;
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
