# PP CCR 2026 Interinstitucional

## Deploy
Ver [DEPLOY.md](DEPLOY.md) para el flujo hibrido recomendado (hosting automatico + functions manual).

## Seguridad de llaves
Nunca commitear llaves privadas, certificados ni secretos al repositorio.

Si una llave privada fue expuesta (por ejemplo `secrets-jaas/jaas_private.pem`), debe rotarse inmediatamente y reemplazarse en todos los entornos que la usen.

## Exporte Excel Informe FIT
- Endpoint: `/exports/informe-fit-entregados-lab.xlsx`
- Fuente: Google Sheets `Informe de FIT entregados a Lab` (`A1:G`)
- Seguridad: endpoint público (sin auth).
- Nota local:
  - Excel: si abrís con Live Server (`127.0.0.1:5500`), el frontend usa fallback a `https://ppccr-2026.web.app/...` para la descarga.
  - PDF KPI: en localhost el botón usa contingencia local al exportador legacy si no hay server-side usable.

## Exporte PDF KPI
- Camino principal live/emulator: endpoint server-side `/api/export-kpi-pdf-a4`.
- Camino local de contingencia: exportador legacy client-side cuando no hay server-side usable en localhost.
- Importante: para que el PDF live funcione después del commit, `exportKpiPdfA4` debe desplegarse manualmente con `npm run deploy:functions` o `npm run deploy:full`.

### Secrets requeridos (Functions Gen2)
```bash
firebase functions:secrets:get PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL
firebase functions:secrets:get PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

Notas:
- `GOOGLE_SA_JSON` es opcional (solo si querés usar JSON completo por env).
- Compartir el spreadsheet con el service account usado por esos secrets.
