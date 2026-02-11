"use strict";

const functions = require("firebase-functions");
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

exports.generateJitsiToken = functions.https.onRequest(async (req, res) => {
  res.set("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const roomName = String(body.roomName || "").trim();
    const isModerator = Boolean(body.isModerator);
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

    const token = jwt.sign(
      {
        aud: "jitsi",
        iss: "chat",
        sub: appId,
        room: "*",
        context: {
          user: {
            id: `ppccr-${Date.now()}`,
            name: "PPCCR",
            moderator: isModerator,
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
    res.status(500).json({ error: "Token generation failed" });
  }
});
