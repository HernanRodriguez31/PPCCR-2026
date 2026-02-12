"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const jwt = require("jsonwebtoken");

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

exports.generateJitsiToken = onRequest(
  {
    secrets: ["JAAS_APP_ID", "JAAS_KID", "JAAS_PRIVATE_KEY", "DOCTOR_PIN"],
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const roomName = String(body.roomName || "").trim();
      const requestedModerator = parseModeratorFlag(body.isModerator);
      const isModerator = true;

      if (!roomName) {
        res.status(400).json({ error: "roomName is required" });
        return;
      }

      const appId = getEnvOrThrow("JAAS_APP_ID");
      const kid = getEnvOrThrow("JAAS_KID");
      const privateKey = getPrivateKeyFromEnv();
      const sub = normalizeJaasSub(appId, kid);
      const jaasRoomName = normalizeJaasRoom(sub, roomName);
      const roomClaim = "*";
      if (!jaasRoomName) {
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

      res.status(200).json({
        token,
        roomName: jaasRoomName,
        roomClaim,
        isModerator,
        requestedModerator,
        appId: sub,
        jitsiDomain: "8x8.vc",
      });
    } catch (error) {
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
