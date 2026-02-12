"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

const MAX_PARTICIPANTS = 2;
const ROOM_LOCK_TTL_MS = 45_000;
const ROOM_HEARTBEAT_MS = 15_000;
const ROOM_LOCKS_ROOT = "ppccr/teleconsulta/roomLocks";
const ROOM_FULL_ERROR = "Sala ocupada / Teleconsulta en curso";
const DEFAULT_PARTICIPANT_PREFIX = "p";
const ALLOWED_ACTIONS = new Set(["join", "heartbeat", "leave"]);

function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function getPrivateKeyFromEnv() {
  const raw = getEnvOrThrow("JAAS_PRIVATE_KEY");
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function parseModeratorFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}

function normalizeJaasSub(appId, kid) {
  const appValue = String(appId || "").trim();
  const kidPrefix = String(kid || "").trim().split("/")[0].trim();

  if (kidPrefix.startsWith("vpaas-magic-cookie-")) {
    return kidPrefix;
  }

  const match = appValue.match(/vpaas-magic-cookie-[a-z0-9-]+/i);
  if (match && match[0]) {
    return match[0];
  }

  if (appValue.startsWith("vpaas-magic-cookie-")) {
    return appValue;
  }

  return `vpaas-magic-cookie-${appValue}`;
}

function normalizeJaasRoom(sub, roomName) {
  const tenant = String(sub || "").trim();
  const rawRoom = String(roomName || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!rawRoom) return "";
  if (!tenant) return rawRoom;
  if (rawRoom.startsWith(`${tenant}/`)) return rawRoom;
  if (/^vpaas-magic-cookie-[a-z0-9-]+\/.+$/i.test(rawRoom)) return rawRoom;

  return `${tenant}/${rawRoom}`;
}

function parseJsonCandidate(candidate) {
  if (!candidate) return null;

  if (typeof candidate === "object") {
    if (Buffer.isBuffer(candidate)) {
      const asText = candidate.toString("utf8");
      if (!asText) return null;
      try {
        const parsed = JSON.parse(asText);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
      } catch (error) {
        return null;
      }
    }
    if (!Array.isArray(candidate)) {
      return candidate;
    }
    return null;
  }

  if (typeof candidate === "string") {
    const text = candidate.trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  return null;
}

function parseRequestBody(req) {
  const fromBody = parseJsonCandidate(req.body);
  if (fromBody) return fromBody;
  const fromRaw = parseJsonCandidate(req.rawBody);
  if (fromRaw) return fromRaw;
  return {};
}

function sanitizeAction(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ALLOWED_ACTIONS.has(normalized) ? normalized : "join";
}

function sanitizeRoomName(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^\w/-]/g, "");
  return normalized.slice(0, 180);
}

function sanitizeParticipantId(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return normalized.slice(0, 80);
}

function sanitizeStationId(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  if (!normalized) return "unknown";
  return normalized.slice(0, 40);
}

function sanitizeRole(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "medic" ? "medic" : "station";
}

function sanitizeCallId(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return normalized.slice(0, 100);
}

function buildRoomLockKey(roomName) {
  return crypto.createHash("sha256").update(String(roomName || "")).digest("hex");
}

function buildServerParticipantId() {
  const randomPart = crypto.randomBytes(5).toString("hex");
  return `${DEFAULT_PARTICIPANT_PREFIX}_${Date.now().toString(36)}_${randomPart}`;
}

