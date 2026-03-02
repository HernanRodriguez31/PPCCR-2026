# Deploy PPCCR 2026 (Flujo Hibrido)

Este proyecto usa **Firebase Hosting + Cloud Functions** y adopta un flujo hibrido:

- **Hosting automatico** via GitHub Actions para cambios de frontend.
- **Functions manual** por CLI cuando hay cambios backend o secretos.

## Arquitectura de deploy actual

- Hosting publica `public/`.
- Rewrite API principal:
  - `POST /api/algorithm/stage1` -> `submitAlgorithmStage1` (Cloud Functions).
- Workflows CI de hosting:
  - PR: preview channel.
  - Merge a `main`: deploy live.
- Functions:
  - TypeScript (`functions/src` -> `functions/lib`).
  - Node 20.
  - Secrets para integracion con Google Sheets.

## Regla operativa recomendada

1. Si cambias solo `public/**` o config de hosting:
   - PR -> revisar preview URL.
   - Merge a `main` -> deploy live automatico de hosting.

2. Si cambias `functions/src/**`, `functions/package.json` o logica backend:
   - Deploy manual controlado:
   - `npm run deploy:functions`
   - Si tambien cambias frontend:
   - `npm run deploy:full`

3. Si cambias reglas/indexes de Firestore:
   - `npm run deploy:firestore`

## Comandos de deploy

```bash
# Solo hosting
npm run deploy:hosting

# Solo functions (incluye build por predeploy en firebase.json)
npm run deploy:functions

# Hosting + functions
npm run deploy:full

# Firestore rules + indexes
npm run deploy:firestore
```

## Guardrail de secretos (antes de deploy backend)

Verificar que existan secretos requeridos:

```bash
npm run deploy:secrets:check
```

Secrets esperados:

- `PPCCR_STAGE1_SHEET_ID`
- `PPCCR_STAGE1_SHEET_TAB`
- `PPCCR_GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `PPCCR_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## Checklist pre-release

1. Confirmar proyecto activo:
   - `firebase use`
   - Debe apuntar a `ppccr-2026`.
2. Probar localmente si hubo cambios funcionales:
   - `npx firebase emulators:start --only hosting,functions`
3. Revisar consola del navegador en pantallas tocadas.
4. Verificar que no haya archivos sensibles en staging (`.env`, llaves, logs).

## Notas de CI

Los workflows de Hosting tienen `paths` para ejecutar deploy automatico solo cuando cambia:

- `public/**`
- `firebase.json`
- `.firebaserc`
- workflows de hosting

De esta forma, cambios de backend no disparan deploy innecesario de Hosting.
