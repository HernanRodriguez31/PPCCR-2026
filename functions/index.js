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
    const isModerator = parseModeratorFlag(body.isModerator);
    const doctorPin = String(body.doctorPin || "").trim();

    if (!roomName) {
      res.status(400).json({ error: "roomName is required" });
      return;
    }

    if (isModerator) {
      const expectedPin = getEnvOrThrow("DOCTOR_PIN");
      if (doctorPin !== expectedPin) {
        res.status(403).json({ error: "Invalid doctor PIN" });
        return;
      }
    }

    const appId = getEnvOrThrow("JAAS_APP_ID");
    const kid = getEnvOrThrow("JAAS_KID");
    const privateKey = getPrivateKeyFromEnv();
    const sub = normalizeJaasSub(appId, kid);

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
        room: roomName,
        context: {
          user: userContext,
          features: {
            recording: "false",
            livestreaming: "false",
            transcription: "false",
            "outbound-call": "false",
          },
        },
      },
      privateKey,
      {
        algorithm: "RS256",
        expiresIn: "1h",
        header: {
          kid,
          typ: "JWT",
        },
      },
    );

    res.status(200).json({ token, roomName, isModerator });
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
