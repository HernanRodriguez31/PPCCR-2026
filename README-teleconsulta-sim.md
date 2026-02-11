# Simulador Teleconsulta (3 estaciones)

Este script permite probar la cola de llamadas y aceptación automática sin intervención humana.

## Requisitos

1. Inicializar paquete local (si no existe):
```bash
npm init -y
```

2. Instalar Admin SDK:
```bash
npm i firebase-admin
```

3. Exportar credencial de service account:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/service-account.json"
```

Opcional:
```bash
export FIREBASE_PROJECT_ID="ppccr-2026"
export FIREBASE_DATABASE_URL="https://ppccr-2026-default-rtdb.firebaseio.com"
```

## Ejecutar simulación

```bash
node scripts/teleconsulta-sim.mjs
```

## Flujo simulado

1. `saavedra` llama a `admin`.
2. `admin` acepta y queda `in-call`.
3. Mientras tanto `rivadavia` llama a `admin`.
4. La segunda llamada pasa a `queued` y se publica `call_queue` en chat.
5. Al terminar la primera llamada, `admin` atiende la segunda.