function toFiniteTimestamp(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeParticipants(participantsNode, nowMs, ttlMs) {
  if (!participantsNode || typeof participantsNode !== "object") return {};

  const nextParticipants = {};
  Object.entries(participantsNode).forEach(([rawParticipantId, rawData]) => {
    const participantId = sanitizeParticipantId(rawParticipantId);
    if (!participantId) return;
    if (!rawData || typeof rawData !== "object") return;

    const current = /** @type {{lastSeenAt?: unknown, joinedAt?: unknown, stationId?: unknown, role?: unknown, callId?: unknown}} */ (
      rawData
    );
    const lastSeenAt = toFiniteTimestamp(current.lastSeenAt, 0);
    if (!lastSeenAt) return;
    if (nowMs - lastSeenAt > ttlMs) return;

    const joinedAt = toFiniteTimestamp(current.joinedAt, lastSeenAt);
    nextParticipants[participantId] = {
      participantId,
      stationId: sanitizeStationId(current.stationId),
      role: sanitizeRole(current.role),
      callId: sanitizeCallId(current.callId),
      joinedAt,
      lastSeenAt,
    };
  });

  return nextParticipants;
}

function participantCount(lockNode, nowMs, ttlMs) {
  if (!lockNode || typeof lockNode !== "object") return 0;
  const typed = /** @type {{participants?: unknown}} */ (lockNode);
  return Object.keys(normalizeParticipants(typed.participants, nowMs, ttlMs)).length;
}

function buildRoomLockRef(roomId) {
  return db.ref(`${ROOM_LOCKS_ROOT}/${roomId}`);
}

function logRoom(action, payload) {
  console.log(`[ROOM_LOCK] ${action}`, payload);
}

async function reserveParticipantSlot({
  roomRef,
  roomId,
  roomName,
  participantId,
  stationId,
  role,
  callId,
}) {
  const nowMs = Date.now();
  let blockedByCapacity = false;
  let blockedParticipants = 0;

  const txResult = await roomRef.transaction((currentValue) => {
    const currentNode =
      currentValue && typeof currentValue === "object"
        ? /** @type {{participants?: unknown, createdAt?: unknown}} */ (currentValue)
        : {};

    const participants = normalizeParticipants(
      currentNode.participants,
      nowMs,
      ROOM_LOCK_TTL_MS,
    );
    const activeCount = Object.keys(participants).length;
    const hasExistingParticipant = Boolean(participants[participantId]);

    if (!hasExistingParticipant && activeCount >= MAX_PARTICIPANTS) {
      blockedByCapacity = true;
      blockedParticipants = activeCount;
      return;
    }

    const existing = participants[participantId];
    participants[participantId] = {
      participantId,
      stationId,
      role,
      callId,
      joinedAt: toFiniteTimestamp(existing?.joinedAt, nowMs),
      lastSeenAt: nowMs,
    };

    return {
      roomId,
      roomName,
      createdAt: toFiniteTimestamp(currentNode.createdAt, nowMs),
      updatedAt: nowMs,
      leaseTtlMs: ROOM_LOCK_TTL_MS,
      heartbeatIntervalMs: ROOM_HEARTBEAT_MS,
      participants,
    };
  });

  if (txResult.committed && txResult.snapshot.exists()) {
    const nextNode = txResult.snapshot.val();
    const count = participantCount(nextNode, nowMs, ROOM_LOCK_TTL_MS);
    return {
      ok: true,
      participants: count,
    };
  }

  if (blockedByCapacity) {
    const snapshot = await roomRef.once("value");
    const count = participantCount(snapshot.val(), nowMs, ROOM_LOCK_TTL_MS) || blockedParticipants;
    return {
      ok: false,
      blocked: true,
      participants: count,
    };
  }

  const fallbackSnapshot = await roomRef.once("value");
  return {
    ok: false,
    blocked: false,
    participants: participantCount(fallbackSnapshot.val(), nowMs, ROOM_LOCK_TTL_MS),
  };
}

async function heartbeatParticipantSlot({
  roomRef,
  participantId,
  stationId,
  role,
  callId,
}) {
  const nowMs = Date.now();
  let foundParticipant = false;

  const txResult = await roomRef.transaction((currentValue) => {
    if (!currentValue || typeof currentValue !== "object") return currentValue;

    const currentNode = /** @type {{participants?: unknown, createdAt?: unknown}} */ (currentValue);
    const participants = normalizeParticipants(
      currentNode.participants,
      nowMs,
      ROOM_LOCK_TTL_MS,
    );

    const existing = participants[participantId];
    if (!existing) {
      if (!Object.keys(participants).length) return null;
      return {
        ...currentNode,
        updatedAt: nowMs,
        leaseTtlMs: ROOM_LOCK_TTL_MS,
        heartbeatIntervalMs: ROOM_HEARTBEAT_MS,
        participants,
      };
    }

    foundParticipant = true;
    participants[participantId] = {
      ...existing,
      stationId,
      role,
      callId,
      lastSeenAt: nowMs,
    };

    return {
      ...currentNode,
      updatedAt: nowMs,
      leaseTtlMs: ROOM_LOCK_TTL_MS,
      heartbeatIntervalMs: ROOM_HEARTBEAT_MS,
      participants,
    };
  });

  const roomNode = txResult.snapshot.exists() ? txResult.snapshot.val() : null;
  return {
    ok: foundParticipant,
    participants: participantCount(roomNode, nowMs, ROOM_LOCK_TTL_MS),
  };
}

async function releaseParticipantSlot({ roomRef, participantId }) {
  const nowMs = Date.now();
  let removedParticipant = false;

  const txResult = await roomRef.transaction((currentValue) => {
    if (!currentValue || typeof currentValue !== "object") return currentValue;

    const currentNode = /** @type {{participants?: unknown}} */ (currentValue);
    const participants = normalizeParticipants(
      currentNode.participants,
      nowMs,
      ROOM_LOCK_TTL_MS,
    );

    if (participants[participantId]) {
      removedParticipant = true;
      delete participants[participantId];
    }

    if (!Object.keys(participants).length) {
      return null;
    }

    return {
      ...currentNode,
      updatedAt: nowMs,
      leaseTtlMs: ROOM_LOCK_TTL_MS,
      heartbeatIntervalMs: ROOM_HEARTBEAT_MS,
      participants,
    };
  });

  const roomNode = txResult.snapshot.exists() ? txResult.snapshot.val() : null;
  return {
    ok: removedParticipant,
    participants: participantCount(roomNode, nowMs, ROOM_LOCK_TTL_MS),
  };
}

exports.generateJitsiToken = onRequest(
  {
    secrets: ["JAAS_APP_ID", "JAAS_KID", "JAAS_PRIVATE_KEY", "DOCTOR_PIN"],
  },
  async (req, res) => {
    let reservedRoomRef = null;
    let reservedParticipantId = "";
    let reservedRoomId = "";
    let reservedRoomName = "";

    res.set("Cache-Control", "no-store");

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    try {
      const body = parseRequestBody(req);
      const action = sanitizeAction(body.action);
      const roomName = sanitizeRoomName(body.roomName);
      const requestedModerator = parseModeratorFlag(body.isModerator);
      const isModerator = true;

      if (!roomName) {
        res.status(400).json({ error: "roomName is required" });
        return;
      }

      const roomId = buildRoomLockKey(roomName);
      const roomRef = buildRoomLockRef(roomId);
      const participantIdFromClient = sanitizeParticipantId(body.participantId);
      const participantId = participantIdFromClient || buildServerParticipantId();
      const stationId = sanitizeStationId(body.stationId);
      const role = sanitizeRole(body.role);
      const callId = sanitizeCallId(body.callId);

      if ((action === "heartbeat" || action === "leave") && !participantIdFromClient) {
        res.status(400).json({ error: "participantId is required", code: "INVALID_PARTICIPANT" });
        return;
      }

      if (action === "heartbeat") {
        const heartbeatResult = await heartbeatParticipantSlot({
          roomRef,
          participantId,
          stationId,
          role,
          callId,
        });

        logRoom("heartbeat", {
          roomId,
          roomName,
          stationId,
          role,
          participantId,
          participants: heartbeatResult.participants,
          found: heartbeatResult.ok,
        });

        res.status(200).json({
          ok: heartbeatResult.ok,
          action: "heartbeat",
          roomId,
          roomName,
          participantId,
          participants: heartbeatResult.participants,
          maxParticipants: MAX_PARTICIPANTS,
        });
        return;
      }

      if (action === "leave") {
        const releaseResult = await releaseParticipantSlot({
          roomRef,
          participantId,
        });

        logRoom("leave", {
          roomId,
          roomName,
          stationId,
          role,
          participantId,
          participants: releaseResult.participants,
          removed: releaseResult.ok,
        });

        res.status(200).json({
          ok: releaseResult.ok,
          action: "leave",
          roomId,
          roomName,
          participantId,
          participants: releaseResult.participants,
          maxParticipants: MAX_PARTICIPANTS,
        });
        return;
      }

      const reserveResult = await reserveParticipantSlot({
        roomRef,
        roomId,
        roomName,
        participantId,
        stationId,
        role,
        callId,
      });

      if (!reserveResult.ok && reserveResult.blocked) {
        logRoom("blocked", {
          roomId,
          roomName,
          stationId,
          role,
          participantId,
          participants: reserveResult.participants,
          reason: "room_full",
        });

        res.status(409).json({
          error: ROOM_FULL_ERROR,
          code: "ROOM_FULL",
          roomId,
          roomName,
          participants: reserveResult.participants,
          maxParticipants: MAX_PARTICIPANTS,
        });
        return;
      }

      if (!reserveResult.ok) {
        logRoom("reserve-failed", {
          roomId,
          roomName,
          stationId,
          role,
          participantId,
          participants: reserveResult.participants,
          reason: "transaction_not_committed",
        });
        res.status(500).json({ error: "No se pudo reservar cupo de sala" });
        return;
      }

      reservedRoomRef = roomRef;
      reservedParticipantId = participantId;
      reservedRoomId = roomId;
      reservedRoomName = roomName;

      const appId = getEnvOrThrow("JAAS_APP_ID");
      const kid = getEnvOrThrow("JAAS_KID");
      const privateKey = getPrivateKeyFromEnv();
      const sub = normalizeJaasSub(appId, kid);
      const jaasRoomName = normalizeJaasRoom(sub, roomName);
      const roomClaim = "*";
      if (!jaasRoomName) {
        await releaseParticipantSlot({
          roomRef,
          participantId,
        }).catch(() => {
          // no-op
        });
        reservedRoomRef = null;
        reservedParticipantId = "";
        res.status(400).json({ error: "roomName is invalid" });
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const userContext = {
        id: `ppccr-${Date.now()}`,
        name: "PPCCR",
      };
      if (isModerator) {
        userContext.moderator = true;
      }

      const token = jwt.sign(
        {
          aud: "jitsi",
          iss: "chat",
          sub,
          room: roomClaim,
          nbf: now - 10,
          exp: now + 60 * 60,
          context: {
            user: userContext,
            features: {
              recording: "false",
              livestreaming: "false",
              transcription: "false",
              "outbound-call": "false",
            },
            room: {
              regex: false,
            },
          },
        },
        privateKey,
        {
          algorithm: "RS256",
          header: {
            kid,
            typ: "JWT",
          },
        },
      );

      logRoom("granted", {
        roomId,
        roomName,
        stationId,
        role,
        participantId,
        participants: reserveResult.participants,
      });

      res.status(200).json({
        token,
        roomName: jaasRoomName,
        roomClaim,
        isModerator,
        requestedModerator,
        participantId,
        roomLock: {
          roomId,
          participants: reserveResult.participants,
          maxParticipants: MAX_PARTICIPANTS,
          leaseTtlMs: ROOM_LOCK_TTL_MS,
          heartbeatIntervalMs: ROOM_HEARTBEAT_MS,
        },
        appId: sub,
        jitsiDomain: "8x8.vc",
      });
    } catch (error) {
      if (reservedRoomRef && reservedParticipantId) {
        try {
          await releaseParticipantSlot({
            roomRef: reservedRoomRef,
            participantId: reservedParticipantId,
          });
          logRoom("rollback", {
            roomId: reservedRoomId,
            roomName: reservedRoomName,
            participantId: reservedParticipantId,
            reason: "join_failure_after_reserve",
          });
        } catch (rollbackError) {
          console.error("[ROOM_LOCK] rollback_failed", rollbackError);
        }
      }

      console.error("[generateJitsiToken]", error);
      if (req.query.debug === "1") {
        res.status(500).json({
          error: "Token generation failed",
          detail: String(error && error.message ? error.message : error),
        });
        return;
      }
      res.status(500).json({ error: "Token generation failed" });
    }
  },
);
