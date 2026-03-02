# PP CCR 2026 Interinstitucional

## Deploy
Ver [DEPLOY.md](DEPLOY.md) para el flujo hibrido recomendado (hosting automatico + functions manual).

## Seguridad de llaves
Nunca commitear llaves privadas, certificados ni secretos al repositorio.

Si una llave privada fue expuesta (por ejemplo `secrets-jaas/jaas_private.pem`), debe rotarse inmediatamente y reemplazarse en todos los entornos que la usen.
