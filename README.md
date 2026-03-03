# PP CCR 2026 Interinstitucional

## Deploy
Ver [DEPLOY.md](DEPLOY.md) para el flujo hibrido recomendado (hosting automatico + functions manual).

## Seguridad de llaves
Nunca commitear llaves privadas, certificados ni secretos al repositorio.

Si una llave privada fue expuesta (por ejemplo `secrets-jaas/jaas_private.pem`), debe rotarse inmediatamente y reemplazarse en todos los entornos que la usen.

## Exporte Excel Informe FIT
- Endpoint: `/exports/informe-fit-entregados-lab.xlsx`
- Fuente: Google Sheets `Informe de FIT entregados a Lab` (`A1:G`)
- Seguridad: `Authorization: Bearer <idToken>` o fallback `X-PPCCR-EXPORT-KEY`.

### Secrets requeridos (Functions Gen2)
```bash
firebase functions:secrets:set GOOGLE_SA_JSON
firebase functions:secrets:set PPCCR_EXPORT_KEY
```

Notas:
- `GOOGLE_SA_JSON` debe contener el JSON completo del Service Account.
- Compartir el spreadsheet con el email `client_email` del Service Account.
